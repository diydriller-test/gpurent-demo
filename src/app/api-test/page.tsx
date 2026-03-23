"use client";

import Link from "next/link";
import React, {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
} from "react";
import { NavAuthButton } from "@/components/NavAuthButton";
import { getToken } from "@/lib/token";
import { SmartSolutionGuide } from "./components/SmartSolutionGuide";
import { JsonCode } from "./components/JsonCode";
import { DeveloperCodeSection } from "./components/DeveloperCodeSection";
import { EmbeddingDeveloperCodeSection } from "./components/EmbeddingDeveloperCodeSection";
import { PlaygroundDeveloperCodeSection } from "./components/PlaygroundDeveloperCodeSection";
import { ApiOutputPanel } from "./components/ApiOutputPanel";
import { ApiInputPanel } from "./components/ApiInputPanel";
import { buildLlmDevCodePython } from "./lib/buildLlmDevCodePython";
import { buildEmbeddingDevCodePython } from "./lib/buildEmbeddingDevCodePython";
import { buildRerankDevCodePython } from "./lib/buildRerankDevCodePython";
import { buildTtsDevCodePython } from "./lib/buildTtsDevCodePython";
import { buildSttDevCodePython } from "./lib/buildSttDevCodePython";
import { useResultTriggeredBanner } from "./hooks/useResultTriggeredBanner";

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

const DEFAULT_EMBEDDING_PLAYGROUND_TEXT =
  "인공지능을 활용한 기업용 지식 관리 시스템 구축 및 운영 전략";

const DEFAULT_TTS_PLAYGROUND_TEXT =
  "안녕하세요. GPU Modu API 데모를 재생합니다.";
const TTS_LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "zh", label: "Chinese" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
] as const;
type TtsLanguage = (typeof TTS_LANGUAGE_OPTIONS)[number]["value"];
const DEFAULT_TTS_LANGUAGE: TtsLanguage = "auto";

const TTS_SPEAKER_OPTIONS = [
  { value: "Aiden", label: "Aiden" },
  { value: "Dylan", label: "Dylan" },
  { value: "Eric", label: "Eric" },
  { value: "Ono_anna", label: "Ono_anna" },
  { value: "Ryan", label: "Ryan" },
  { value: "Serena", label: "Serena" },
  { value: "Sohee", label: "Sohee" },
  { value: "Uncle_fu", label: "Uncle_fu" },
  { value: "Vivian", label: "Vivian" },
] as const;
type TtsSpeaker = (typeof TTS_SPEAKER_OPTIONS)[number]["value"];
const DEFAULT_TTS_SPEAKER: TtsSpeaker = "Ryan";

const DEFAULT_RERANK_QUERY =
  "사람 없고 한적한 곳에서 힐링하고 싶어";
const DEFAULT_RERANK_DOCS_TEXT =
  "- 사람들이 가장 많이 찾는 서울 핫플레이스 TOP 10\n- 여름 휴가철 인파로 북적이는 해운대 해수욕장 현황\n- 숲소리만 들리는 깊은 산속 프라이빗 독채 펜션\n- 친구들과 시끌벅적하게 즐기는 강남역 맛집 탐방";

const STT_ACCEPTED_LANGUAGE_CODES = [
  "af",
  "am",
  "ar",
  "as",
  "az",
  "ba",
  "be",
  "bg",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fo",
  "fr",
  "gl",
  "gu",
  "ha",
  "haw",
  "he",
  "hi",
  "hr",
  "ht",
  "hu",
  "hy",
  "id",
  "is",
  "it",
  "ja",
  "jw",
  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "la",
  "lb",
  "ln",
  "lo",
  "lt",
  "lv",
  "mg",
  "mi",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms",
  "mt",
  "my",
  "ne",
  "nl",
  "nn",
  "no",
  "oc",
  "pa",
  "pl",
  "ps",
  "pt",
  "ro",
  "ru",
  "sa",
  "sd",
  "si",
  "sk",
  "sl",
  "sn",
  "so",
  "sq",
  "sr",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "tk",
  "tl",
  "tr",
  "tt",
  "uk",
  "ur",
  "uz",
  "vi",
  "yi",
  "yo",
  "zh",
  "yue",
] as const;
type SttLanguage = (typeof STT_ACCEPTED_LANGUAGE_CODES)[number];

type SttHelpTooltipId = "vad" | "beam";
const STT_LANGUAGE_PRIORITY: readonly SttLanguage[] = ["ko", "en", "ja"];
const STT_DEFAULT_LANGUAGE: SttLanguage = "ko";
const STT_DEFAULT_VAD_ON = true;
const STT_DEFAULT_TASK = "transcribe";
const STT_DEFAULT_BEAM_SIZE = 3;
const STT_MIN_RECORDING_MS = 900;
const STT_WAVE_BARS_COUNT = 8;
const STT_WAVE_BAR_MIN_HEIGHT_PX = 3;
const STT_WAVE_BAR_MAX_HEIGHT_PX = 18;

function getSttLanguageLabel(code: SttLanguage) {
  if (code === "ko") return "ko (한국어)";
  if (code === "en") return "en (영어)";
  if (code === "ja") return "ja (일본어)";
  return code;
}

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function HelpInfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function SttHelpTooltip({
  id,
  hoverId,
  setHoverId,
  pinnedId,
  setPinnedId,
  content,
}: {
  id: SttHelpTooltipId;
  hoverId: SttHelpTooltipId | null;
  setHoverId: React.Dispatch<React.SetStateAction<SttHelpTooltipId | null>>;
  pinnedId: SttHelpTooltipId | null;
  setPinnedId: React.Dispatch<React.SetStateAction<SttHelpTooltipId | null>>;
  content: string;
}) {
  const isVisible = pinnedId ? pinnedId === id : hoverId === id;

  return (
    <div
      data-stt-tooltip-root="true"
      className="relative inline-flex"
      onMouseEnter={() => setHoverId(id)}
      onMouseLeave={() => {
        if (!pinnedId) setHoverId(null);
      }}
    >
      <button
        type="button"
        aria-label="설명 보기"
        onClick={(e) => {
          e.stopPropagation();
          setPinnedId((prev) => (prev === id ? null : id));
        }}
        className="rounded-full p-0.5 hover:text-muted-foreground/80"
      >
        <HelpInfoIcon className="h-[14px] w-[14px] text-muted-foreground/50" />
      </button>

      <div
        className={[
          "absolute bottom-full right-0 z-30 mb-2 w-[280px] max-w-[78vw] rounded-xl border p-3 text-xs backdrop-blur",
          "bg-popover border-primary/30 shadow-[0_0_40px_rgba(16,185,129,0.10)]",
          "transition-opacity duration-150",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="break-words whitespace-normal">{content}</div>
      </div>
    </div>
  );
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

/** TTS 데모용 재생 가능한 WAV blob URL (실전 API 전 시연용) */
function createMockTtsWavBlobUrl(durationSec = 2.5): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < numSamples; i++) {
    const t = (i / sampleRate) * 440 * 2 * Math.PI;
    const s = Math.sin(t) * 0.28 * 32767;
    view.setInt16(44 + i * 2, s, true);
  }
  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Text Playground ↔ Developer Console 동기화용 LLM Request JSON */
function buildLlmConsoleRequestJson(promptValue: string, temperature: number) {
  return JSON.stringify(
    {
      model: "openai/gpt-oss-120b",
      temperature,
      messages: [{ role: "user", content: promptValue }],
    },
    null,
    2,
  );
}

/**
 * 콘솔 JSON → Playground `prompt` / `temperature` (슬라이더 범위 0~1에 맞춤)
 * 파싱 실패 시 null
 */
function tryParseLlmConsoleToPlayground(jsonText: string): {
  prompt?: string;
  temperature?: number;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      temperature?: unknown;
      messages?: unknown;
      input?: unknown;
    };
    const out: { prompt?: string; temperature?: number } = {};

    if (typeof parsed.temperature === "number" && Number.isFinite(parsed.temperature)) {
      out.temperature = clamp(parsed.temperature, 0, 1);
    } else if (
      typeof parsed.temperature === "string" &&
      parsed.temperature.trim() !== "" &&
      Number.isFinite(Number(parsed.temperature))
    ) {
      out.temperature = clamp(Number(parsed.temperature), 0, 1);
    }

    const directInput =
      typeof parsed.input === "string" ? parsed.input : undefined;
    let msgContent: string | undefined;
    if (Array.isArray(parsed.messages)) {
      const u = [...parsed.messages]
        .reverse()
        .find(
          (m) =>
            m &&
            typeof m === "object" &&
            (m as { role?: string }).role === "user" &&
            typeof (m as { content?: unknown }).content === "string",
        ) as { content?: string } | undefined;
      msgContent = u?.content;
    }
    const content = msgContent ?? directInput;
    if (typeof content === "string") {
      out.prompt = content;
    }

    return out;
  } catch {
    return null;
  }
}

/** Embedding Playground ↔ Developer Console 동기화용 Request JSON */
function buildEmbeddingConsoleRequestJson(inputText: string) {
  return JSON.stringify(
    {
      input: inputText,
      input_type: "string",
    },
    null,
    2,
  );
}

/**
 * Embedding 콘솔 JSON → Playground `embeddingText`
 * 파싱 실패 시 null
 */
function tryParseEmbeddingConsoleToPlayground(jsonText: string): {
  input?: string;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as { input?: unknown };
    const out: { input?: string } = {};
    if (typeof parsed.input === "string") {
      out.input = parsed.input;
    }
    return out;
  } catch {
    return null;
  }
}

function isTtsLanguage(value: string): value is TtsLanguage {
  return TTS_LANGUAGE_OPTIONS.some((opt) => opt.value === value);
}

function isTtsSpeaker(value: string): value is TtsSpeaker {
  return TTS_SPEAKER_OPTIONS.some((opt) => opt.value === value);
}

/** TTS Playground ↔ Developer Console 동기화용 Request JSON */
function buildTtsConsoleRequestJson(
  text: string,
  language: TtsLanguage,
  speaker: TtsSpeaker,
  styleInstruction: string,
) {
  const trimmedStyle = styleInstruction.trim();
  const payload: Record<string, unknown> = {
    text,
    language,
    speaker,
    format: "mp3",
  };
  if (trimmedStyle) {
    payload.style_instruction = trimmedStyle;
  }
  return JSON.stringify(payload, null, 2);
}

function tryParseTtsConsoleToPlayground(jsonText: string): {
  text?: string;
  language?: TtsLanguage;
  speaker?: TtsSpeaker;
  styleInstruction?: string;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      text?: unknown;
      language?: unknown;
      speaker?: unknown;
      style_instruction?: unknown;
    };
    const out: {
      text?: string;
      language?: TtsLanguage;
      speaker?: TtsSpeaker;
      styleInstruction?: string;
    } = {};
    if (typeof parsed.text === "string") {
      out.text = parsed.text;
    }
    if (typeof parsed.language === "string" && isTtsLanguage(parsed.language)) {
      out.language = parsed.language;
    }
    if (typeof parsed.speaker === "string" && isTtsSpeaker(parsed.speaker)) {
      out.speaker = parsed.speaker;
    }
    if ("style_instruction" in parsed) {
      if (typeof parsed.style_instruction === "string") {
        out.styleInstruction = parsed.style_instruction;
      } else if (parsed.style_instruction === null) {
        out.styleInstruction = "";
      }
    }
    return out;
  } catch {
    return null;
  }
}

function sanitizeRerankDocLine(line: string): string {
  return line.trim().replace(/^-+\s*/, "");
}

/** Reranker Playground ↔ Developer Console 동기화용 Request JSON */
function buildRerankConsoleRequestJson(query: string, docsText: string): string {
  const input = docsText
    .split("\n")
    .map((line) => sanitizeRerankDocLine(line))
    .filter(Boolean);
  return JSON.stringify(
    {
      query: query.trim(),
      input,
    },
    null,
    2,
  );
}

function rerankDocsArrayToPlaygroundText(docs: string[]): string {
  return docs
    .map((s) => String(s).trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

/**
 * Reranker 콘솔 JSON → Playground `rerankQuestion` / `rerankDocsText`
 * 파싱 실패 시 null
 */
function tryParseRerankConsoleToPlayground(jsonText: string): {
  query?: string;
  docsText?: string;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      query?: unknown;
      input?: unknown;
    };
    const out: { query?: string; docsText?: string } = {};

    if (typeof parsed.query === "string") {
      out.query = parsed.query;
    }

    if (Array.isArray(parsed.input)) {
      const items = parsed.input.filter(
        (x): x is string => typeof x === "string",
      );
      out.docsText = rerankDocsArrayToPlaygroundText(items);
    }

    return out;
  } catch {
    return null;
  }
}

function isSttLanguageCode(s: string): s is SttLanguage {
  return (STT_ACCEPTED_LANGUAGE_CODES as readonly string[]).includes(s);
}

function clampSttBeamSize(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** STT Playground ↔ Developer Console 동기화용 Request JSON */
function buildSttConsoleRequestJson(
  language: SttLanguage,
  vadOn: boolean,
  beamSize: number,
  recordedFileInfo: string | null,
): string {
  return JSON.stringify(
    {
      language,
      task: STT_DEFAULT_TASK,
      vad_filter: vadOn,
      beam_size: beamSize,
      ...(recordedFileInfo ? { file: recordedFileInfo } : {}),
    },
    null,
    2,
  );
}

/**
 * STT 콘솔 JSON → Playground 언어 / VAD / Beam / 녹음 파일 메타
 * 파싱 실패 시 null
 */
function tryParseSttConsoleToPlayground(jsonText: string): {
  language?: SttLanguage;
  vadOn?: boolean;
  beamSize?: number;
  recordedFileInfo?: string | null;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      language?: unknown;
      vad_filter?: unknown;
      beam_size?: unknown;
      file?: unknown;
    };
    const out: {
      language?: SttLanguage;
      vadOn?: boolean;
      beamSize?: number;
      recordedFileInfo?: string | null;
    } = {};

    if (typeof parsed.language === "string" && isSttLanguageCode(parsed.language)) {
      out.language = parsed.language;
    }

    if (typeof parsed.vad_filter === "boolean") {
      out.vadOn = parsed.vad_filter;
    }

    if (typeof parsed.beam_size === "number" && Number.isFinite(parsed.beam_size)) {
      out.beamSize = clampSttBeamSize(parsed.beam_size);
    } else if (
      typeof parsed.beam_size === "string" &&
      parsed.beam_size.trim() !== "" &&
      Number.isFinite(Number(parsed.beam_size))
    ) {
      out.beamSize = clampSttBeamSize(Number(parsed.beam_size));
    }

    if ("file" in parsed) {
      if (parsed.file === null || parsed.file === "") {
        out.recordedFileInfo = null;
      } else if (typeof parsed.file === "string") {
        out.recordedFileInfo = parsed.file;
      }
    }

    return out;
  } catch {
    return null;
  }
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
  const [llmTemperature, setLlmTemperature] = useState<number>(0.1);
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
  const getDefaultConsoleRequestJson = useCallback(
    (api: ApiId): string => {
    if (api === "llm") {
      return buildLlmConsoleRequestJson("", llmTemperature);
    }
    if (api === "reranker") {
      return buildRerankConsoleRequestJson(
        DEFAULT_RERANK_QUERY,
        DEFAULT_RERANK_DOCS_TEXT,
      );
    }
    if (api === "embedding") {
      return buildEmbeddingConsoleRequestJson(DEFAULT_EMBEDDING_PLAYGROUND_TEXT);
    }
    if (api === "stt") {
      return buildSttConsoleRequestJson(
        STT_DEFAULT_LANGUAGE,
        STT_DEFAULT_VAD_ON,
        STT_DEFAULT_BEAM_SIZE,
        null,
      );
    }
    if (api === "tts") {
      return buildTtsConsoleRequestJson(
        DEFAULT_TTS_PLAYGROUND_TEXT,
        DEFAULT_TTS_LANGUAGE,
        DEFAULT_TTS_SPEAKER,
        "",
      );
    }
    return "{}";
    },
    [llmTemperature],
  );
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

  const [devCodeOpen, setDevCodeOpen] = useState(false);
  const [devCodeCopied, setDevCodeCopied] = useState(false);

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
        model: "gpt-oss-120B",
        modelSizeB: 120,
        taskTags: ["#LLM", "#Text-Gen"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "embedding-70b",
        task: "Embedding",
        apiId: "embedding",
        model: "Qwen-Embedding-8B",
        modelSizeB: 8,
        taskTags: ["#Embedding", "#Semantic-Search"],
        formats: ["Transformers", "ONNX"],
      },
      {
        id: "reranker-8b",
        task: "Reranker",
        apiId: "reranker",
        model: "Qwen3 Reranker-8B",
        modelSizeB: 8,
        taskTags: ["#Reranker", "#Qwen3", "#Search-Quality"],
        formats: ["GGUF", "Transformers"],
      },
      {
        id: "tts-13b",
        task: "TTS",
        apiId: "tts",
        model: "Qwen3-TTS",
        modelSizeB: 13,
        taskTags: ["#TTS", "#Audio"],
        formats: ["vLLM", "ONNX"],
      },
      {
        id: "stt-13b",
        task: "STT",
        apiId: "stt",
        model: "Qwen3-STT",
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
    DEFAULT_EMBEDDING_PLAYGROUND_TEXT,
  );
  const [embeddingVector, setEmbeddingVector] = useState<number[] | null>(null);
  const [isEmbeddingLoading, setIsEmbeddingLoading] = useState(false);
  const [embeddingError, setEmbeddingError] = useState<string | null>(null);
  const [embeddingDisplayNonce, setEmbeddingDisplayNonce] = useState(0);
  const [embeddingDevCodeOpen, setEmbeddingDevCodeOpen] = useState(false);
  const [embeddingDevCodeCopied, setEmbeddingDevCodeCopied] = useState(false);

  const embeddingDevCodePython = useMemo(
    () => buildEmbeddingDevCodePython({ inputText: embeddingText }),
    [embeddingText],
  );

  // Reranker
  const [rerankQuestion, setRerankQuestion] = useState(DEFAULT_RERANK_QUERY);
  const [rerankDocsText, setRerankDocsText] = useState(DEFAULT_RERANK_DOCS_TEXT);
  const [rerankResults, setRerankResults] = useState<Array<{
    rank: number;
    doc: string;
    score: number;
  }> | null>(null);
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [isRerankLoading, setIsRerankLoading] = useState(false);
  const [rerankError, setRerankError] = useState<string | null>(null);

  // TTS (Playground: Mock 합성 + blob 오디오 재생)
  const [ttsText, setTtsText] = useState(DEFAULT_TTS_PLAYGROUND_TEXT);
  const [ttsLanguage, setTtsLanguage] = useState<TtsLanguage>(
    DEFAULT_TTS_LANGUAGE,
  );
  const [ttsSpeaker, setTtsSpeaker] = useState<TtsSpeaker>(DEFAULT_TTS_SPEAKER);
  const [ttsStyleInstruction, setTtsStyleInstruction] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mockResponse, setMockResponse] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [ttsWave, setTtsWave] = useState<number[]>(() => []);
  const [ttsDurationMs, setTtsDurationMs] = useState(14_200);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsBlobUrlRef = useRef<string | null>(null);

  // STT
  const [sttFileName, setSttFileName] = useState<string | null>(null);
  const [sttSelectedAudioFile, setSttSelectedAudioFile] = useState<File | null>(
    null,
  );
  const [sttTranscript, setSttTranscript] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [sttLanguage, setSttLanguage] = useState<SttLanguage>(
    STT_DEFAULT_LANGUAGE,
  );
  const [sttVadOn, setSttVadOn] = useState<boolean>(STT_DEFAULT_VAD_ON);
  const [sttBeamSize, setSttBeamSize] = useState<number>(STT_DEFAULT_BEAM_SIZE);
  const [isSttLoading, setIsSttLoading] = useState(false);
  const [sttRecordedFileInfo, setSttRecordedFileInfo] = useState<string | null>(
    null,
  );
  const [sttError, setSttError] = useState<string | null>(null);

  const [sttMicBars, setSttMicBars] = useState<number[]>(
    () =>
      Array.from({ length: STT_WAVE_BARS_COUNT }, () => STT_WAVE_BAR_MIN_HEIGHT_PX),
  );

  const [sttTooltipPinned, setSttTooltipPinned] = useState<SttHelpTooltipId | null>(
    null,
  );
  const [sttTooltipHoverId, setSttTooltipHoverId] = useState<SttHelpTooltipId | null>(
    null,
  );

  const [sttUploadClearMounted, setSttUploadClearMounted] = useState(false);
  const sttUploadClearTimerRef = useRef<number | null>(null);
  const sttLangDropdownRootRef = useRef<HTMLDivElement | null>(null);
  const sttLangInputRef = useRef<HTMLInputElement | null>(null);
  const [sttLangDropdownOpen, setSttLangDropdownOpen] = useState(false);
  const [sttLangQuery, setSttLangQuery] = useState<string>("");

  const sttFileInputRef = useRef<HTMLInputElement | null>(null);

  const [rerankerDevCodeOpen, setRerankerDevCodeOpen] = useState(false);
  const [rerankerDevCodeCopied, setRerankerDevCodeCopied] = useState(false);
  const [ttsDevCodeOpen, setTtsDevCodeOpen] = useState(false);
  const [ttsDevCodeCopied, setTtsDevCodeCopied] = useState(false);
  const [sttDevCodeOpen, setSttDevCodeOpen] = useState(false);
  const [sttDevCodeCopied, setSttDevCodeCopied] = useState(false);

  const rerankerDevCodePython = useMemo(
    () =>
      buildRerankDevCodePython({
        query: rerankQuestion,
        docLines: rerankDocsText.split("\n"),
      }),
    [rerankQuestion, rerankDocsText],
  );

  const ttsDevCodePython = useMemo(
    () => buildTtsDevCodePython({ text: ttsText }),
    [ttsText],
  );

  const sttDevCodePython = useMemo(
    () =>
      buildSttDevCodePython({
        language: sttLanguage,
        task: STT_DEFAULT_TASK,
        beamSize: sttBeamSize,
        vadOn: sttVadOn,
      }),
    [sttLanguage, sttBeamSize, sttVadOn],
  );

  useEffect(() => {
    if (!sttTooltipPinned) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.('[data-stt-tooltip-root="true"]')) return;
      setSttTooltipPinned(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [sttTooltipPinned]);

  useEffect(() => {
    if (sttUploadClearTimerRef.current) {
      clearTimeout(sttUploadClearTimerRef.current);
      sttUploadClearTimerRef.current = null;
    }

    if (sttFileName) {
      setSttUploadClearMounted(true);
      return;
    }

    // s.t. drop-out animation을 위해 잠깐 DOM에 남김
    sttUploadClearTimerRef.current = window.setTimeout(() => {
      setSttUploadClearMounted(false);
    }, 180);

    return () => {
      if (sttUploadClearTimerRef.current) {
        clearTimeout(sttUploadClearTimerRef.current);
        sttUploadClearTimerRef.current = null;
      }
    };
  }, [sttFileName]);

  const llmHasWorkflowResult = useMemo(
    () =>
      messages.some(
        (m) =>
          m.role === "assistant" &&
          m.content.trim() !== "" &&
          m.content !== "답변 생성 중...",
      ),
    [messages],
  );

  const embeddingHasWorkflowResult =
    embeddingVector !== null && embeddingVector.length > 0;

  const rerankerHasWorkflowResult =
    rerankResults !== null && rerankResults.length > 0;

  const ttsHasWorkflowResult = Boolean(audioUrl);

  const sttHasWorkflowResult =
    typeof sttTranscript === "string" && sttTranscript.trim().length > 0;

  const hasWorkflowBannerResult =
    (selectedApi === "llm" && llmHasWorkflowResult) ||
    (selectedApi === "embedding" && embeddingHasWorkflowResult) ||
    (selectedApi === "reranker" && rerankerHasWorkflowResult) ||
    (selectedApi === "tts" && ttsHasWorkflowResult) ||
    (selectedApi === "stt" && sttHasWorkflowResult);

  const { mounted: workflowBannerMounted, visible: workflowBannerVisible } =
    useResultTriggeredBanner(hasWorkflowBannerResult);

  useEffect(() => {
    if (!sttLangDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const root = sttLangDropdownRootRef.current;
      if (!root) return;
      if (root.contains(target)) return;
      setSttLangDropdownOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [sttLangDropdownOpen]);

  useEffect(() => {
    if (!sttLangDropdownOpen) {
      setSttLangQuery(getSttLanguageLabel(sttLanguage));
    }
  }, [sttLangDropdownOpen, sttLanguage]);

  const sttLangOptions = useMemo(() => {
    const ordered = [
      ...STT_LANGUAGE_PRIORITY,
      ...STT_ACCEPTED_LANGUAGE_CODES.filter(
        (code) => !STT_LANGUAGE_PRIORITY.includes(code as SttLanguage),
      ),
    ] as SttLanguage[];

    const q = sttLangQuery.trim().toLowerCase();
    if (!q) return ordered;

    return ordered.filter((code) => {
      const label = getSttLanguageLabel(code).toLowerCase();
      return code.includes(q) || label.includes(q);
    });
  }, [sttLangQuery]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingStartAtRef = useRef<number | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const sttMicRafRef = useRef<number | null>(null);
  const sttMicBarsHeightsRef = useRef<number[]>(
    Array.from({ length: STT_WAVE_BARS_COUNT }, () => STT_WAVE_BAR_MIN_HEIGHT_PX),
  );

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
      if (ttsBlobUrlRef.current) {
        URL.revokeObjectURL(ttsBlobUrlRef.current);
        ttsBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const nextRequestJson = buildTtsConsoleRequestJson(
      ttsText,
      ttsLanguage,
      ttsSpeaker,
      ttsStyleInstruction,
    );

    setConsoleByApi((prev) => {
      if (prev.tts.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        tts: {
          ...prev.tts,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [ttsText, ttsLanguage, ttsSpeaker, ttsStyleInstruction]);

  useEffect(() => {
    const el = ttsAudioRef.current;
    if (!el || !audioUrl) return;

    const onLoaded = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setTtsDurationMs(Math.round(el.duration * 1000));
      }
    };
    const onTime = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setTtsProgress(el.currentTime / el.duration);
      }
    };
    const onEnded = () => {
      setTtsPlaying(false);
      setTtsProgress(0);
    };
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    const nextRequestJson = buildLlmConsoleRequestJson(prompt, llmTemperature);
    setConsoleByApi((prev) => {
      if (prev.llm.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        llm: {
          ...prev.llm,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [prompt, llmTemperature]);

  useEffect(() => {
    const nextRequestJson = buildEmbeddingConsoleRequestJson(embeddingText);

    setConsoleByApi((prev) => {
      if (prev.embedding.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        embedding: {
          ...prev.embedding,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [embeddingText]);

  useEffect(() => {
    const nextRequestJson = buildRerankConsoleRequestJson(
      rerankQuestion,
      rerankDocsText,
    );

    setConsoleByApi((prev) => {
      if (prev.reranker.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        reranker: {
          ...prev.reranker,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [rerankQuestion, rerankDocsText]);

  useEffect(() => {
    const nextRequestJson = buildSttConsoleRequestJson(
      sttLanguage,
      sttVadOn,
      sttBeamSize,
      sttRecordedFileInfo,
    );

    setConsoleByApi((prev) => {
      if (prev.stt.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        stt: {
          ...prev.stt,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [sttLanguage, sttVadOn, sttBeamSize, sttRecordedFileInfo]);

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

  const llmDevUserMessage = useMemo(() => {
    const trimmed = prompt.trim();
    return trimmed ? trimmed : "안녕, 만나서 반가워!";
  }, [prompt]);

  const llmDevCodePython = useMemo(() => {
    return buildLlmDevCodePython({
      userMessage: llmDevUserMessage,
      temperature: 0.1, // Get Developer Code에는 Temperature 슬라이더를 반영하지 않음
    });
  }, [llmDevUserMessage]);

  const currentConsole = consoleByApi[selectedApi];

  function patchConsole(api: ApiId, patch: Partial<ConsoleState>) {
    setConsoleByApi((prev) => ({
      ...prev,
      [api]: { ...prev[api], ...patch },
    }));
  }

  /** Developer Console JSON 편집 → Playground 상태와 동기화 */
  function handleConsoleRequestJsonChange(nextJson: string) {
    patchConsole(selectedApi, {
      requestJson: nextJson,
      error: null,
    });
    if (selectedApi === "llm") {
      const parsed = tryParseLlmConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.temperature !== undefined) {
        setLlmTemperature(parsed.temperature);
      }
      if (parsed.prompt !== undefined) {
        setPrompt(parsed.prompt);
      }
      return;
    }
    if (selectedApi === "embedding") {
      const parsed = tryParseEmbeddingConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.input !== undefined) {
        setEmbeddingText(parsed.input);
      }
      return;
    }
    if (selectedApi === "reranker") {
      const parsed = tryParseRerankConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.query !== undefined) {
        setRerankQuestion(parsed.query);
      }
      if (parsed.docsText !== undefined) {
        setRerankDocsText(parsed.docsText);
      }
      return;
    }
    if (selectedApi === "tts") {
      const parsed = tryParseTtsConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.text !== undefined) {
        setTtsText(parsed.text);
      }
      if (parsed.language !== undefined) {
        setTtsLanguage(parsed.language);
      }
      if (parsed.speaker !== undefined) {
        setTtsSpeaker(parsed.speaker);
      }
      if (parsed.styleInstruction !== undefined) {
        setTtsStyleInstruction(parsed.styleInstruction);
      }
      return;
    }
    if (selectedApi === "stt") {
      const parsed = tryParseSttConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.language !== undefined) {
        setSttLanguage(parsed.language);
      }
      if (parsed.vadOn !== undefined) {
        setSttVadOn(parsed.vadOn);
      }
      if (parsed.beamSize !== undefined) {
        setSttBeamSize(parsed.beamSize);
      }
      if (parsed.recordedFileInfo !== undefined) {
        setSttRecordedFileInfo(parsed.recordedFileInfo);
      }
    }
  }

  function resetConsoleForApi(api: ApiId) {
    setConsoleByApi((prev) => ({
      ...prev,
      [api]: createDefaultConsoleState(api),
    }));
    if (api === "reranker") {
      setDisplayedQuery("");
      setRerankQuestion(DEFAULT_RERANK_QUERY);
      setRerankDocsText(DEFAULT_RERANK_DOCS_TEXT);
      setRerankResults(null);
      setRerankError(null);
    }
    if (api === "embedding") {
      setEmbeddingText(DEFAULT_EMBEDDING_PLAYGROUND_TEXT);
      setEmbeddingVector(null);
      setEmbeddingError(null);
    }
    if (api === "stt") {
      setSttTranscript(null);
      setIsRecording(false);
      setAudioChunks([]);
      audioChunksRef.current = [];
      setSttRecordedFileInfo(null);
      setSttLanguage(STT_DEFAULT_LANGUAGE);
      setSttVadOn(STT_DEFAULT_VAD_ON);
      setSttBeamSize(STT_DEFAULT_BEAM_SIZE);
      setSttError(null);
      setIsSttLoading(false);
    }
    if (api === "tts") {
      if (ttsBlobUrlRef.current) {
        URL.revokeObjectURL(ttsBlobUrlRef.current);
        ttsBlobUrlRef.current = null;
      }
      setTtsText(DEFAULT_TTS_PLAYGROUND_TEXT);
      setTtsLanguage(DEFAULT_TTS_LANGUAGE);
      setTtsSpeaker(DEFAULT_TTS_SPEAKER);
      setTtsStyleInstruction("");
      setAudioUrl(null);
      setMockResponse(null);
      setTtsWave([]);
      setTtsDurationMs(14_200);
      setTtsProgress(0);
      setTtsPlaying(false);
      setIsSynthesizing(false);
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

  async function handleEmbeddingRun() {
    if (isEmbeddingLoading) return;
    const text = embeddingText.trim();
    if (!text) {
      setEmbeddingError("입력 텍스트를 확인해주세요.");
      setEmbeddingVector(null);
      patchConsole("embedding", {
        statusCode: null,
        statusLine: "—",
        responseJson: "",
        error: "`input` 문자열을 확인해주세요.",
      });
      return;
    }

    setIsEmbeddingLoading(true);
    setEmbeddingError(null);
    setEmbeddingVector(null);
    setConsoleCopied(false);
    patchConsole("embedding", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: buildEmbeddingConsoleRequestJson(text),
      responseJson: "",
      error: null,
    });

    try {
      const res = await fetch("/api/embedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = (await res.json().catch(() => null)) as
        | { embeddingVector?: unknown; error?: unknown }
        | null;

      patchConsole("embedding", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });

      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : "Embedding 요청에 실패했습니다.";
        setEmbeddingError(msg);
        setEmbeddingVector(null);
        patchConsole("embedding", {
          error: msg,
        });
        return;
      }

      const vec = data?.embeddingVector;
      if (!Array.isArray(vec)) {
        const msg = "Embedding 응답 형식이 올바르지 않습니다.";
        setEmbeddingError(msg);
        setEmbeddingVector(null);
        patchConsole("embedding", {
          statusCode: 502,
          statusLine: "502 Bad Gateway",
          responseJson: JSON.stringify({ error: msg }, null, 2),
          error: msg,
        });
        return;
      }

      const normalized = (vec as unknown[])
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((v: number) => Number.isFinite(v));

      setEmbeddingVector(normalized);
      setEmbeddingDisplayNonce((n) => n + 1);
      patchConsole("embedding", {
        statusCode: 200,
        statusLine: "200 OK",
        responseJson: JSON.stringify({ embeddingVector: normalized }, null, 2),
        error: null,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "서버 연결에 실패했습니다.";
      setEmbeddingError(msg);
      setEmbeddingVector(null);
      patchConsole("embedding", {
        statusCode: 500,
        statusLine: "500 Error",
        responseJson: JSON.stringify({ error: msg }, null, 2),
        error: msg,
      });
    } finally {
      setIsEmbeddingLoading(false);
    }
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
      requestJson: buildRerankConsoleRequestJson(rerankQuestion, rerankDocsText),
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

  /** Playground·개발자 콘솔 공통 — Mock TTS(클라이언트 합성, 서버 라우트 없음) */
  function runTtsMockSynthesis(
    textForWaveform: string,
    languageForSynthesis: TtsLanguage = ttsLanguage,
    speakerForSynthesis: TtsSpeaker = ttsSpeaker,
    styleInstructionForSynthesis: string = ttsStyleInstruction,
  ) {
    const trimmed = textForWaveform.trim();
    if (!trimmed || isSynthesizing) return;

    if (ttsBlobUrlRef.current) {
      URL.revokeObjectURL(ttsBlobUrlRef.current);
      ttsBlobUrlRef.current = null;
    }

    setAudioUrl(null);
    setMockResponse(null);
    setTtsPlaying(false);
    setTtsProgress(0);
    setIsSynthesizing(true);

    patchConsole("tts", {
      statusCode: null,
      statusLine: "Pending...",
      responseJson: "",
      error: null,
    });

    window.setTimeout(() => {
      const url = createMockTtsWavBlobUrl(2.5);
      ttsBlobUrlRef.current = url;

      const responseBody: Record<string, unknown> = {
        status: "success",
        audio_url: url,
        duration: "14.2s",
        model: "Qwen3-TTS",
        language: languageForSynthesis,
        speaker: speakerForSynthesis,
        format: "mp3",
      };
      const styleTrim = styleInstructionForSynthesis.trim();
      if (styleTrim) {
        responseBody.style_instruction = styleTrim;
      }

      setMockResponse(responseBody);
      setAudioUrl(url);
      setTtsWave(mockWaveform(trimmed, 32));
      setTtsDurationMs(14_200);
      setIsSynthesizing(false);

      patchConsole("tts", {
        statusCode: 200,
        statusLine: "200 OK",
        responseJson: JSON.stringify(responseBody, null, 2),
        error: null,
      });
    }, 1500);
  }

  function handleTtsRun() {
    runTtsMockSynthesis(ttsText, ttsLanguage, ttsSpeaker, ttsStyleInstruction);
  }

  function handleTtsPlayPause() {
    if (!audioUrl) return;
    const el = ttsAudioRef.current;
    if (!el) return;
    if (ttsPlaying) {
      el.pause();
      setTtsPlaying(false);
      return;
    }
    void el.play().then(() => setTtsPlaying(true)).catch(() => {
      setTtsPlaying(false);
    });
  }

  async function startRecording() {
    if (isRecording) return;
    setSttError(null);
    setSttTranscript(null);
    setSttRecordedFileInfo(null);
    setSttFileName(null);
    setSttSelectedAudioFile(null);
    setAudioChunks([]);
    audioChunksRef.current = [];
    recordingStartAtRef.current = null;
    stopMicVisualizer();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("MEDIA_UNAVAILABLE");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordingStartAtRef.current = Date.now();

      // STT 마이크 파형 시각화(AnalyserNode)
      try {
        const AudioContextCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextCtor) {
          throw new Error("AUDIO_CONTEXT_UNAVAILABLE");
        }

        const audioCtx = new AudioContextCtor() as AudioContext;
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;
        analyserNodeRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        freqDataRef.current = freqData;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        sttMicBarsHeightsRef.current = Array.from(
          { length: STT_WAVE_BARS_COUNT },
          () => STT_WAVE_BAR_MIN_HEIGHT_PX,
        );
        setSttMicBars(
          Array.from({ length: STT_WAVE_BARS_COUNT }, () =>
            STT_WAVE_BAR_MIN_HEIGHT_PX,
          ),
        );

        const barRange = Math.max(1, Math.floor(bufferLength / STT_WAVE_BARS_COUNT));
        const animate = () => {
          const a = analyserNodeRef.current;
          const fd = freqDataRef.current;
          if (!a || !fd) return;

          // TS lib.dom 타입 제네릭 차이로 ArrayBuffer vs ArrayBufferLike가 불일치할 수 있음
          a.getByteFrequencyData(fd as Uint8Array<ArrayBuffer>);

          const now = performance.now();
          const heights = [...sttMicBarsHeightsRef.current];

          for (let i = 0; i < STT_WAVE_BARS_COUNT; i++) {
            const start = i * barRange;
            const end =
              i === STT_WAVE_BARS_COUNT - 1 ? fd.length : start + barRange;

            let sum = 0;
            let count = 0;
            for (let j = start; j < end; j++) {
              sum += fd[j];
              count++;
            }
            const avg = count ? sum / count : 0;
            const raw = avg / 255; // 0..1
            const quiet = raw < 0.06;

            // Voice activity에 가까울수록 민트로 튀도록(시각은 render에서 결정)
            const eased = quiet ? 0.01 : Math.pow(raw, 0.65);
            let target =
              STT_WAVE_BAR_MIN_HEIGHT_PX +
              eased * (STT_WAVE_BAR_MAX_HEIGHT_PX - STT_WAVE_BAR_MIN_HEIGHT_PX);

            if (quiet) {
              // 무음일 때 아주 작게 떨리는 효과
              target +=
                Math.sin(now / 120 + i) * 0.9 + (Math.random() - 0.5) * 0.6;
            }

            target = clamp(target, STT_WAVE_BAR_MIN_HEIGHT_PX, STT_WAVE_BAR_MAX_HEIGHT_PX);

            const prev = heights[i] ?? STT_WAVE_BAR_MIN_HEIGHT_PX;
            heights[i] = prev + (target - prev) * 0.35;
          }

          sttMicBarsHeightsRef.current = heights;
          setSttMicBars(heights);
          sttMicRafRef.current = window.requestAnimationFrame(animate);
        };

        setTimeout(() => {
          // setTimeout으로 첫 프레임 지연을 줄여 초기 깜빡임 방지
          sttMicRafRef.current = window.requestAnimationFrame(animate);
        }, 0);

        void audioCtx.resume().catch(() => null);
      } catch {
        // 파형 시각화 실패해도 녹음/변환은 계속 진행
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        const chunk = event.data;
        if (!chunk || chunk.size === 0) return;
        audioChunksRef.current.push(chunk);
        setAudioChunks([...audioChunksRef.current]);
      };

      recorder.onstop = () => {
        stopMicVisualizer();
        const startedAt = recordingStartAtRef.current;
        const durationMs =
          typeof startedAt === "number" ? Date.now() - startedAt : 0;

        const chunks = audioChunksRef.current;
        void audioChunks.length;
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });

        // Stop media tracks
        try {
          mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        } catch {
          // ignore
        }
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingStartAtRef.current = null;

        // Too short guard
        if (durationMs < STT_MIN_RECORDING_MS || blob.size < 1024) {
          setIsRecording(false);
          setSttError("녹음이 너무 짧습니다. 조금 더 길게 말해 주세요.");
          setSttTranscript(null);
          setSttRecordedFileInfo(null);
          setSttFileName(null);
          setSttSelectedAudioFile(null);
          setAudioChunks([]);
          audioChunksRef.current = [];
          patchConsole("stt", {
            statusLine: "—",
            statusCode: null,
            responseJson: "",
            error: "녹음이 너무 짧습니다.",
          });
          return;
        }

        const mime = blob.type || "audio/wav";
        const ext = mime.includes("webm")
          ? "webm"
          : mime.includes("ogg")
            ? "ogg"
            : mime.includes("mpeg") || mime.includes("mp3")
              ? "mp3"
              : mime.includes("mp4")
                ? "mp4"
                : "wav";
        const fileName = `recorded_audio.${ext}`;
        const file = new File([blob], fileName, {
          type: mime,
        });

        setSttFileName(file.name);
        setSttRecordedFileInfo(`${file.name} (binary from microphone)`);
        setSttSelectedAudioFile(file);
        setSttError(null);
        setAudioChunks([]);
        audioChunksRef.current = [];

        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: unknown) {
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.message.includes("Permission"));

      setIsRecording(false);
      setSttError(
        isDenied ? "마이크 접근 권한이 필요합니다." : "마이크 사용에 실패했습니다.",
      );
      setSttTranscript(null);
      setSttRecordedFileInfo(null);
      setSttFileName(null);
      setSttSelectedAudioFile(null);
      setAudioChunks([]);
      audioChunksRef.current = [];

      patchConsole("stt", {
        statusLine: "—",
        statusCode: null,
        responseJson: "",
        error: isDenied
          ? "마이크 접근 권한이 필요합니다."
          : "마이크 사용에 실패했습니다.",
      });
    }
  }

  function stopMicVisualizer() {
    if (sttMicRafRef.current) {
      window.cancelAnimationFrame(sttMicRafRef.current);
      sttMicRafRef.current = null;
    }

    analyserNodeRef.current = null;
    freqDataRef.current = null;

    setSttMicBars(
      Array.from({ length: STT_WAVE_BARS_COUNT }, () => STT_WAVE_BAR_MIN_HEIGHT_PX),
    );

    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx) {
      try {
        void ctx.suspend();
      } catch {
        // ignore
      }
      void ctx.close().catch(() => null);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    stopMicVisualizer();
    setIsRecording(false);
    try {
      recorder.stop();
    } catch {
      // ignore
    }
  }

  async function handleSttRun(fileOverride?: File | null) {
    if (isSttLoading) return;

    const file = fileOverride ?? sttSelectedAudioFile;
    if (!file) {
      setSttTranscript(null);
      setSttError("STT 변환을 위한 오디오 파일이 필요합니다.");
      patchConsole("stt", {
        statusCode: null,
        statusLine: "—",
        responseJson: "",
        error: "오디오 파일이 필요합니다.",
      });
      return;
    }

    const guessMimeFromName = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.endsWith(".wav")) return "audio/wav";
      if (lower.endsWith(".webm")) return "audio/webm";
      if (lower.endsWith(".ogg")) return "audio/ogg";
      if (lower.endsWith(".mp3")) return "audio/mpeg";
      if (lower.endsWith(".m4a")) return "audio/mp4";
      if (lower.endsWith(".mp4")) return "audio/mp4";
      return "application/octet-stream";
    };

    const normalizedFile =
      file.type && file.type.trim().length > 0
        ? file
        : new File([file], file.name, { type: guessMimeFromName(file.name) });

    setSttTranscript(null);
    setSttError(null);
    setIsSttLoading(true);
    patchConsole("stt", {
      statusCode: null,
      statusLine: "Pending...",
      responseJson: "",
      error: null,
    });

    try {
      const languageCode = sttLanguage;
      const vad_filter = sttVadOn ? "true" : "false";

      const formData = new FormData();
      formData.append("file", normalizedFile, normalizedFile.name);
      formData.append("language", languageCode);
      formData.append("task", STT_DEFAULT_TASK);
      formData.append("beam_size", String(sttBeamSize));
      formData.append("vad_filter", vad_filter);

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json().catch(() => null)) as unknown | null;

      if (!res.ok) {
        const responseJson = JSON.stringify(data ?? { error: "Request failed" }, null, 2);
        setSttError("STT 요청이 실패했습니다.");
        patchConsole("stt", {
          statusCode: res.status,
          statusLine: `${res.status} ${res.statusText || "Error"}`.trim(),
          responseJson,
          error: "STT 요청 실패",
        });
        return;
      }

      const recognizedText =
        typeof (data as { text?: unknown } | null)?.text === "string"
          ? ((data as { text?: unknown }).text as string).trim()
          : null;

      setSttTranscript(recognizedText ?? "");

      patchConsole("stt", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || "OK"}`.trim(),
        responseJson: JSON.stringify(data ?? {}, null, 2),
        error: null,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "STT 서버 연결 실패";
      setSttTranscript(null);
      setSttError("서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      patchConsole("stt", {
        statusCode: 500,
        statusLine: "—",
        responseJson: JSON.stringify({ error: message }, null, 2),
        error: message,
      });
    } finally {
      setIsSttLoading(false);
    }
  }

  function handleSttFileChange(file: File | null) {
    setSttFileName(file ? file.name : null);
    setSttSelectedAudioFile(file);
    setSttTranscript(null);
    setIsRecording(false);
    setSttRecordedFileInfo(
      file ? `${file.name} (binary from upload)` : null,
    );
    setSttError(null);
    setAudioChunks([]);
    audioChunksRef.current = [];
  }

  function handleSttUploadClear() {
    if (isRecording) stopRecording();

    setSttFileName(null);
    setSttSelectedAudioFile(null);
    setSttRecordedFileInfo(null);
    setSttTranscript(null);
    setSttError(null);
    setAudioChunks([]);
    audioChunksRef.current = [];

    if (sttFileInputRef.current) {
      sttFileInputRef.current.value = "";
    }

    patchConsole("stt", {
      statusLine: "—",
      statusCode: null,
      responseJson: "",
      error: null,
    });
  }

  function handleSttMicToggle() {
    if (isRecording) stopRecording();
    else startRecording();
    setSttTranscript(null);
  }

  function handleSttRunFromInput() {
    void handleSttRun();
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
        {
          model: "openai/gpt-oss-120b",
          input: trimmed,
          temperature: llmTemperature,
        },
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
        body: JSON.stringify({ input: trimmed, temperature: llmTemperature }),
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

      if (targetApi === "embedding") {
        const body = parsed as { input?: unknown; input_type?: unknown };
        const input =
          typeof body.input === "string" ? body.input.trim() : "";
        const inputType =
          typeof body.input_type === "string" ? body.input_type : "string";

        if (!input) {
          setEmbeddingError("`input` 문자열을 확인해주세요.");
          setEmbeddingVector(null);
          patchConsole("embedding", {
            error: "`input` 문자열을 확인해주세요.",
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

        setEmbeddingError(null);
        setEmbeddingVector(null);

        const res = await fetch("/api/embedding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input, input_type: inputType }),
        });

        const responseJson = (await res.json().catch(() => null)) as
          | { embeddingVector?: unknown }
          | null;
        patchConsole("embedding", {
          statusCode: res.status,
          statusLine: `${res.status} ${
            res.statusText || (res.ok ? "OK" : "Error")
          }`,
          responseJson: JSON.stringify(responseJson ?? {}, null, 2),
        });
        consoleAlreadySet = true;

        if (!res.ok) {
          throw new Error("EMBEDDING_API_ERROR");
        }

        const vec = responseJson?.embeddingVector;
        if (Array.isArray(vec)) {
          const normalized = (vec as unknown[])
            .map((v) => (typeof v === "number" ? v : Number(v)))
            .filter((v): v is number => Number.isFinite(v));
          setEmbeddingVector(normalized);
          setEmbeddingDisplayNonce((n) => n + 1);
        }

        return;
      }

      if (targetApi === "tts") {
        const body = parsed as {
          text?: unknown;
          language?: unknown;
          speaker?: unknown;
          style_instruction?: unknown;
          voice?: unknown;
          format?: unknown;
        };
        const text =
          typeof body.text === "string" ? body.text.trim() : "";
        const language =
          typeof body.language === "string" && isTtsLanguage(body.language)
            ? body.language
            : ttsLanguage;
        const speaker =
          typeof body.speaker === "string" && isTtsSpeaker(body.speaker)
            ? body.speaker
            : ttsSpeaker;
        let styleInstruction = ttsStyleInstruction;
        if ("style_instruction" in body) {
          if (typeof body.style_instruction === "string") {
            styleInstruction = body.style_instruction;
          } else if (body.style_instruction === null) {
            styleInstruction = "";
          }
        }
        if (!text) {
          patchConsole("tts", {
            error: "`text` 문자열을 입력해주세요.",
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
        setTtsText(text);
        setTtsLanguage(language);
        setTtsSpeaker(speaker);
        setTtsStyleInstruction(styleInstruction);
        runTtsMockSynthesis(text, language, speaker, styleInstruction);
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
        temperature?: unknown;
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

      const parsedTemperature =
        typeof body.temperature === "number" && Number.isFinite(body.temperature)
          ? body.temperature
          : typeof body.temperature === "string" &&
              body.temperature.trim() &&
              Number.isFinite(Number(body.temperature))
            ? Number(body.temperature)
            : llmTemperature;
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
        body: JSON.stringify({ input, temperature: parsedTemperature }),
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
      if (targetApi === "embedding") {
        setEmbeddingError(
          "Embedding API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
        setEmbeddingVector(null);
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
                            {item.task === "TTS"
                              ? "Qwen3 Generation • TTS"
                              : item.task === "STT"
                                ? "Qwen3 Audio • STT"
                                : `Model Size ${item.modelSizeB}B • ${item.task}`}
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

                      <div
                        className={[
                          "mt-4 flex items-center",
                          item.task === "TTS" || item.task === "STT"
                            ? "justify-start gap-2"
                            : "justify-between",
                        ].join(" ")}
                      >
                        {item.task === "TTS" || item.task === "STT" ? null : (
                          <span className="rounded-lg border border-white/10 bg-background/30 px-2.5 py-1 text-[11px] font-mono text-foreground/70">
                            Size: {item.modelSizeB}B
                          </span>
                        )}
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
                    {selectedApi === "llm" ||
                    selectedApi === "reranker" ||
                    selectedApi === "embedding" ||
                    selectedApi === "tts" ||
                    selectedApi === "stt" ? (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-[11px] font-mono text-[#10b981]">
                          {selectedApi === "llm"
                            ? "High-Performance Infra • GPT-OSS-120B • 실시간"
                            : selectedApi === "reranker"
                              ? "High-Performance Infra • Qwen3-Reranker-8B • 실시간"
                              : selectedApi === "embedding"
                                ? "24G VRAM Workstation • Qwen-Embedding-8B • 실시간"
                                : selectedApi === "tts"
                                  ? "High-Performance Infra • Qwen3-TTS • 실시간"
                                  : "High-Performance Infra • Qwen3-STT • 실시간"}
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
                    <ApiOutputPanel
                      selectedApi={selectedApi}
                      messages={messages}
                      endRef={endRef}
                      formatTime={formatTime}
                      liveNowText={formatTime(Date.now())}
                      embeddingVector={embeddingVector}
                      embeddingError={embeddingError}
                      isEmbeddingLoading={isEmbeddingLoading}
                      embeddingAnimationKey={String(embeddingDisplayNonce)}
                      rerankQuestion={rerankQuestion}
                      rerankDocsText={rerankDocsText}
                      setRerankQuestion={setRerankQuestion}
                      setRerankDocsText={setRerankDocsText}
                      handleRerankRun={handleRerankRun}
                      isRerankLoading={isRerankLoading}
                      rerankResults={rerankResults}
                      rerankError={rerankError}
                      displayedQuery={displayedQuery}
                      handleTtsPlayPause={handleTtsPlayPause}
                      ttsPlaying={ttsPlaying}
                      ttsDurationMs={ttsDurationMs}
                      ttsProgress={ttsProgress}
                      ttsWave={ttsWave}
                      ttsAudioRef={ttsAudioRef}
                      ttsAudioUrl={audioUrl}
                      ttsIsSynthesizing={isSynthesizing}
                      ttsMockResponse={mockResponse}
                      IconPlay={IconPlay}
                      IconPause={IconPause}
                      sttTranscript={sttTranscript}
                      isSttLoading={isSttLoading}
                      sttError={sttError}
                      sttFileName={sttFileName}
                      isRecording={isRecording}
                    />
                    
                  </div>

                  {/* Input */}
                  <ApiInputPanel
                    selectedApi={selectedApi}
                    onSend={onSend as React.FormEventHandler<HTMLFormElement>}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    placeholder={placeholder}
                    isChatLoading={isChatLoading}
                    llmTemperature={llmTemperature}
                    setLlmTemperature={setLlmTemperature}
                    handleEmbeddingRun={handleEmbeddingRun}
                    embeddingText={embeddingText}
                    setEmbeddingText={setEmbeddingText}
                    isEmbeddingLoading={isEmbeddingLoading}
                    handleTtsRun={handleTtsRun}
                    ttsText={ttsText}
                    setTtsText={setTtsText}
                    ttsLanguage={ttsLanguage}
                    setTtsLanguage={
                      setTtsLanguage as React.Dispatch<React.SetStateAction<string>>
                    }
                    ttsLanguageOptions={TTS_LANGUAGE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    ttsSpeaker={ttsSpeaker}
                    setTtsSpeaker={
                      setTtsSpeaker as React.Dispatch<React.SetStateAction<string>>
                    }
                    ttsSpeakerOptions={TTS_SPEAKER_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    ttsStyleInstruction={ttsStyleInstruction}
                    setTtsStyleInstruction={setTtsStyleInstruction}
                    isTtsSynthesizing={isSynthesizing}
                    sttFileInputRef={sttFileInputRef}
                    sttFileName={sttFileName}
                    sttUploadClearMounted={sttUploadClearMounted}
                    onSttFileChange={handleSttFileChange}
                    onSttUploadClear={handleSttUploadClear}
                    isRecording={isRecording}
                    onSttMicToggle={handleSttMicToggle}
                    sttLangDropdownRootRef={sttLangDropdownRootRef}
                    sttLangInputRef={sttLangInputRef}
                    sttLangDropdownOpen={sttLangDropdownOpen}
                    setSttLangDropdownOpen={setSttLangDropdownOpen}
                    sttLangQuery={sttLangQuery}
                    setSttLangQuery={setSttLangQuery}
                    sttLangOptions={sttLangOptions}
                    sttLanguage={sttLanguage}
                    setSttLanguage={
                      setSttLanguage as React.Dispatch<
                        React.SetStateAction<string>
                      >
                    }
                    getSttLanguageLabel={
                      getSttLanguageLabel as (code: string) => string
                    }
                    sttTooltipPinned={sttTooltipPinned}
                    setSttTooltipPinned={setSttTooltipPinned}
                    sttTooltipHoverId={sttTooltipHoverId}
                    setSttTooltipHoverId={setSttTooltipHoverId}
                    SttHelpTooltip={SttHelpTooltip}
                    sttVadOn={sttVadOn}
                    setSttVadOn={setSttVadOn}
                    STT_DEFAULT_BEAM_SIZE={STT_DEFAULT_BEAM_SIZE}
                    sttBeamSize={sttBeamSize}
                    setSttBeamSize={setSttBeamSize}
                    STT_WAVE_BAR_MIN_HEIGHT_PX={STT_WAVE_BAR_MIN_HEIGHT_PX}
                    STT_WAVE_BAR_MAX_HEIGHT_PX={STT_WAVE_BAR_MAX_HEIGHT_PX}
                    sttMicBars={sttMicBars}
                    isSttLoading={isSttLoading}
                    onSttRun={handleSttRunFromInput}
                    IconUpload={IconUpload}
                    IconMic={IconMic}
                  />
                  
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
                          {selectedApi === "embedding"
                            ? "/api/embedding"
                            : selectedApi === "reranker"
                              ? "/api/rerank"
                              : selectedApi === "stt"
                                ? "/api/stt"
                                : selectedApi === "tts"
                                  ? "Mock TTS (client)"
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
                          handleConsoleRequestJsonChange(e.target.value);
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

                    {selectedApi === "llm" ? (
                      <DeveloperCodeSection
                        devCodeOpen={devCodeOpen}
                        setDevCodeOpen={setDevCodeOpen}
                        devCodeCopied={devCodeCopied}
                        setDevCodeCopied={setDevCodeCopied}
                        llmDevCodePython={llmDevCodePython}
                      />
                    ) : selectedApi === "embedding" ? (
                      <EmbeddingDeveloperCodeSection
                        devCodeOpen={embeddingDevCodeOpen}
                        setDevCodeOpen={setEmbeddingDevCodeOpen}
                        devCodeCopied={embeddingDevCodeCopied}
                        setDevCodeCopied={setEmbeddingDevCodeCopied}
                        embeddingDevCodePython={embeddingDevCodePython}
                      />
                    ) : selectedApi === "reranker" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={rerankerDevCodeOpen}
                        setDevCodeOpen={setRerankerDevCodeOpen}
                        devCodeCopied={rerankerDevCodeCopied}
                        setDevCodeCopied={setRerankerDevCodeCopied}
                        codePython={rerankerDevCodePython}
                        footer={
                          <>
                            51087 Reranker 엔드포인트 예시입니다. 데모 앱은{" "}
                            <span className="text-foreground/80">/api/rerank</span>{" "}
                            프록시를 통해 호출합니다.
                          </>
                        }
                      />
                    ) : selectedApi === "tts" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={ttsDevCodeOpen}
                        setDevCodeOpen={setTtsDevCodeOpen}
                        devCodeCopied={ttsDevCodeCopied}
                        setDevCodeCopied={setTtsDevCodeCopied}
                        codePython={ttsDevCodePython}
                        footer={
                          <>
                            Playground는 클라이언트에서 파형을 시뮬레이션합니다. 위
                            코드는 Text API와 동일 호스트(51089) 기준 OpenAI 호환
                            음성 합성 예시입니다.
                          </>
                        }
                      />
                    ) : selectedApi === "stt" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={sttDevCodeOpen}
                        setDevCodeOpen={setSttDevCodeOpen}
                        devCodeCopied={sttDevCodeCopied}
                        setDevCodeCopied={setSttDevCodeCopied}
                        codePython={sttDevCodePython}
                        footer={
                          <>
                            multipart STT 예시입니다. 데모 앱은{" "}
                            <span className="text-foreground/80">/api/stt</span>{" "}
                            프록시를 통해 동일 스펙으로 전달합니다.
                          </>
                        }
                      />
                    ) : null}

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

            {workflowBannerMounted &&
            (selectedApi === "llm" ||
              selectedApi === "reranker" ||
              selectedApi === "embedding" ||
              selectedApi === "tts" ||
              selectedApi === "stt") ? (
              <section className="w-full lg:basis-full">
                <div className="rounded-xl border-t border-[#10b981]/20 bg-[#10b981]/5 px-4 py-3">
                  <div
                    className={[
                      "transition-opacity duration-200",
                      workflowBannerVisible ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  >
                    {selectedApi === "stt" ? (
                      <p className="text-sm leading-relaxed text-foreground/90">
                        <span className="mr-2">🎙️</span>
                        인식된 목소리를 텍스트로 완성! 이제 추출된 내용을{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("llm")}
                          className="font-semibold text-[#10b981] underline decoration-[#10b981]/60 underline-offset-2 transition-colors hover:text-[#34d399]"
                        >
                          [LLM]
                        </button>{" "}
                        으로 요약하거나{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("embedding")}
                          className="font-semibold text-[#10b981] underline decoration-[#10b981]/60 underline-offset-2 transition-colors hover:text-[#34d399]"
                        >
                          [Embedding]
                        </button>
                        으로 사내 지식 베이스에 저장해보세요.
                      </p>
                    ) : (
                      <SmartSolutionGuide
                        selectedApi={selectedApi}
                        onNavigateApi={moveToApiDetail}
                      />
                    )}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
