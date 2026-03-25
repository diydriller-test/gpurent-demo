"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, removeToken } from "@/lib/token";

type DocSection = {
  id: string;
  title: string;
  method: string;
  path: string;
  description: string;
  requestLabel?: string;
  request: string;
  responseLabel?: string;
  response: string;
  notes?: string[];
};

const BASE_URL_NOTE =
  "브라우저에서 호출 시 동일 오리진 기준 상대 경로(예: /api/chat)를 사용합니다.";

const SECTIONS: DocSection[] = [
  {
    id: "text",
    title: "Text (LLM)",
    method: "POST",
    path: "/api/chat",
    description:
      "프롬프트 입력에 대해 한국어로 텍스트 응답을 생성합니다. 내부적으로 LLM 업스트림과 연동됩니다.",
    requestLabel: "본문 (application/json)",
    request: `{
  "input": "질문 또는 지시문",
  "temperature": 0.1
}`,
    responseLabel: "성공 (200)",
    response: `{
  "text": "모델이 생성한 한국어 답변 문자열"
}`,
    notes: [
      "`temperature`는 생략 시 0.1에 가깝게 처리됩니다.",
      "한도 초과 시 429와 `{ \"error\": \"일일 체험 한도를 초과했습니다. ...\" }` 형태로 응답할 수 있습니다.",
    ],
  },
  {
    id: "embedding",
    title: "Embedding",
    method: "POST",
    path: "/api/embedding",
    description: "입력 텍스트를 임베딩 벡터(숫자 배열)로 변환합니다.",
    requestLabel: "본문 (application/json)",
    request: `{
  "input": "임베딩할 문장",
  "input_type": "string"
}`,
    responseLabel: "성공 (200)",
    response: `{
  "embeddingVector": [0.012, -0.034, "..."]
}`,
    notes: [
      "`text` 필드로 보내도 동작합니다(내부에서 `input`과 동일하게 처리).",
      "업스트림 오류 시 `error` 메시지와 함께 비-200 상태 코드가 반환될 수 있습니다.",
    ],
  },
  {
    id: "rerank",
    title: "Re-ranking",
    method: "POST",
    path: "/api/rerank",
    description: "질의와 후보 문장 목록을 받아 관련도에 따라 재정렬하는 결과를 반환합니다.",
    requestLabel: "본문 (application/json)",
    request: `{
  "query": "검색 질의",
  "input": ["후보 문장 1", "후보 문장 2"]
}`,
    responseLabel: "성공 (200)",
    response: `{
  "...": "업스트림 Re-rank 응답 구조가 그대로 전달됩니다."
}`,
    notes: [
      "`query`는 비어 있으면 안 되고, `input`은 문자열 배열이어야 합니다.",
    ],
  },
  {
    id: "stt",
    title: "STT (Speech-to-Text)",
    method: "POST",
    path: "/api/stt",
    description:
      "음성 파일을 업로드하여 텍스트로 변환합니다. `multipart/form-data`로 전송합니다.",
    requestLabel: "본문 (multipart/form-data)",
    request: `필드:
  file        — 오디오 파일 (필수)
  language    — 선택
  task        — 선택
  beam_size   — 선택
  vad_filter  — 선택`,
    responseLabel: "성공",
    response: `업스트림 STT 서비스의 JSON 응답이 그대로 반환됩니다.`,
    notes: [
      "최대 실행 시간 제한이 있어 장시간 처리 시 504(시간 초과)가 날 수 있습니다.",
      "`file`이 없으면 400과 안내 메시지가 반환됩니다.",
    ],
  },
];

export default function DocsPage() {
  const router = useRouter();
  const hasToken = !!getToken();

  return (
    <div className="min-h-screen bg-grid-pattern">
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-accent">GPU</span>
            <span className="font-mono text-lg font-medium text-foreground/90">Modu</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              홈
            </Link>
            <Link
              href="/api-test"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              API 체험
            </Link>
            <Link
              href="/plans"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              플랜
            </Link>
            <span
              aria-disabled="true"
              className="cursor-not-allowed text-sm text-foreground/35"
            >
              API 문서
            </span>
            {hasToken ? (
              <button
                type="button"
                onClick={() => {
                  removeToken();
                  router.push("/");
                  router.refresh();
                }}
                className="text-sm text-foreground/70 transition-colors hover:text-accent"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                시작하기
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-12 lg:py-16">
        <aside className="shrink-0 lg:w-56">
          <nav
            aria-label="문서 목차"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/40">
              On this page
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="#overview"
                  className="block rounded-lg px-2 py-1.5 text-foreground/70 transition-colors hover:bg-white/5 hover:text-accent"
                >
                  개요 · 인증
                </a>
              </li>
              <li>
                <a
                  href="#tts-note"
                  className="block rounded-lg px-2 py-1.5 text-foreground/70 transition-colors hover:bg-white/5 hover:text-accent"
                >
                  TTS (체험)
                </a>
              </li>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-lg px-2 py-1.5 text-foreground/70 transition-colors hover:bg-white/5 hover:text-accent"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-12 scroll-mt-28" id="overview">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              API 문서
            </h1>
            <p className="mt-4 max-w-2xl text-foreground/70">
              GPUModu 데모 앱이 제공하는 HTTP 엔드포인트 요약입니다. 요청 시
              발급받은 액세스 토큰이 필요한 경우, 아래 헤더를 포함합니다.
            </p>
            <p className="mt-3 max-w-2xl border-l-2 border-accent/40 pl-4 text-sm leading-relaxed text-foreground/60">
              앞으로도 새로운 API가 계속 추가되고, 기존 엔드포인트 스펙도 개선될
              예정입니다. 아래 목록은 시점에 따라 늘어나거나 바뀔 수 있으니
              공지·문서 업데이트를 함께 확인해 주세요.
            </p>
            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-surface/50 p-4 font-mono text-sm">
              <p className="text-foreground/50">Authorization: Bearer {"<your_access_token>"}</p>
              <p className="border-t border-white/10 pt-3 text-foreground/45">
                {BASE_URL_NOTE}
              </p>
            </div>
          </header>

          <section
            id="tts-note"
            className="mb-12 scroll-mt-28 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">
              TTS (텍스트 음성 변환)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              <Link href="/api-test" className="text-accent underline-offset-2 hover:underline">
                API 체험
              </Link>
              화면에서는 TTS를 Mock으로 미리 들어볼 수 있습니다. 현재 이 저장소에는{" "}
              <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs">
                /api/tts
              </code>{" "}
              같은 별도 REST 라우트가 없으며, Embedding · Re-ranking · STT · Text(LLM)는 아래
              엔드포인트로 호출합니다.
            </p>
          </section>

          <div className="space-y-12">
            {SECTIONS.map((api) => (
              <section
                key={api.id}
                id={api.id}
                className="scroll-mt-28 rounded-2xl border border-white/5 bg-surface/50 p-6 md:p-8"
              >
                <div className="mb-4 flex flex-wrap items-baseline gap-3">
                  <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                    {api.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-accent/20 px-2 py-1 font-mono text-xs font-medium text-accent md:text-sm">
                      {api.method}
                    </span>
                    <code className="rounded-lg bg-background/50 px-2 py-1 font-mono text-sm text-foreground/90">
                      {api.path}
                    </code>
                  </div>
                </div>
                <p className="mb-6 text-foreground/65">{api.description}</p>

                <div className="grid gap-6 md:grid-cols-1 md:gap-8 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                      {api.requestLabel ?? "요청"}
                    </h3>
                    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-background/40 p-4 font-mono text-xs leading-relaxed text-foreground/85 md:text-sm">
                      {api.request.trim()}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                      {api.responseLabel ?? "응답"}
                    </h3>
                    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-background/40 p-4 font-mono text-xs leading-relaxed text-foreground/85 md:text-sm">
                      {api.response.trim()}
                    </pre>
                  </div>
                </div>

                {api.notes && api.notes.length > 0 ? (
                  <ul className="mt-6 list-disc space-y-1.5 pl-5 text-sm text-foreground/55">
                    {api.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <p className="mt-14 border-t border-white/10 pt-10 text-center text-sm text-foreground/45">
            API는 지속적으로 추가·확장되며, 엔드포인트와 제한 사항은 서비스
            업데이트에 따라 달라질 수 있습니다. 최신 동작은{" "}
            <Link href="/api-test" className="text-accent hover:underline">
              API 체험
            </Link>
            과 실제 응답을 기준으로 확인해 주세요.
          </p>
        </main>
      </div>
    </div>
  );
}
