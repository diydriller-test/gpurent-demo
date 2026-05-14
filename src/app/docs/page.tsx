"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PlatformCard,
  PlatformButton,
  PlatformPageHeader,
  PlatformShell,
} from "@/components/platform/PlatformShell";

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

type SnippetLanguage = "curl" | "typescript" | "python";

type QuickstartSnippet = {
  id: SnippetLanguage;
  label: string;
  code: string;
};

const BASE_URL_NOTE =
  "브라우저에서 호출할 때는 /api/chat처럼 same-origin relative path를 사용하세요.";

const QUICKSTART_SNIPPETS: QuickstartSnippet[] = [
  {
    id: "curl",
    label: "cURL",
    code: `curl -X POST "$AI_OMAKASE_BASE_URL/api/chat" \\
  -H "Authorization: Bearer $AI_OMAKASE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "Summarize this incident report and suggest next actions.",
    "temperature": 0.1
  }'`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    code: `const response = await fetch(\`\${baseUrl}/api/chat\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${apiKey}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    input: "Summarize this incident report and suggest next actions.",
    temperature: 0.1,
  }),
});

if (!response.ok) {
  throw new Error(\`AI API request failed: \${response.status}\`);
}

const result = await response.json();
console.log(result.text);`,
  },
  {
    id: "python",
    label: "Python",
    code: `import os
import requests

response = requests.post(
    f"{os.environ['AI_OMAKASE_BASE_URL']}/api/chat",
    headers={
        "Authorization": f"Bearer {os.environ['AI_OMAKASE_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "input": "Summarize this incident report and suggest next actions.",
        "temperature": 0.1,
    },
    timeout=60,
)
response.raise_for_status()
print(response.json()["text"])`,
  },
];

const QUICKSTART_STEPS = [
  {
    label: "01",
    title: "Create an API key",
    body: "계정에서 API key를 만들고 server-side environment variable로 보관하세요. client bundle에는 절대 포함하지 않습니다.",
  },
  {
    label: "02",
    title: "Call the selected endpoint",
    body: "Workbench에서 테스트한 API를 고르고, endpoint reference에 있는 request body로 호출합니다.",
  },
  {
    label: "03",
    title: "Read the result",
    body: "response는 제품에 붙이기 쉬운 형태로 유지됩니다. cost와 latency는 usage view에서 확인하세요.",
  },
];

const USE_CASES = [
  {
    title: "Support triage",
    body: "티켓 요약, 우선순위 분류, 다음 액션 제안은 text endpoint 하나로 시작할 수 있습니다.",
    path: "/api/chat",
  },
  {
    title: "RAG search",
    body: "Embedding으로 후보를 만들고 Re-ranking으로 문맥 관련도에 맞게 정렬합니다.",
    path: "/api/embedding + /api/rerank",
  },
  {
    title: "Voice workflow",
    body: "STT, TTS, Voice Clone을 같은 auth flow와 usage model 안에서 연결합니다.",
    path: "/api/stt + /api/tts",
  },
];

const ERROR_ROWS = [
  {
    status: "400",
    meaning: "request body, file, required field가 올바르지 않습니다.",
    action: "field name과 Content-Type을 먼저 확인하세요.",
  },
  {
    status: "401 / 403",
    meaning: "API key 또는 계정 권한이 유효하지 않습니다.",
    action: "Authorization header와 key 상태를 확인하세요.",
  },
  {
    status: "429",
    meaning: "일일 체험 한도 또는 usage limit에 도달했습니다.",
    action: "usage를 확인하거나 더 높은 plan을 선택하세요.",
  },
  {
    status: "500 / 502",
    meaning: "내부 처리 또는 upstream model response가 실패했습니다.",
    action: "retry handling을 추가하고 같은 입력이 반복 실패하면 log를 확인하세요.",
  },
  {
    status: "504",
    meaning: "voice, vision, long-form 작업이 time limit을 초과했습니다.",
    action: "input size를 줄이거나 async flow로 나눠 처리하세요.",
  },
];

const SECTIONS: DocSection[] = [
  {
    id: "text",
    title: "Text (LLM)",
    method: "POST",
    path: "/api/chat",
    description:
      "Generates a text response from a prompt through the text generation endpoint.",
    requestLabel: "Body (application/json)",
    request: `{
  "input": "Question or instruction",
  "temperature": 0.1
}`,
    responseLabel: "Success (200)",
    response: `{
  "text": "Generated response text"
}`,
    notes: [
      "`temperature` defaults near 0.1 when omitted.",
      "Usage limits may return 429 with an `error` payload.",
    ],
  },
  {
    id: "embedding",
    title: "Embedding",
    method: "POST",
    path: "/api/embedding",
    description: "Converts input text into an embedding vector.",
    requestLabel: "Body (application/json)",
    request: `{
  "input": "Text to embed",
  "input_type": "string"
}`,
    responseLabel: "Success (200)",
    response: `{
  "embeddingVector": [0.012, -0.034, ...]
}`,
    notes: [
      "`text` is also accepted and normalized to `input` internally.",
      "Upstream failures may return a non-200 status with an `error` message.",
    ],
  },
  {
    id: "rerank",
    title: "Re-ranking",
    method: "POST",
    path: "/api/rerank",
    description: "Ranks candidate passages by relevance to a query.",
    requestLabel: "Body (application/json)",
    request: `{
  "query": "Search query",
  "input": ["Candidate passage 1", "Candidate passage 2"]
}`,
    responseLabel: "Success (200)",
    response: `// The upstream Re-rank API response is passed through.`,
    notes: [
      "`query` must not be empty, and `input` must be an array of strings.",
    ],
  },
  {
    id: "tts",
    title: "TTS (Text-to-Speech)",
    method: "POST",
    path: "/api/tts",
    description:
      "Synthesizes speech from text through the upstream TTS service. Use `GET /api/tts` to fetch available speakers.",
    requestLabel: "Body (application/json)",
    request: `{
  "text": "Text to read (required)",
  "language": "ko | korean | english | japanese (optional)",
  "speaker": "ryan (optional)",
  "instruct": "Style or tone instruction (optional)",
  "style_instruction": "Alias for instruct (optional)"
}`,
    responseLabel: "Success (200)",
    response: `Content-Type: audio/mpeg or another upstream audio type
<binary audio stream>`,
    notes: [
      "`text` is the only required field. `language` accepts short codes such as ko/en or names such as korean/english.",
      "Errors return JSON with an `error` field and may use 400, 429, 500, or 504.",
      "Synthesis requests have an approximate 58-second execution limit.",
      "Speaker list: `GET /api/tts`, proxied from upstream `/tts/speakers`.",
    ],
  },
  {
    id: "stt",
    title: "STT (Speech-to-Text)",
    method: "POST",
    path: "/api/stt",
    description:
      "Uploads an audio file and converts it to text with `multipart/form-data`.",
    requestLabel: "Body (multipart/form-data)",
    request: `Fields:
  file        — audio file (required)
  language    — optional
  task        — optional
  beam_size   — optional
  vad_filter  — optional`,
    responseLabel: "Success (200)",
    response: `The upstream STT JSON response is returned as-is.`,
    notes: [
      "Long-running jobs may hit the execution limit and return 504.",
      "Missing `file` returns 400 with a validation message.",
    ],
  },
  {
    id: "voice-clone",
    title: "Voice Clone",
    method: "POST",
    path: "/api/voice-clone",
    description:
      "Uploads a reference voice and synthesizes text with that speaker profile. Send as `multipart/form-data`.",
    requestLabel: "Body (multipart/form-data)",
    request: `Fields:
  ref_audio         — reference audio file (required, WAV/MP3, etc.)
  text              — text to synthesize (required)
  language          — optional, default Korean
                      Korean | English | Chinese | Japanese
  x_vector_only_mode — true | false (optional, default true)
                      true  → clone timbre only (faster, no ref_text)
                      false → clone timbre, prosody, and style (ref_text recommended)
  ref_text          — reference transcript, recommended when x_vector_only_mode=false`,
    responseLabel: "Success (200)",
    response: `Content-Type: audio/wav or another upstream audio type
<binary audio stream>`,
    notes: [
      "`ref_audio` and `text` are required.",
      "`x_vector_only_mode=true` works without `ref_text` and is faster.",
      "`x_vector_only_mode=false` can use `ref_text` to preserve prosody and speaking style.",
      "Requests have a 60-second execution limit and may return 504.",
    ],
  },
  {
    id: "image2text",
    title: "Image2Text (Vision OCR)",
    method: "POST",
    path: "/api/image2text",
    description:
      "Uploads an image for vision analysis and text extraction with `multipart/form-data`.",
    requestLabel: "Body (multipart/form-data)",
    request: `Fields:
  image       — image file (required, JPG/PNG/WEBP/GIF)
  prompt      — optional analysis instruction
  temperature — optional float from 0 to 1, default 0.1`,
    responseLabel: "Success (200)",
    response: `{
  "text": "Image analysis and extracted text"
}`,
    notes: [
      "`image` is the only required field. Omitting `prompt` uses the default image description and text extraction instruction.",
      "Images are base64-encoded server-side before being sent to the Vision API.",
      "Empty or malformed upstream responses may return 502.",
      "Requests have a 115-second execution limit and may return 504.",
      "Usage limits may return 429, same as `/api/chat`.",
    ],
  },
];

const DOCS_TOC_ITEMS = [
  { id: "quickstart", label: "Quickstart" },
  { id: "auth", label: "API key" },
  { id: "examples", label: "Examples" },
  { id: "endpoints", label: "Endpoints" },
  ...SECTIONS.map((section) => ({
    id: section.id,
    label: section.title,
  })),
  { id: "errors", label: "Error handling" },
];

const TOC_SECTION_IDS = DOCS_TOC_ITEMS.map((item) => item.id);

const LAST_TOC_SECTION_ID = TOC_SECTION_IDS[TOC_SECTION_IDS.length - 1];

/** 고정 상단 네비(h-16) + scroll-mt와 맞춘 활성화 기준선(뷰포트 상단 기준 px) */
const TOC_ACTIVATION_LINE_PX = 112;

/**
 * 스크롤 위치에 맞는 TOC 항목 1개만 계산합니다.
 * - 맨 아래에 도달하면 항상 마지막 섹션
 * - 그 외에는 `rect.top <= 기준선`인 섹션들 중 문서 순서상 마지막
 * (중간에 `break` 하면 안 됨 — 그게 두 칸 점프 원인이 됩니다)
 */
function computeActiveTocId(): string {
  const { scrollY, innerHeight } = window;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const atBottom = maxScroll <= 0 || scrollY >= maxScroll - 2;
  if (atBottom) return LAST_TOC_SECTION_ID;

  const line = TOC_ACTIVATION_LINE_PX;
  let active = TOC_SECTION_IDS[0];

  for (const id of TOC_SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= line) {
      active = id;
    }
  }

  return active;
}

function docsTocLinkClass(isActive: boolean) {
  return isActive
    ? "docs-toc-link-active block rounded-lg px-2 py-1.5 transition-all duration-300"
    : "block rounded-lg px-2 py-1.5 text-foreground/70 transition-all duration-300 hover:bg-white/5 hover:text-accent";
}

function CodeBlock({
  code,
  label,
  className = "",
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-black/[0.06] bg-[#0b0c10] text-white shadow-[0_18px_70px_rgba(8,9,13,0.10)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-normal text-white/44">
          {label ?? "code"}
        </p>
        <button
          type="button"
          onClick={copyCode}
          aria-label={`${label ?? "code"} 복사`}
          className="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[11px] text-white/68 transition-colors hover:border-white/24 hover:text-white"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6 text-white/82 md:text-[13px]">
        {code.trim()}
      </pre>
    </div>
  );
}

export default function DocsPage() {
  const [activeSectionId, setActiveSectionId] = useState<string>("quickstart");
  const [selectedSnippet, setSelectedSnippet] =
    useState<SnippetLanguage>("curl");

  const activeSnippet =
    QUICKSTART_SNIPPETS.find((snippet) => snippet.id === selectedSnippet) ??
    QUICKSTART_SNIPPETS[0];

  useEffect(() => {
    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = computeActiveTocId();
        setActiveSectionId((prev) => (prev === next ? prev : next));
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    window.addEventListener("hashchange", update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("load", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);

  return (
    <PlatformShell hideSidebar>
      <div className="flex flex-col gap-8 pb-12 lg:flex-row lg:gap-10 lg:pb-16">
        <aside className="shrink-0 lg:w-60">
          <nav
            aria-label="문서 목차"
            className="platform-panel rounded-xl p-3 lg:sticky lg:top-24 lg:self-start"
          >
            <p className="mb-3 px-2 font-mono text-[11px] uppercase tracking-normal text-black/36">
              Docs
            </p>
            <ul className="space-y-1 text-sm">
              {DOCS_TOC_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={
                      activeSectionId === item.id ? "location" : undefined
                    }
                    className={docsTocLinkClass(activeSectionId === item.id)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <section className="scroll-mt-28" id="quickstart">
            <PlatformPageHeader
              eyebrow="developer docs"
              title="1분 안에 첫 AI API를 연결하세요."
              description="endpoint를 고르고, 동작하는 request를 복사한 뒤 server-side API key로 연결하세요. 첫 예제는 text request로 시작합니다."
              action={
                <PlatformButton href="/api-test?api=llm" variant="secondary">
                  워크벤치에서 실행
                </PlatformButton>
              }
            />

            <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <PlatformCard className="flex flex-col justify-between gap-8 p-6 md:p-8">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                    endpoint-first integration
                  </p>
                  <h2 className="mt-4 max-w-xl text-[28px] font-semibold leading-tight text-[#08090d] md:text-[38px]">
                    Workbench에서 테스트하고 request를 복사하세요.
                  </h2>
                  <p className="mt-4 max-w-xl text-[15px] leading-7 text-black/56">
                    각 API는 명확한 endpoint와 request shape를 가집니다. 이 문서는
                    실제 backend에 붙일 수 있는 가장 작은 코드 경로부터 시작합니다.
                  </p>
                </div>

                <div className="grid gap-3">
                  {QUICKSTART_STEPS.map((step) => (
                    <div
                      key={step.label}
                      className="grid grid-cols-[44px_1fr] gap-4 border-t border-black/[0.06] pt-4 first:border-t-0 first:pt-0"
                    >
                      <span className="font-mono text-[12px] text-accent">
                        {step.label}
                      </span>
                      <div>
                        <h3 className="text-[15px] font-semibold text-[#08090d]">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-black/52">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </PlatformCard>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-black/[0.06] bg-white/72 p-1">
                  {QUICKSTART_SNIPPETS.map((snippet) => (
                    <button
                      key={snippet.id}
                      type="button"
                      onClick={() => setSelectedSnippet(snippet.id)}
                      className={[
                        "rounded-lg px-3 py-2 font-mono text-[12px] transition-colors",
                        selectedSnippet === snippet.id
                          ? "bg-[#08090d] text-white"
                          : "text-black/48 hover:bg-black/[0.035] hover:text-black/78",
                      ].join(" ")}
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>
                <CodeBlock
                  code={activeSnippet.code}
                  label={`${activeSnippet.label} quickstart`}
                />
              </div>
            </div>
          </section>

          <section id="auth" className="scroll-mt-28">
            <PlatformCard className="grid gap-6 md:grid-cols-[0.85fr_1.15fr] md:p-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                  credentials
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#08090d]">
                  API key flow
                </h2>
                <p className="mt-3 text-sm leading-6 text-black/56">
                  API key는 server에서 읽고, 모든 request에 Bearer token으로
                  전달하세요. frontend에는 safe proxy route만 노출합니다.
                </p>
              </div>
              <div className="space-y-3">
                <CodeBlock
                  label="headers"
                  code={`Authorization: Bearer <your_access_token>
Content-Type: application/json`}
                />
                <p className="text-sm leading-6 text-black/48">
                  {BASE_URL_NOTE}
                </p>
              </div>
            </PlatformCard>
          </section>

          <section id="examples" className="scroll-mt-28">
            <PlatformCard className="md:p-8">
              <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                    production patterns
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-[#08090d]">
                    선택한 API endpoint로 구성하기
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-black/52">
                  각 기능은 고유한 endpoint를 가지며, auth, usage, example은 하나의
                  platform workflow 안에서 확인할 수 있습니다.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {USE_CASES.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-black/[0.06] bg-background p-4"
                  >
                    <code className="font-mono text-[11px] text-accent">
                      {item.path}
                    </code>
                    <h3 className="mt-4 text-[15px] font-semibold text-[#08090d]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-black/52">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </PlatformCard>
          </section>

          <section id="endpoints" className="scroll-mt-28">
            <div className="mb-5 border-b border-black/[0.06] pb-6">
              <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                endpoint reference
              </p>
              <h2 className="mt-3 text-[30px] font-semibold leading-tight text-[#08090d]">
                request를 복사하고 workflow를 연결하세요.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/54">
                아래 spec은 현재 앱에서 제공하는 API surface를 기준으로 합니다.
                Workbench에서 테스트한 endpoint와 같은 request shape를 사용하세요.
              </p>
            </div>

            <div className="space-y-5">
              {SECTIONS.map((api) => (
                <section
                  key={api.id}
                  id={api.id}
                  className="platform-card scroll-mt-28 rounded-xl p-6 md:p-8"
                >
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-[#08090d] md:text-2xl">
                        {api.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/56">
                        {api.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span className="rounded-md bg-accent/10 px-2 py-1 font-mono text-xs font-medium text-accent md:text-sm">
                        {api.method}
                      </span>
                      <code className="rounded-md border border-black/[0.06] bg-background px-2 py-1 font-mono text-sm text-foreground/90">
                        {api.path}
                      </code>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-1 md:gap-8 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                        {api.requestLabel ?? "Request"}
                      </h3>
                      <CodeBlock code={api.request} label="request" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                        {api.responseLabel ?? "Response"}
                      </h3>
                      <CodeBlock code={api.response} label="response" />
                    </div>
                  </div>

                  {api.notes && api.notes.length > 0 ? (
                    <ul className="mt-6 space-y-2 border-t border-black/[0.06] pt-5 text-sm text-black/52">
                      {api.notes.map((note) => (
                        <li
                          key={note}
                          className="grid grid-cols-[14px_1fr] gap-2"
                        >
                          <span className="mt-2 h-1 w-1 rounded-full bg-accent" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </section>

          <section id="errors" className="scroll-mt-28">
            <PlatformCard className="md:p-8">
              <div className="mb-6">
                <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                  resilient integration
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#08090d]">
                  Error handling
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-black/56">
                  status code를 기준으로 retry, input correction, usage 안내를
                  client에서 분리하세요.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-black/[0.06]">
                <div className="grid grid-cols-[88px_1fr_1fr] border-b border-black/[0.06] bg-background px-4 py-3 font-mono text-[11px] uppercase tracking-normal text-black/36">
                  <span>Status</span>
                  <span>Meaning</span>
                  <span>Next action</span>
                </div>
                {ERROR_ROWS.map((row) => (
                  <div
                    key={row.status}
                    className="grid grid-cols-1 gap-2 border-b border-black/[0.06] px-4 py-4 last:border-b-0 md:grid-cols-[88px_1fr_1fr]"
                  >
                    <code className="font-mono text-sm font-semibold text-accent">
                      {row.status}
                    </code>
                    <p className="text-sm leading-6 text-black/62">
                      {row.meaning}
                    </p>
                    <p className="text-sm leading-6 text-black/52">
                      {row.action}
                    </p>
                  </div>
                ))}
              </div>
            </PlatformCard>
          </section>

          <p className="mt-14 border-t border-black/[0.06] pt-10 text-center text-sm text-foreground/45">
            API는 계속 추가되고 확장될 수 있으며 endpoint limit도 변경될 수 있습니다.
            최신 동작은{" "}
            <Link href="/api-test?api=llm" className="text-accent hover:underline">
              Workbench
            </Link>
            {" "}와 live response에서 확인하세요.
          </p>
        </main>
      </div>
    </PlatformShell>
  );
}
