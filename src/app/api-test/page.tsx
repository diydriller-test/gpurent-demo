"use client";

import Link from "next/link";
import React, {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavAuthButton } from "@/components/NavAuthButton";
import { getToken } from "@/lib/token";
import { SmartSolutionGuide } from "./components/SmartSolutionGuide";

type ApiId = "llm" | "embedding" | "reranker" | "tts" | "stt";

type ApiItem = {
  id: ApiId;
  name: string;
  description: string;
};

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

function IconBase({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function IconSparkles(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 2l1.2 4.3L17.5 8l-4.3 1.2L12 13.5l-1.2-4.3L6.5 8l4.3-1.7L12 2z" />
      <path d="M5 14l.7 2.4L8 17l-2.3.6L5 20l-.7-2.4L2 17l2.3-.6L5 14z" />
      <path d="M19 13l.7 2.4L22 16l-2.3.6L19 19l-.7-2.4L16 16l2.3-.6L19 13z" />
    </IconBase>
  );
}

function IconLayers(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </IconBase>
  );
}

function IconShuffle(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M16 3h5v5" />
      <path d="M4 20l16-16" />
      <path d="M21 3l-2 2" />
      <path d="M16 21h5v-5" />
      <path d="M4 4l16 16" />
      <path d="M21 21l-2-2" />
    </IconBase>
  );
}

function IconVolume2(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a4.5 4.5 0 010 7" />
      <path d="M18 6a8 8 0 010 12" />
    </IconBase>
  );
}

function IconPlus(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

function IconMic(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v4" />
    </IconBase>
  );
}

function IconPlay(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M8 5l12 7-12 7V5z" />
    </IconBase>
  );
}

function IconPause(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </IconBase>
  );
}

function IconUpload(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5-5 5 5" />
      <path d="M12 5v12" />
    </IconBase>
  );
}

function hashString(input: string) {
  // FNV-1a-ish simple hash for deterministic mock data
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mockEmbeddingVector(userText: string, dims = 12) {
  const seed = hashString(userText.trim());
  const rnd = mulberry32(seed);
  const vec: number[] = [];
  for (let i = 0; i < dims; i++) {
    const v = rnd() * 2 - 1; // -1..1
    vec.push(Math.round(v * 100) / 100);
  }
  return vec;
}

function formatVector(vec: number[]) {
  return `[${vec.map((v) => v.toFixed(2)).join(", ")}]`;
}

function mockWaveform(seedText: string, length = 24) {
  const seed = hashString(seedText.trim());
  const rnd = mulberry32(seed);
  const bars: number[] = [];
  for (let i = 0; i < length; i++) {
    const v = 0.15 + rnd() * 0.85;
    bars.push(v);
  }
  return bars;
}

function mockTranscript(sttInputLabel: string) {
  const seed = hashString(sttInputLabel);
  const rnd = mulberry32(seed);
  const a = Math.floor(rnd() * 90 + 10);
  const b = Math.floor(rnd() * 90 + 10);

  return (
    `음성 변환 데모 결과\n\n` +
    `회의/요약 메모:\n` +
    `- 핵심: ${a}분 내 결정해야 할 사항을 정리합니다.\n` +
    `- 배경: ${b}가지 관점에서 요구사항을 재점검합니다.\n` +
    `- 다음 단계: LLM/RAG로 문서 기반 응답을 자동화합니다.\n\n` +
    `원천: ${sttInputLabel}`
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function renderHighlightedJson(text: string) {
  const regex =
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*")(?=\s*:)|("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*")|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b|[{}\[\]:,]/g;

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const keyStr = match[1];
    const valueStr = match[2];

    let className = "text-foreground/50";
    if (keyStr !== undefined) className = "text-[#10b981]";
    else if (valueStr !== undefined) className = "text-[#a7f3d0]";
    else if (token === "true" || token === "false")
      className = "text-[#fbbf24]";
    else if (token === "null") className = "text-[#f87171]";
    else if (token.startsWith('"')) className = "text-[#a7f3d0]";
    else if (/^-?\d/.test(token)) className = "text-[#93c5fd]";
    else if (/[{}\[\]:,]/.test(token)) className = "text-foreground/50";

    parts.push(
      <span key={`${start}-${token}`} className={className}>
        {token}
      </span>,
    );

    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function JsonCode({ text }: { text: string }) {
  const safeText = text || "";
  return (
    <pre className="max-h-[50vh] overflow-auto rounded-xl border border-white/5 bg-background/20 p-3 font-mono text-[12px] leading-relaxed">
      <code className="whitespace-pre">
        {safeText.length ? renderHighlightedJson(safeText) : "—"}
      </code>
    </pre>
  );
}

export default function ApiTestPage() {
  type ViewMode = "list" | "detail";
  const apis: ApiItem[] = useMemo(
    () => [
      {
        id: "llm",
        name: "Text",
        description: "프롬프트 기반 텍스트 생성",
      },
      {
        id: "embedding",
        name: "Embedding",
        description: "문장을 벡터로 변환",
      },
      {
        id: "reranker",
        name: "Reranker",
        description: "검색 결과 재정렬로 정확도 향상",
      },
      {
        id: "tts",
        name: "TTS",
        description: "텍스트를 음성으로 변환",
      },
      {
        id: "stt",
        name: "STT (Speech-to-Text)",
        description: "음성을 텍스트로 변환",
      },
    ],
    [],
  );

  const [selectedApi, setSelectedApi] = useState<ApiId>("llm");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [prompt, setPrompt] = useState("");
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(
    null,
  );
  const comingSoonTimerRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isChatLoading, setIsChatLoading] = useState(false);
  const pendingAssistantIdRef = useRef<string | null>(null);

  type ConsoleState = {
    requestJson: string;
    responseJson: string;
    statusCode: number | null;
    statusLine: string;
    error: string | null;
  };
  const getDefaultConsoleRequestJson = (api: ApiId): string => {
    if (api === "llm") {
      return JSON.stringify(
        {
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "user",
              content: "GPU 인프라 도입 효과를 3줄로 요약해줘.",
            },
          ],
        },
        null,
        2,
      );
    }
    if (api === "reranker") {
      return JSON.stringify(
        {
          query: "부모님 환갑 선물로 건강 챙겨드릴 만한 거",
          input: [
            "최신 유행하는 무선 이어폰과 블루투스 스피커 세트",
            "매일 아침 가볍게 마시는 프리미엄 유기농 녹용 진액",
            "초등학생 조카들이 좋아하는 인기 캐릭터 장난감",
            "환갑 잔치 때 입기 좋은 화려한 스타일의 파티복",
          ],
        },
        null,
        2,
      );
    }
    return "{}";
  };
  const createDefaultConsoleState = (api: ApiId): ConsoleState => ({
    requestJson: getDefaultConsoleRequestJson(api),
    responseJson: "",
    statusCode: null,
    statusLine: "—",
    error: null,
  });
  const [consoleByApi, setConsoleByApi] = useState<Record<ApiId, ConsoleState>>(
    () => ({
      llm: createDefaultConsoleState("llm"),
      embedding: createDefaultConsoleState("embedding"),
      reranker: createDefaultConsoleState("reranker"),
      tts: createDefaultConsoleState("tts"),
      stt: createDefaultConsoleState("stt"),
    }),
  );
  const [consoleCopied, setConsoleCopied] = useState<boolean>(false);
  const [consoleSubmitShake, setConsoleSubmitShake] = useState(false);

  type MarketplaceTask =
    | "Text Generation"
    | "Embedding"
    | "Reranker"
    | "TTS"
    | "STT"
    | "Vision";
  type LibraryFormat = "Transformers" | "GGUF" | "vLLM" | "ONNX";

  type MarketplaceItem = {
    id: string;
    task: MarketplaceTask;
    apiId?: ApiId;
    model: string;
    modelSizeB: number;
    taskTags: string[]; // e.g. ["#LLM", "#Text-Gen"]
    formats: LibraryFormat[]; // filterable formats
  };

  const marketplaceItems: MarketplaceItem[] = useMemo(
    () => [
      {
        id: "gpt-oss-120b",
        task: "Text Generation",
        apiId: "llm",
        model: "gpt-oss-120b",
        modelSizeB: 120,
        taskTags: ["#LLM", "#Text-Gen"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "embedding-70b",
        task: "Embedding",
        apiId: "embedding",
        model: "embedding-70b",
        modelSizeB: 70,
        taskTags: ["#Embedding", "#Semantic-Search"],
        formats: ["Transformers", "ONNX"],
      },
      {
        id: "reranker-8b",
        task: "Reranker",
        apiId: "reranker",
        model: "Qwen3 Reranker-8b",
        modelSizeB: 8,
        taskTags: ["#Reranker", "#Qwen3", "#Search-Quality"],
        formats: ["GGUF", "Transformers"],
      },
      {
        id: "tts-13b",
        task: "TTS",
        apiId: "tts",
        model: "tts-13b",
        modelSizeB: 13,
        taskTags: ["#TTS", "#Audio"],
        formats: ["vLLM", "ONNX"],
      },
      {
        id: "stt-13b",
        task: "STT",
        apiId: "stt",
        model: "stt-13b",
        modelSizeB: 13,
        taskTags: ["#STT", "#Transcription"],
        formats: ["ONNX"],
      },
      {
        id: "vision-pro",
        task: "Vision",
        model: "vision-pro (Coming Soon)",
        modelSizeB: 70,
        taskTags: ["#Vision", "#Multimodal"],
        formats: ["Transformers", "ONNX"],
      },
    ],
    [],
  );

  const [filterTasks, setFilterTasks] = useState<
    Record<MarketplaceTask, boolean>
  >({
    "Text Generation": true,
    Embedding: true,
    Reranker: true,
    TTS: true,
    STT: true,
    Vision: false,
  });
  const taskKeys = useMemo<MarketplaceTask[]>(
    () => ["Text Generation", "Embedding", "Reranker", "TTS", "STT"],
    []
  );

  const filteredMarketplace = useMemo(() => {
    return marketplaceItems.filter((item) => {
      if (item.task === "Vision") return false;
      return filterTasks[item.task];
    });
  }, [filterTasks, marketplaceItems]);

  const isAllTasksActive = taskKeys.every((t) => filterTasks[t]);

  const activeTaskKey = useMemo(() => {
    if (isAllTasksActive) return "All";
    const active = taskKeys.find((t) => filterTasks[t]);
    if (!active) return "All";
    if (active === "Text Generation") return "Text";
    if (active === "Embedding") return "Embedding";
    if (active === "Reranker") return "Rerank";
    if (active === "TTS" || active === "STT") return "TTS/STT";
    return "All";
  }, [filterTasks, isAllTasksActive, taskKeys]);

  function renderTaskGuide() {
    switch (activeTaskKey) {
      case "All":
        return (
          <>
            입점된 다양한 API 모델의 성능을 실시간으로 테스트해 볼 수 있는
            체험존입니다. 🚀
          </>
        );
      case "Text":
        return (
          <>
            ✨{" "}
            <span className="text-[#10b981] font-semibold">
              비즈니스 대화 및 요약
            </span>
            : 복잡한 문서를 요약하거나 자연스러운 챗봇 답변을 생성하는{" "}
            <span className="text-[#10b981] font-semibold">
              초거대 언어 모델(LLM)
            </span>{" "}
            서비스입니다.
          </>
        );
      case "Embedding":
        return (
          <>
            🔍{" "}
            <span className="text-[#10b981] font-semibold">
              지능형 데이터 검색
            </span>
            : 문장의 의미를 분석하여 대규모 문서에서 원하는 정보를 정확히
            찾아내는{" "}
            <span className="text-[#10b981] font-semibold">
              RAG(검색 증강 생성)
            </span>
            의 핵심 기술입니다.
          </>
        );
      case "Rerank":
        return (
          <>
            🎯{" "}
            <span className="text-[#10b981] font-semibold">
              검색 결과 최적화
            </span>
            : 단순 검색을 넘어, 사용자의 의도에 가장 가까운 순서로{" "}
            <span className="text-[#10b981] font-semibold">
              정확도를 극대화
            </span>
            하여 정렬합니다.
          </>
        );
      case "TTS/STT":
        return (
          <>
            🎙️{" "}
            <span className="text-[#10b981] font-semibold">
              음성-텍스트 전환
            </span>
            : 회의록 자동 작성부터 자연스러운 음성 안내까지,{" "}
            <span className="text-[#10b981] font-semibold">
              소리를 데이터로
            </span>{" "}
            바꾸는 멀티모달 기술입니다.
          </>
        );
      default:
        return (
          <>
            입점된 다양한 API 모델의 성능을 실시간으로 테스트해 볼 수 있는
            체험존입니다. 🚀
          </>
        );
    }
  }

  function enterDetailFor(item: MarketplaceItem) {
    if (item.apiId) {
      setSelectedApi(item.apiId);
      setViewMode("detail");
      return;
    }
    showComingSoon("준비 중입니다 (Coming Soon)");
  }

  // Embedding
  const [embeddingText, setEmbeddingText] = useState(
    "기업 지식 검색을 위한 문장 예시입니다.",
  );
  const [embeddingVector, setEmbeddingVector] = useState<number[] | null>(null);

  // Reranker
  const [rerankQuestion, setRerankQuestion] = useState(
    "사람 없고 한적한 곳에서 힐링하고 싶어",
  );
  const [rerankDocsText, setRerankDocsText] = useState(
    "- 사람들이 가장 많이 찾는 서울 핫플레이스 TOP 10\n- 여름 휴가철 인파로 북적이는 해운대 해수욕장 현황\n- 숲소리만 들리는 깊은 산속 프라이빗 독채 펜션\n- 친구들과 시끌벅적하게 즐기는 강남역 맛집 탐방",
  );
  const [rerankResults, setRerankResults] = useState<Array<{
    rank: number;
    doc: string;
    score: number;
  }> | null>(null);
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [isRerankLoading, setIsRerankLoading] = useState(false);
  const [rerankError, setRerankError] = useState<string | null>(null);

  // TTS
  const [ttsText, setTtsText] = useState(
    "안녕하세요. GPU Modu API 데모를 재생합니다.",
  );
  const [ttsWave, setTtsWave] = useState<number[]>(() => []);
  const [ttsDurationMs, setTtsDurationMs] = useState(14000);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsIntervalRef = useRef<number | null>(null);

  // STT
  const [sttFileName, setSttFileName] = useState<string | null>(null);
  const [sttRecording, setSttRecording] = useState(false);
  const [sttTranscript, setSttTranscript] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (comingSoonTimerRef.current) {
        window.clearTimeout(comingSoonTimerRef.current);
      }
    };
  }, []);

  function taskIcon(task: MarketplaceTask) {
    const base = "h-4 w-4";
    switch (task) {
      case "Text Generation":
        return <IconSparkles className={base} />;
      case "Embedding":
        return <IconLayers className={base} />;
      case "Reranker":
        return <IconShuffle className={base} />;
      case "TTS":
        return <IconVolume2 className={base} />;
      case "STT":
        return <IconMic className={base} />;
      case "Vision":
        return <IconPlus className={base} />;
      default:
        return null;
    }
  }

  function showComingSoon(message: string) {
    setComingSoonMessage(message);
    if (comingSoonTimerRef.current) {
      window.clearTimeout(comingSoonTimerRef.current);
    }
    comingSoonTimerRef.current = window.setTimeout(() => {
      setComingSoonMessage(null);
    }, 2200);
  }

  useEffect(() => {
    return () => {
      if (ttsIntervalRef.current) {
        window.clearInterval(ttsIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedApi !== "llm") return;
    setConsoleByApi((prev) => {
      const current = prev.llm;
      if (current.requestJson.includes('"messages"')) return prev;
      return {
        ...prev,
        llm: {
          ...current,
          requestJson: getDefaultConsoleRequestJson("llm"),
          error: null,
        },
      };
    });
  }, [selectedApi]);

  const placeholder = useMemo(() => {
    switch (selectedApi) {
      case "llm":
        return "GPT-OSS-120B에게 질문하거나 요약을 요청해보세요.";
      case "embedding":
        return "예: 벡터로 변환할 문장을 입력하세요…";
      case "reranker":
        return "예: 검색 결과를 재정렬할 기준을 입력하세요…";
      case "tts":
        return "예: 읽어줄 문장을 입력하세요…";
      case "stt":
        return "예: 들어온 음성 내용을 요약해줘…";
      default:
        return "메시지를 입력하세요…";
    }
  }, [selectedApi]);

  const currentConsole = consoleByApi[selectedApi];

  function patchConsole(api: ApiId, patch: Partial<ConsoleState>) {
    setConsoleByApi((prev) => ({
      ...prev,
      [api]: { ...prev[api], ...patch },
    }));
  }

  function resetConsoleForApi(api: ApiId) {
    setConsoleByApi((prev) => ({
      ...prev,
      [api]: createDefaultConsoleState(api),
    }));
    if (api === "reranker") {
      setDisplayedQuery("");
    }
    setConsoleCopied(false);
  }

  function normalizeRerankResults(data: unknown, fallbackDocs: string[]) {
    const rerankRaw =
      typeof data === "object" &&
      data !== null &&
      Array.isArray((data as { rerank?: unknown }).rerank)
        ? ((data as { rerank: unknown[] }).rerank ?? [])
        : [];

    const parsed = rerankRaw.map((item, idx) => {
      const rec =
        typeof item === "object" && item !== null
          ? (item as Record<string, unknown>)
          : {};

      const doc =
        typeof rec.input_text === "string"
          ? rec.input_text
          : typeof rec.text === "string"
            ? rec.text
            : typeof rec.document === "string"
              ? rec.document
              : (fallbackDocs[idx] ?? "");

      const scoreCandidate =
        typeof rec.relevance_score === "number"
          ? rec.relevance_score
          : typeof rec.score === "number"
            ? rec.score
            : typeof rec.similarity === "number"
              ? rec.similarity
              : 0;

      return {
        rank: idx + 1,
        doc: doc || "(empty)",
        score: Number.isFinite(scoreCandidate) ? scoreCandidate : 0,
      };
    });

    return parsed
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  function sanitizeRerankDocLine(line: string): string {
    return line.trim().replace(/^-+\s*/, "");
  }

  function moveToApiDetail(api: ApiId) {
    setSelectedApi(api);
    setViewMode("detail");
  }

  // Detail view에서 선택된 API에 맞춰 Tasks 버튼 활성 상태를 1:1로 동기화합니다.
  useEffect(() => {
    if (viewMode !== "detail") return;

    setFilterTasks((prev) => {
      const next = { ...prev };
      next["Text Generation"] = selectedApi === "llm";
      next.Embedding = selectedApi === "embedding";
      next.Reranker = selectedApi === "reranker";
      next.TTS = selectedApi === "tts";
      next.STT = selectedApi === "stt";
      next.Vision = false;
      return next;
    });
  }, [selectedApi, viewMode]);

  function handleEmbeddingRun() {
    setEmbeddingVector(mockEmbeddingVector(embeddingText, 12));
  }

  async function handleRerankRun() {
    if (isRerankLoading) return;

    const query = rerankQuestion.trim();
    const documents = rerankDocsText
      .split("\n")
      .map((line) => sanitizeRerankDocLine(line))
      .filter(Boolean);

    if (!query || documents.length === 0) {
      setRerankError("Query와 Documents를 모두 입력해주세요.");
      setRerankResults(null);
      return;
    }

    const requestBody = {
      query,
      input: documents,
    };

    setIsRerankLoading(true);
    setRerankError(null);
    setRerankResults(null);
    setConsoleCopied(false);
    patchConsole("reranker", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: JSON.stringify(requestBody, null, 2),
      responseJson: "",
      error: null,
    });

    let consoleAlreadySet = false;

    try {
      const res = await fetch("/api/rerank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await res.json().catch(() => null)) as unknown;
      patchConsole("reranker", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });
      consoleAlreadySet = true;

      if (!res.ok) {
        throw new Error("RERANK_API_ERROR");
      }

      const sorted = normalizeRerankResults(data, documents);

      setRerankResults(sorted);
      setDisplayedQuery(query);
      patchConsole("reranker", {
        responseJson: JSON.stringify({ rerank: sorted }, null, 2),
      });
    } catch {
      setRerankError(
        "Reranker API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      if (!consoleAlreadySet) {
        patchConsole("reranker", {
          statusLine: "500 Reranker Error",
          statusCode: 500,
          responseJson: JSON.stringify(
            { error: "Reranker request failed" },
            null,
            2,
          ),
        });
      }
    } finally {
      setIsRerankLoading(false);
    }
  }

  function handleTtsSynthesize() {
    const wave = mockWaveform(ttsText, 26);
    const base = 9000 + (hashString(ttsText) % 9000); // 9s..18s roughly
    setTtsWave(wave);
    setTtsDurationMs(base);
    setTtsProgress(0);
    setTtsPlaying(false);
  }

  function handleTtsPlayPause() {
    if (!ttsWave.length) {
      handleTtsSynthesize();
    }
    if (ttsPlaying) {
      setTtsPlaying(false);
      if (ttsIntervalRef.current) window.clearInterval(ttsIntervalRef.current);
      ttsIntervalRef.current = null;
      return;
    }

    const startAt = Date.now();
    const startProgress = ttsProgress;
    setTtsPlaying(true);

    ttsIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startAt;
      const next = Math.min(1, startProgress + elapsed / ttsDurationMs);
      setTtsProgress(next);
      if (next >= 1) {
        setTtsPlaying(false);
        if (ttsIntervalRef.current)
          window.clearInterval(ttsIntervalRef.current);
        ttsIntervalRef.current = null;
      }
    }, 60);
  }

  function handleSttConvert() {
    const label =
      sttFileName ??
      (sttRecording ? "마이크 녹음(데모)" : "업로드/미지정(데모)");
    setSttTranscript(null);
    window.setTimeout(() => {
      setSttTranscript(mockTranscript(label));
      setSttRecording(false);
    }, 750);
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (selectedApi !== "llm") return;
    const trimmed = prompt.trim();
    if (!trimmed) return;

    if (isChatLoading) return;

    const now = Date.now();
    const pendingAssistantId = `pending-${now}`;
    const userMsg: ChatMessage = {
      id: `u-${now}`,
      role: "user",
      content: trimmed,
      createdAt: now,
    };

    pendingAssistantIdRef.current = pendingAssistantId;
    setIsChatLoading(true);
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: pendingAssistantId,
        role: "assistant",
        content: "답변 생성 중...",
        createdAt: Date.now(),
      },
    ]);
    setPrompt("");

    // Developer Console JSON request/response
    setConsoleCopied(false);
    patchConsole("llm", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: JSON.stringify(
        { model: "openai/gpt-oss-120b", input: trimmed },
        null,
        2,
      ),
      responseJson: "",
      error: null,
    });

    let consoleAlreadySet = false;

    try {
      const token = getToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ input: trimmed }),
      });

      if (!res.ok) {
        let errJson: unknown = null;
        try {
          errJson = await res.json();
        } catch {
          errJson = null;
        }

        patchConsole("llm", {
          statusCode: res.status,
          statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
          responseJson: JSON.stringify(
            errJson ?? { error: "Request failed" },
            null,
            2,
          ),
        });
        consoleAlreadySet = true;

        if (res.status === 401) throw new Error("401");
        throw new Error("API_ERROR");
      }

      const data = (await res.json().catch(() => null)) as unknown;

      patchConsole("llm", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });
      consoleAlreadySet = true;

      const text =
        typeof (data as { text?: unknown } | null)?.text === "string"
          ? ((data as { text?: unknown }).text as string).trim()
          : undefined;

      const assistantText = text?.length
        ? text
        : "응답이 비어있습니다. 다시 시도해 주세요.";
      const pendingId = pendingAssistantIdRef.current;
      if (pendingId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId ? { ...m, content: assistantText } : m,
          ),
        );
      }
    } catch (err: unknown) {
      const is401 = err instanceof Error ? err.message.includes("401") : false;
      const assistantText = is401
        ? "인증 에러가 발생했습니다. 키를 확인해주세요."
        : "서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.";

      if (!consoleAlreadySet) {
        patchConsole("llm", {
          statusLine: "—",
          statusCode: is401 ? 401 : 500,
          responseJson: JSON.stringify(
            { error: is401 ? "Unauthorized" : "Server Error" },
            null,
            2,
          ),
        });
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistantId ? { ...m, content: assistantText } : m,
        ),
      );
    } finally {
      setIsChatLoading(false);
      pendingAssistantIdRef.current = null;
    }
  }

  function extractJsonErrorLine(source: string, error: unknown): number | null {
    if (!(error instanceof SyntaxError)) return null;
    const msg = String(error.message || "");
    const matched = msg.match(/position\s+(\d+)/i);
    if (!matched) return null;
    const pos = Number(matched[1]);
    if (!Number.isFinite(pos) || pos < 0) return null;
    return source.slice(0, pos).split("\n").length;
  }

  function parseConsoleJsonInput(rawText: string): {
    parsed: unknown | null;
    errorMessage: string | null;
  } {
    const trimmed = rawText.trim();
    const candidate = trimmed || "{}";

    try {
      return { parsed: JSON.parse(candidate), errorMessage: null };
    } catch (firstError) {
      // Allow common trailing-comma mistakes in manually edited JSON.
      const repaired = candidate.replace(/,\s*([}\]])/g, "$1");
      if (repaired !== candidate) {
        try {
          return { parsed: JSON.parse(repaired), errorMessage: null };
        } catch (secondError) {
          const line = extractJsonErrorLine(repaired, secondError);
          return {
            parsed: null,
            errorMessage: line
              ? `Invalid JSON Format (line ${line})`
              : "Invalid JSON Format",
          };
        }
      }

      const line = extractJsonErrorLine(candidate, firstError);
      return {
        parsed: null,
        errorMessage: line
          ? `Invalid JSON Format (line ${line})`
          : "Invalid JSON Format",
      };
    }
  }

  async function sendConsoleRequest() {
    if (isChatLoading) return;
    const targetApi = selectedApi;
    setConsoleCopied(false);
    patchConsole(targetApi, {
      error: null,
      statusCode: null,
      statusLine: "Pending...",
      responseJson: "",
    });

    const { parsed, errorMessage } = parseConsoleJsonInput(
      currentConsole.requestJson,
    );
    if (errorMessage || parsed === null) {
      patchConsole(targetApi, {
        error: errorMessage ?? "Invalid JSON Format",
        statusLine: "—",
        statusCode: null,
        responseJson: "",
      });
      setConsoleSubmitShake(true);
      window.setTimeout(() => {
        setConsoleSubmitShake(false);
      }, 420);
      return;
    }

    let consoleAlreadySet = false;

    try {
      if (targetApi === "reranker") {
        const body = parsed as { query?: unknown; input?: unknown };
        const query = typeof body.query === "string" ? body.query.trim() : "";
        const input = Array.isArray(body.input)
          ? body.input
              .filter((v): v is string => typeof v === "string")
              .map((v) => sanitizeRerankDocLine(v))
              .filter(Boolean)
          : [];
        if (!query || input.length === 0) {
          setRerankError("Query와 Documents를 모두 입력해주세요.");
          setRerankResults(null);
          patchConsole("reranker", {
            error: "`query` 문자열과 `input` 배열을 확인해주세요.",
            statusLine: "—",
            responseJson: "",
          });
          setConsoleSubmitShake(true);
          window.setTimeout(() => {
            setConsoleSubmitShake(false);
          }, 420);
          return;
        }

        setIsRerankLoading(true);
        setRerankError(null);
        setRerankResults(null);

        const res = await fetch("/api/rerank", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, input }),
        });

        const responseJson = (await res.json().catch(() => null)) as unknown;
        patchConsole("reranker", {
          statusCode: res.status,
          statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
          responseJson: JSON.stringify(responseJson ?? {}, null, 2),
        });
        consoleAlreadySet = true;

        if (!res.ok) {
          throw new Error("RERANK_API_ERROR");
        }

        const sorted = normalizeRerankResults(responseJson, input);
        setRerankResults(sorted);
        setDisplayedQuery(query);
        patchConsole("reranker", {
          responseJson: JSON.stringify({ rerank: sorted }, null, 2),
        });
        return;
      }

      if (targetApi !== "llm") {
        patchConsole(targetApi, {
          statusLine: "—",
          statusCode: null,
          responseJson: "",
          error: "현재 카테고리는 콘솔 전송을 지원하지 않습니다.",
        });
        setConsoleSubmitShake(true);
        window.setTimeout(() => {
          setConsoleSubmitShake(false);
        }, 420);
        return;
      }

      const body = parsed as {
        input?: unknown;
        messages?: Array<{ role?: unknown; content?: unknown }>;
      };
      const directInput =
        typeof body.input === "string" ? body.input.trim() : "";
      const messageInput = Array.isArray(body.messages)
        ? [...body.messages]
            .reverse()
            .find(
              (m) => m && m.role === "user" && typeof m.content === "string",
            )?.content
        : "";
      const input = (
        typeof messageInput === "string" && messageInput.trim()
          ? messageInput
          : directInput
      ).trim();
      if (!input) {
        patchConsole("llm", {
          error: "`input` 또는 `messages[].content`를 입력해주세요.",
          statusLine: "—",
          responseJson: "",
        });
        setConsoleSubmitShake(true);
        window.setTimeout(() => {
          setConsoleSubmitShake(false);
        }, 420);
        return;
      }

      const now = Date.now();
      const pendingAssistantId = `pending-${now}`;
      const userMsg: ChatMessage = {
        id: `u-${now}`,
        role: "user",
        content: input,
        createdAt: now,
      };

      pendingAssistantIdRef.current = pendingAssistantId;
      setPrompt(input);
      setIsChatLoading(true);
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: pendingAssistantId,
          role: "assistant",
          content: "답변 생성 중...",
          createdAt: Date.now(),
        },
      ]);

      const token = getToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ input }),
      });

      let responseJson: unknown = null;
      try {
        responseJson = await res.json();
      } catch {
        responseJson = null;
      }

      patchConsole("llm", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(responseJson ?? {}, null, 2),
      });
      consoleAlreadySet = true;

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("401");
        }
        throw new Error("API_ERROR");
      }

      const data = responseJson as { text?: unknown } | null;
      const text =
        typeof data?.text === "string"
          ? data.text.trim()
          : JSON.stringify(data ?? {}, null, 2);
      const pendingId = pendingAssistantIdRef.current;
      if (pendingId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === pendingId ? { ...m, content: text } : m)),
        );
      }
    } catch (err: unknown) {
      const is401 = err instanceof Error && err.message.includes("401");
      const assistantText = is401
        ? "인증 에러가 발생했습니다. 키를 확인해주세요."
        : "서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.";

      if (!consoleAlreadySet) {
        patchConsole(targetApi, {
          statusLine: "—",
          statusCode: is401 ? 401 : 500,
          responseJson: JSON.stringify(
            { error: is401 ? "Unauthorized" : "Server Error" },
            null,
            2,
          ),
        });
      }

      if (targetApi === "reranker") {
        setRerankError(
          "Reranker API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
        setRerankResults(null);
      }

      const pendingId = pendingAssistantIdRef.current;
      if (pendingId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId ? { ...m, content: assistantText } : m,
          ),
        );
      }
    } finally {
      setIsChatLoading(false);
      if (targetApi === "reranker") {
        setIsRerankLoading(false);
      }
      pendingAssistantIdRef.current = null;
    }
  }

  const selectedApiItem = apis.find((a) => a.id === selectedApi);

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            aria-label="Go to home"
            className="flex items-center gap-2 transition-all hover:opacity-90 hover:drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]"
          >
            <span className="font-mono text-lg font-bold text-accent">GPU</span>
            <span className="font-mono text-lg font-medium text-foreground/90">
              Modu
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/api-test"
              className="text-sm text-accent transition-colors"
            >
              API
            </Link>
            <Link
              href="/docs"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              문서
            </Link>
            <NavAuthButton />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,170,0.14),transparent_55%)]" />

        {viewMode === "list" ? (
          <div className="relative flex flex-col gap-6 lg:flex-row lg:gap-6">
            {comingSoonMessage ? (
              <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                <div className="w-[min(520px,90%)] rounded-2xl border border-[#10b981]/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(16,185,129,0.18)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]">
                      <IconPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        Coming Soon
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                        {comingSoonMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {/* Left: Filters */}
            <aside className="w-full lg:w-[240px] lg:flex-shrink-0">
              <div className="rounded-2xl border border-white/5 bg-surface/40 p-3 backdrop-blur-xl">
                <div className="mb-4 space-y-3">
                  <Link
                    href="/"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#10b981]/45 bg-transparent px-2.5 py-2 text-center text-[11px] font-medium tracking-[0.01em] text-[#10b981] transition-colors hover:bg-[#10b981]/10"
                  >
                    <span>홈으로 가기</span>
                  </Link>
                  <p className="font-mono text-xs text-foreground/60">
                    API Sandbox
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    기술 스펙 필터
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Tasks */}
                  <div className="rounded-xl border border-white/5 bg-background/20 p-3">
                    <p className="font-mono text-xs text-foreground/60">
                      Tasks
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterTasks((prev) => {
                            const next = { ...prev };
                            taskKeys.forEach((k) => {
                              next[k] = true;
                            });
                            next.Vision = false;
                            return next;
                          });
                        }}
                        className={[
                          "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                          "border-white/10 bg-background/30 hover:border-[#10b981]/30 hover:bg-[#10b981]/10",
                          isAllTasksActive
                            ? "border-[#10b981]/50 bg-[#10b981]/10 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                            : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                            isAllTasksActive
                              ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]"
                              : "border-white/10 bg-background/20 text-foreground/70",
                          ].join(" ")}
                        >
                          <IconLayers className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          All
                        </span>
                      </button>

                      {taskKeys.map((t) => {
                        const isActive = filterTasks[t];
                        const label = t === "Text Generation" ? "Text" : t;

                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setFilterTasks((prev) => {
                                const next = { ...prev };
                                taskKeys.forEach((k) => {
                                  next[k] = k === t;
                                });
                                next.Vision = false;
                                return next;
                              });
                            }}
                            className={[
                              "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                              "border-white/10 bg-background/30 hover:border-[#10b981]/30 hover:bg-[#10b981]/10",
                              isActive
                                ? "border-[#10b981]/50 bg-[#10b981]/10 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                                : "",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                                isActive
                                  ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]"
                                  : "border-white/10 bg-background/20 text-foreground/70",
                              ].join(" ")}
                            >
                              {taskIcon(t)}
                            </span>
                            <span className="font-mono text-[11px] text-foreground/80">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Center: Marketplace Grid */}
            <section className="w-full lg:min-w-0 lg:flex-1">
              <div className="rounded-2xl border border-white/5 bg-surface/35 p-4 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-foreground/60">
                      API Interactive Test
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">
                      기술 스펙 기반으로 선택
                    </h3>
                    <style>{`
                      @keyframes taskGuideFadeIn {
                        from { opacity: 0; transform: translateY(4px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                      .task-guide-anim {
                        animation: taskGuideFadeIn 180ms ease-out;
                      }
                    `}</style>
                    <div
                      key={activeTaskKey}
                      className="task-guide-anim mt-2 rounded-xl border border-white/5 bg-background/20 px-3 py-2 text-sm leading-7 text-foreground/80"
                    >
                      {renderTaskGuide()}
                    </div>
                  </div>
                  <span className="rounded-xl border border-[#10b981]/25 bg-[#10b981]/5 px-3 py-1 font-mono text-xs text-[#10b981]">
                    {filteredMarketplace.length} APIs
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredMarketplace.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => enterDetailFor(item)}
                      className={[
                        "group relative rounded-2xl border bg-background/20 p-4 text-left transition-all",
                        "border-white/5 hover:-translate-y-0.5 hover:border-[#10b981]/45 hover:bg-background/30",
                        "hover:shadow-[0_0_60px_rgba(16,185,129,0.12)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[11px] text-foreground/50">
                            Model Size {item.modelSizeB}B • {item.task}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-foreground leading-tight break-words">
                            {item.model}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.taskTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-[#10b981]/25 bg-[#10b981]/5 px-2 py-1 text-[11px] font-mono text-[#10b981]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="rounded-lg border border-white/10 bg-background/30 px-2.5 py-1 text-[11px] font-mono text-foreground/70">
                          Size: {item.modelSizeB}B
                        </span>
                        <span className="text-xs text-foreground/50">
                          Click to open
                        </span>
                        <span className="text-[#10b981] transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Register Your API */}
                  <button
                    type="button"
                    onClick={() =>
                      showComingSoon(
                        "조만간 API 등록 기능이 추가될 예정입니다. 나만의 API를 마켓플레이스에 공유해보세요!",
                      )
                    }
                    className={[
                      "group rounded-2xl border border-dashed border-white/10 bg-transparent p-4 text-left transition-colors",
                      "hover:border-[#10b981]/40 hover:bg-[#10b981]/5",
                    ].join(" ")}
                  >
                    <p className="font-mono text-xs text-foreground/60">
                      Open Ecosystem
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Register Your API
                    </p>
                    <p className="mt-2 text-xs text-foreground/60">
                      나중에 나만의 API를 등록해 직접 테스트해볼 수 있어요.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background/20 px-3 py-2 text-xs text-foreground/70 transition-colors group-hover:border-[#10b981]/30 group-hover:text-[#10b981]">
                      <span>입점 등록</span>
                      <span>+</span>
                    </div>
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="relative flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:gap-3">
            {/* Center: Playground */}
            <section className="w-full lg:min-w-0 lg:flex-1">
              <div className="relative flex h-[calc(100vh-240px)] min-h-0 flex-col rounded-2xl border border-white/5 bg-surface/35 backdrop-blur-xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-background/20 p-4">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterTasks({
                          "Text Generation": selectedApi === "llm",
                          Embedding: selectedApi === "embedding",
                          Reranker: selectedApi === "reranker",
                          TTS: selectedApi === "tts",
                          STT: selectedApi === "stt",
                          Vision: false,
                        });
                        setViewMode("list");
                      }}
                      className="inline-flex items-center rounded-lg px-1 py-0.5 text-xs text-foreground/55 transition-colors hover:text-[#10b981]"
                    >
                      ← 목록으로 돌아가기
                    </button>
                    <p className="mt-2 font-mono text-xs text-foreground/60">
                      Test Playground
                    </p>
                    <h3 className="mt-1 truncate text-lg font-semibold text-foreground">
                      {selectedApiItem?.name ?? "API"} Playground
                    </h3>
                    {selectedApi === "llm" || selectedApi === "reranker" ? (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-[11px] font-mono text-[#10b981]">
                          {selectedApi === "llm"
                            ? "High-Performance Infra • GPT-OSS-120B • 실시간"
                            : "High-Performance Infra • Qwen3-Reranker-8B • 실시간"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {comingSoonMessage ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                    <div className="w-[min(520px,90%)] rounded-2xl border border-[#10b981]/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(16,185,129,0.18)]">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]">
                          <IconPlus className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            Coming Soon
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                            {comingSoonMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <style>{`
                @keyframes apiCenterFadeIn {
                  from { opacity: 0; transform: translateY(6px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes consoleShake {
                  0%, 100% { transform: translateX(0); }
                  20% { transform: translateX(-6px); }
                  40% { transform: translateX(6px); }
                  60% { transform: translateX(-4px); }
                  80% { transform: translateX(4px); }
                }
                .api-center-anim { animation: apiCenterFadeIn 180ms ease-out; }
                .console-shake { animation: consoleShake 360ms ease-in-out; }
              `}</style>

                <div
                  key={selectedApi}
                  className="api-center-anim flex min-h-0 flex-1 flex-col"
                >
                  {/* Output */}
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                    {(() => {
                      switch (selectedApi) {
                        case "llm":
                          return (
                            <div className="space-y-3">
                              {messages.length === 0 ? (
                                <div className="flex justify-start">
                                  <div className="max-w-[94%] rounded-2xl border border-white/10 bg-background/30 p-3 text-foreground">
                                    <div className="flex items-start gap-3">
                                      <span className="relative mt-1 inline-flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75 animate-ping" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                                      </span>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="rounded-xl border border-[#10b981]/25 bg-[#10b981]/5 px-2.5 py-1 text-[11px] font-mono text-[#10b981]">
                                            LIVE
                                          </span>
                                        </div>

                                        <div className="mt-2 text-sm leading-relaxed text-foreground/90">
                                          <span className="font-semibold">
                                            ✨{" "}
                                            <span className="text-[#10b981]">
                                              GPT-OSS-120B
                                            </span>{" "}
                                            모델과{" "}
                                            <span className="text-[#10b981] font-bold">
                                              실시간
                                            </span>
                                            으로 연결되었습니다.
                                          </span>
                                          <br />
                                          <span>
                                            <span className="text-[#10b981] font-bold">
                                              1,200억 개의 파라미터
                                            </span>
                                            가 당신의 질문을 분석할 준비를
                                            마쳤습니다.
                                          </span>
                                          <br />
                                          하단 입력창에 비즈니스 분석이나 텍스트
                                          생성을 요청해보세요.
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-2 flex items-center justify-end gap-2">
                                      <span className="font-mono text-[11px] text-foreground/40">
                                        {formatTime(Date.now())}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              {messages.map((m) => {
                                const isUser = m.role === "user";
                                return (
                                  <div
                                    key={m.id}
                                    className={[
                                      "flex",
                                      isUser ? "justify-end" : "justify-start",
                                    ].join(" ")}
                                  >
                                    <div
                                      className={[
                                        "max-w-[94%] rounded-2xl border p-3",
                                        isUser
                                          ? "border-accent/35 bg-accent/10 text-foreground"
                                          : "border-white/10 bg-background/30 text-foreground",
                                      ].join(" ")}
                                    >
                                      <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                        {m.content}
                                      </pre>
                                      <div className="mt-2 flex items-center justify-end gap-2">
                                        <span className="font-mono text-[11px] text-foreground/40">
                                          {formatTime(m.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div ref={endRef} />
                            </div>
                          );

                        case "embedding":
                          return (
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-[#10b981]/25 bg-[#10b981]/5 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-mono text-xs text-[#10b981]">
                                      Embedding Output
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                      고차원 벡터 일부를 JSON으로 표시합니다.
                                    </p>
                                  </div>
                                  <span className="rounded-xl border border-[#10b981]/20 bg-background/30 px-3 py-1 text-[11px] text-[#10b981]">
                                    Slice (mock)
                                  </span>
                                </div>

                                {embeddingVector ? (
                                  <>
                                    <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-background/30 p-3 text-xs text-foreground/75">
                                      {formatVector(embeddingVector)}
                                    </pre>
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                      {embeddingVector.map((v, idx) => {
                                        const isNeg = v < 0;
                                        return (
                                          <div
                                            key={`${idx}-${v}`}
                                            className={[
                                              "rounded-xl border px-2 py-2 text-center",
                                              isNeg
                                                ? "border-white/10 bg-background/30 text-foreground/70"
                                                : "border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]",
                                            ].join(" ")}
                                          >
                                            <div className="font-mono text-[10px] text-foreground/40">
                                              [{idx}]
                                            </div>
                                            <div className="font-mono text-xs">
                                              {v.toFixed(2)}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                ) : (
                                  <div className="mt-3 rounded-xl border border-white/5 bg-background/20 p-3">
                                    <p className="text-sm font-semibold text-foreground">
                                      아직 생성 결과가 없습니다.
                                    </p>
                                    <p className="mt-1 text-xs text-foreground/60">
                                      하단 입력 후 “임베딩 생성”을 눌러보세요.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );

                        case "reranker":
                          return (
                            <div className="flex h-full min-h-0 flex-col gap-3">
                              <div className="min-h-0 flex-1 overflow-hidden">
                                <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden lg:flex-row">
                                  <div className="min-h-0 w-full rounded-2xl border border-white/10 bg-background/25 p-4 lg:w-5/12">
                                    <div className="h-full min-h-0 overflow-y-auto pr-1">
                                      <div>
                                        <p className="font-mono text-xs text-foreground/60">
                                          Query
                                        </p>
                                        <textarea
                                          value={rerankQuestion}
                                          onChange={(e) => setRerankQuestion(e.target.value)}
                                          rows={2}
                                          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#10b981]/60 focus:ring-2 focus:ring-[#10b981]/30"
                                        />
                                      </div>
                                      <div className="mt-3">
                                        <p className="font-mono text-xs text-foreground/60">
                                          Documents (줄 단위)
                                        </p>
                                        <textarea
                                          value={rerankDocsText}
                                          onChange={(e) => setRerankDocsText(e.target.value)}
                                          rows={5}
                                          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#10b981]/60 focus:ring-2 focus:ring-[#10b981]/30"
                                        />
                                      </div>
                                      <p className="mt-3 text-xs text-foreground/60">
                                        입력된 Query와 Documents로 Reranker API를 호출합니다.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={handleRerankRun}
                                        disabled={isRerankLoading}
                                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 font-medium text-background shadow-[0_0_40px_rgba(16,185,129,0.22)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {isRerankLoading ? (
                                          <>
                                            <svg
                                              className="h-4 w-4 animate-spin"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                            </svg>
                                            <span>처리 중...</span>
                                          </>
                                        ) : (
                                          <span>재정렬 실행</span>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="min-h-0 w-full rounded-2xl border border-[#10b981]/25 bg-[#10b981]/5 p-4 lg:w-7/12 lg:flex lg:flex-col">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-mono text-xs text-[#10b981]">
                                          Qwen3 Reranker Output
                                        </p>
                                        <p className="mt-0.5 text-xs text-foreground/60">
                                          단어가 겹치지 않아도 문맥을 정확히 읽어내는
                                          Qwen3의 성능을 확인해보세요.
                                        </p>
                                        {displayedQuery && rerankResults ? (
                                          <p className="mt-1 text-xs text-foreground/60">
                                            Query: {displayedQuery}
                                          </p>
                                        ) : null}
                                      </div>
                                      <span className="rounded-xl border border-[#10b981]/20 bg-background/30 px-3 py-1 text-[11px] text-[#10b981]">
                                        Live API
                                      </span>
                                    </div>

                                    <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                                      {isRerankLoading ? (
                                        <div className="rounded-xl border border-[#10b981]/20 bg-background/30 p-3">
                                          <div className="inline-flex items-center gap-2 text-xs text-[#10b981]">
                                            <svg
                                              className="h-4 w-4 animate-spin"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                            </svg>
                                            <span>재정렬 처리 중...</span>
                                          </div>
                                        </div>
                                      ) : null}

                                      {rerankError ? (
                                        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                                          {rerankError}
                                        </div>
                                      ) : null}

                                      {rerankResults ? (
                                        <div className="mt-3 space-y-2">
                                          {rerankResults.map((r) => (
                                            <div
                                              key={`${r.rank}-${r.doc}`}
                                              className={[
                                                "rounded-xl border bg-background/30 p-3",
                                                r.rank === 1
                                                  ? "border-2 border-[#10b981] bg-[#10b981]/10 shadow-[0_0_40px_rgba(16,185,129,0.28)]"
                                                  : "border-white/10",
                                              ].join(" ")}
                                            >
                                              <div className="mb-2 flex items-center justify-between gap-2">
                                                <span
                                                  className={[
                                                    "font-mono text-[11px]",
                                                    r.rank === 1
                                                      ? "text-[#10b981]"
                                                      : "text-foreground/55",
                                                  ].join(" ")}
                                                >
                                                  Rank {r.rank}
                                                </span>
                                                <span className="rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 font-mono text-[11px] text-[#10b981]">
                                                  Score {r.score.toFixed(4)}
                                                </span>
                                              </div>
                                              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
                                                {r.doc}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="rounded-xl border border-white/5 bg-background/20 p-3">
                                          <p className="text-sm font-semibold text-foreground">
                                            아직 재정렬 결과가 없습니다.
                                          </p>
                                          <p className="mt-1 text-xs text-foreground/60">
                                            Query와 Documents를 입력한 뒤 “재정렬 실행”을
                                            눌러보세요.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );

                        case "tts":
                          return (
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-[#10b981]/25 bg-[#10b981]/5 p-4">
                                <p className="font-mono text-xs text-[#10b981]">
                                  Audio Player (UI Demo)
                                </p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  재생/일시정지는 오디오가 아니라 UI
                                  애니메이션으로 동작합니다.
                                </p>

                                <div className="mt-4 flex items-center justify-between gap-4">
                                  <button
                                    type="button"
                                    onClick={handleTtsPlayPause}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981] text-background shadow-[0_0_40px_rgba(16,185,129,0.22)] transition-opacity hover:opacity-90"
                                  >
                                    {ttsPlaying ? (
                                      <IconPause className="h-5 w-5" />
                                    ) : (
                                      <IconPlay className="h-5 w-5" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                                      <div
                                        className="h-2 rounded-full bg-[#10b981]"
                                        style={{
                                          width: `${Math.round(ttsProgress * 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-foreground/50">
                                      <span>
                                        {Math.round(
                                          (ttsDurationMs * ttsProgress) / 1000,
                                        )}
                                        s
                                      </span>
                                      <span>
                                        {Math.round(ttsDurationMs / 1000)}s
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 flex items-end gap-1">
                                  {(ttsWave?.length ? ttsWave : [])
                                    .slice(0, 26)
                                    .map((v, idx) => {
                                      const h = Math.max(6, Math.round(v * 44));
                                      return (
                                        <div
                                          key={`${idx}-${v}`}
                                          className={[
                                            "w-[6px] rounded-sm bg-white/10",
                                            ttsPlaying
                                              ? "bg-[#10b981]"
                                              : "bg-white/10",
                                          ].join(" ")}
                                          style={{ height: h }}
                                        />
                                      );
                                    })}
                                  {!ttsWave.length ? (
                                    <div className="mt-2 text-xs text-foreground/60">
                                      하단에서 “합성” 후 재생을 눌러보세요.
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );

                        case "stt":
                          return (
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-[#10b981]/25 bg-[#10b981]/5 p-4">
                                <p className="font-mono text-xs text-[#10b981]">
                                  Transcript Output
                                </p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  음성을 텍스트로 변환한 결과를 표시합니다.
                                  (mock)
                                </p>

                                {sttTranscript ? (
                                  <div className="mt-3 rounded-xl border border-white/5 bg-background/30 p-3">
                                    <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/80">
                                      {sttTranscript}
                                    </pre>
                                  </div>
                                ) : (
                                  <div className="mt-3 rounded-xl border border-white/5 bg-background/20 p-3">
                                    <p className="text-sm font-semibold text-foreground">
                                      아직 변환 결과가 없습니다.
                                    </p>
                                    <p className="mt-1 text-xs text-foreground/60">
                                      하단에서 파일 업로드 또는 마이크 UI 후
                                      “변환하기”를 눌러보세요.
                                    </p>
                                  </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-lg border border-white/10 bg-background/30 px-3 py-1 text-[11px] text-foreground/60">
                                    Source:{" "}
                                    {sttFileName ??
                                      (sttRecording
                                        ? "Microphone(데모)"
                                        : "Upload/Mic")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );

                        default:
                          return (
                            <div className="rounded-2xl border border-white/5 bg-background/20 p-4">
                              <p className="text-sm font-semibold text-foreground">
                                지원 준비 중입니다.
                              </p>
                            </div>
                          );
                      }
                    })()}
                  </div>

                  {/* Input */}
                  <div
                    className={
                      selectedApi === "reranker"
                        ? "hidden"
                        : "flex-shrink-0 border-t border-white/5 bg-background/20 p-4"
                    }
                  >
                    {selectedApi === "llm" ? (
                      <form onSubmit={onSend}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="sr-only" htmlFor="prompt">
                                메시지 입력
                              </label>
                              <input
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={placeholder}
                                className="h-11 w-full rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-[#10b981]/60 focus:ring-2 focus:ring-[#10b981]/30"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={!prompt.trim() || isChatLoading}
                              className={[
                                "group inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-background transition-all",
                                "bg-[#10b981] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_40px_rgba(16,185,129,0.22)]",
                              ].join(" ")}
                            >
                              {isChatLoading ? (
                                <>
                                  <svg
                                    className="h-4 w-4 animate-spin text-background"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                  </svg>
                                  <span>답변 생성 중...</span>
                                </>
                              ) : (
                                <>
                                  <span>전송</span>
                                  <span className="transition-transform group-hover:translate-x-1">
                                    →
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : null}

                    {selectedApi === "embedding" ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEmbeddingRun();
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="font-mono text-xs text-foreground/60">
                              입력 (짧은 문장)
                            </p>
                            <textarea
                              value={embeddingText}
                              onChange={(e) => setEmbeddingText(e.target.value)}
                              rows={3}
                              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-[#10b981]/60 focus:ring-2 focus:ring-[#10b981]/30"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-foreground/60">
                              버튼 클릭 시 mock 벡터를 생성합니다.
                            </p>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(16,185,129,0.22)] hover:opacity-90 transition-opacity"
                            >
                              임베딩 생성
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : null}

                    {selectedApi === "tts" ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleTtsSynthesize();
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="font-mono text-xs text-foreground/60">
                              읽어줄 텍스트
                            </p>
                            <textarea
                              value={ttsText}
                              onChange={(e) => setTtsText(e.target.value)}
                              rows={3}
                              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#10b981]/60 focus:ring-2 focus:ring-[#10b981]/30"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-foreground/60">
                              합성 시 mock 웨이브가 생성됩니다.
                            </p>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(16,185,129,0.22)] hover:opacity-90 transition-opacity"
                            >
                              합성
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : null}

                    {selectedApi === "stt" ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                          <div className="flex-1">
                            <p className="font-mono text-xs text-foreground/60">
                              음성 파일 업로드 (선택)
                            </p>
                            <label
                              className={[
                                "mt-2 block cursor-pointer rounded-xl border border-dashed px-4 py-3 transition-colors",
                                sttFileName
                                  ? "border-[#10b981]/40 bg-[#10b981]/5"
                                  : "border-white/10 bg-background/30 hover:border-[#10b981]/30",
                              ].join(" ")}
                            >
                              <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] ?? null;
                                  setSttFileName(f ? f.name : null);
                                  setSttTranscript(null);
                                  setSttRecording(false);
                                }}
                              />
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-background/20 text-foreground/80">
                                  <IconUpload className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">
                                    {sttFileName ? sttFileName : "파일 선택"}
                                  </p>
                                  <p className="text-xs text-foreground/60">
                                    audio/* 지원 (UI 데모)
                                  </p>
                                </div>
                              </div>
                            </label>
                          </div>

                          <div className="w-full lg:w-[160px]">
                            <p className="font-mono text-xs text-foreground/60">
                              마이크 녹음 (선택)
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSttRecording((v) => !v);
                                setSttTranscript(null);
                              }}
                              className={[
                                "mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                                sttRecording
                                  ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]"
                                  : "border-white/10 bg-background/30 text-foreground/80 hover:border-[#10b981]/30",
                              ].join(" ")}
                            >
                              <span className="inline-flex items-center gap-2 justify-center">
                                <IconMic className="h-5 w-5" />
                                {sttRecording ? "녹음 중..." : "녹음 시작"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-foreground/60">
                            선택한 입력을 mock 변환합니다.
                          </p>
                          <button
                            type="button"
                            onClick={handleSttConvert}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(16,185,129,0.22)] hover:opacity-90 transition-opacity"
                          >
                            변환하기
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Right: Developer Console */}
            <aside className="w-full lg:w-[38%] lg:min-w-[320px] lg:flex-shrink-0">
              <div className="flex h-[calc(100vh-240px)] min-h-0 flex-col rounded-2xl border border-white/5 bg-surface/35 backdrop-blur-xl overflow-hidden">
                <div className="border-b border-white/5 bg-background/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-foreground/60">
                        Developer Console
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        POST{" "}
                        <span className="text-[#10b981]">
                          {selectedApi === "reranker"
                            ? "/api/rerank"
                            : "/api/chat"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resetConsoleForApi(selectedApi)}
                        className="rounded-lg border border-white/10 bg-background/30 px-3 py-1 text-[11px] font-mono text-foreground/70 transition-colors hover:border-[#10b981]/40 hover:text-[#10b981]"
                      >
                        Reset
                      </button>
                      <span
                        className={[
                          "rounded-lg border border-white/10 bg-background/30 px-3 py-1 text-[11px] font-mono",
                          currentConsole.statusCode === 200
                            ? "text-[#10b981]"
                            : currentConsole.statusCode &&
                                currentConsole.statusCode >= 400
                              ? "text-[#f87171]"
                              : "text-foreground/60",
                        ].join(" ")}
                      >
                        {currentConsole.statusLine}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/5 bg-background/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs text-foreground/60">
                          Request
                        </p>
                        <span className="rounded-lg border border-white/10 bg-background/30 px-2 py-0.5 text-[11px] text-foreground/60">
                          JSON Body
                        </span>
                      </div>
                      <textarea
                        value={currentConsole.requestJson}
                        onChange={(e) => {
                          patchConsole(selectedApi, {
                            requestJson: e.target.value,
                            error: null,
                          });
                        }}
                        placeholder={`{\n  "model": "openai/gpt-oss-120b",\n  "input": "직접 입력한 내용"\n}`}
                        rows={9}
                        className="mt-3 min-h-[180px] w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 font-mono text-[12px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-[#10b981]/60 focus:ring-2 focus:ring-[#10b981]/30"
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-foreground/60">
                          편집 후 JSON을 파싱해 전송합니다.
                        </p>
                        <button
                          type="button"
                          onClick={sendConsoleRequest}
                          disabled={isChatLoading}
                          className={[
                            "rounded-xl border px-5 py-3 text-xs font-medium transition-colors",
                            "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/15",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            consoleSubmitShake ? "console-shake" : "",
                          ].join(" ")}
                        >
                          {isChatLoading ? "전송 중..." : "요청 전송"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-background/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs text-foreground/60">
                          Response
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentConsole.responseJson) return;
                            try {
                              await navigator.clipboard.writeText(
                                currentConsole.responseJson,
                              );
                              setConsoleCopied(true);
                              window.setTimeout(() => {
                                setConsoleCopied(false);
                              }, 1200);
                            } catch {
                              setConsoleCopied(false);
                            }
                          }}
                          disabled={!currentConsole.responseJson}
                          className={[
                            "rounded-lg border px-3 py-1 text-[11px] font-mono transition-colors",
                            "border-white/10 bg-background/30 text-foreground/70",
                            "hover:border-[#10b981]/40 hover:text-[#10b981]",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                          ].join(" ")}
                        >
                          {consoleCopied ? "복사됨" : "복사"}
                        </button>
                      </div>
                      {currentConsole.responseJson ? (
                        <JsonCode text={currentConsole.responseJson} />
                      ) : (
                        <div className="mt-3 text-xs text-foreground/60">
                          아직 응답 데이터가 없습니다.
                        </div>
                      )}
                    </div>

                    {currentConsole.error ? (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 font-mono text-[12px] text-red-300">
                        {currentConsole.error}
                      </div>
                    ) : null}

                    {isChatLoading ? (
                      <div className="rounded-xl border border-[#10b981]/25 bg-[#10b981]/5 p-3 text-xs text-[#10b981]">
                        답변 생성 중... (응답 대기)
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>

            {(selectedApi === "llm" ||
              selectedApi === "reranker" ||
              selectedApi === "embedding") ? (
              <section className="w-full lg:basis-full">
                <div className="rounded-xl border-t border-[#10b981]/20 bg-[#10b981]/5 px-4 py-3">
                  <SmartSolutionGuide
                    selectedApi={selectedApi}
                    onNavigateApi={moveToApiDetail}
                  />
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
