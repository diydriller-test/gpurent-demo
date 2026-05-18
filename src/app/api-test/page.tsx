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
import { useRouter } from "next/navigation";
import { getApis, getMe, type Api, type User } from "@/lib/api";
import { getToken } from "@/lib/token";
import { JsonCode } from "./components/JsonCode";
import { DeveloperCodeSection } from "./components/DeveloperCodeSection";
import { EmbeddingDeveloperCodeSection } from "./components/EmbeddingDeveloperCodeSection";
import { PlaygroundDeveloperCodeSection } from "./components/PlaygroundDeveloperCodeSection";
import { ApiOutputPanel } from "./components/ApiOutputPanel";
import { ApiInputPanel } from "./components/ApiInputPanel";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { buildLlmDevCodePython } from "./lib/buildLlmDevCodePython";
import { buildEmbeddingDevCodePython } from "./lib/buildEmbeddingDevCodePython";
import { buildRerankDevCodePython } from "./lib/buildRerankDevCodePython";
import { buildTtsDevCodePython } from "./lib/buildTtsDevCodePython";
import { buildSttDevCodePython } from "./lib/buildSttDevCodePython";
import { buildVoiceCloneDevCodePython } from "./lib/buildVoiceCloneDevCodePython";
import { buildImage2TextDevCodePython } from "./lib/buildImage2TextDevCodePython";
import { useResultTriggeredBanner } from "./hooks/useResultTriggeredBanner";
import {
  chapterQueryToPlanTask,
  getApiTask,
  getPlanCardDisplay,
  getPlanTaskDisplayName,
  rpsToRequestsPerMinute,
  type PlanTask,
} from "@/app/plans/planCatalog";

const REAL_ENDPOINTS = {
  llm: "http://aiapi.kogrobo.com:11115/v1",
  embedding: "http://aiapi.kogrobo.com:11115/_inference/text_embedding/qwen3",
  reranker: "http://aiapi.kogrobo.com:11115/_inference/rerank/qwen3",
  tts: "http://aiapi.kogrobo.com:11115/v1/audio/speech",
  stt: "http://aiapi.kogrobo.com:11115/_inference/stt/my_stt",
  voiceClone: "http://aiapi.kogrobo.com:11115/voiceclone/_inference/tts/my_inference",
  image2text: "http://aiapi.kogrobo.com:11115/api/image2text",
} as const;

const DUMMY_ENDPOINTS = {
  llm: "https://api.kogrobo.com/v1",
  embedding: "https://api.kogrobo.com/_inference/text_embedding/qwen3",
  reranker: "https://api.kogrobo.com/_inference/rerank/qwen3",
  tts: "https://api.kogrobo.com/v1/audio/speech",
  stt: "https://api.kogrobo.com/_inference/stt/my_stt",
  voiceClone: "https://api.kogrobo.com/voiceclone/_inference/tts/my_inference",
  image2text: "https://api.kogrobo.com/api/image2text",
} as const;

type ApiId =
  | "llm"
  | "embedding"
  | "reranker"
  | "tts"
  | "stt"
  | "voiceClone"
  | "image2text"
  | "t2m"
  | "t2i";

/** API `task` → 체험 Playground `selectedApi` (정적 카드 없이 API만으로 연결) */
const PLAN_TASK_TO_PLAYGROUND_API: Partial<Record<PlanTask, ApiId>> = {
  "Text Generation": "llm",
  Embedding: "embedding",
  Reranker: "reranker",
  TTS: "tts",
  STT: "stt",
  "Voice Clone": "voiceClone",
  Vision: "image2text",
  "Text-to-Music": "t2m",
  "Image Generation": "t2i",
};

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
  "안녕하세요. AI API 오마카세 데모를 재생합니다.";
const TTS_LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "chinese", label: "Chinese" },
  { value: "english", label: "English" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "portuguese", label: "Portuguese" },
  { value: "russian", label: "Russian" },
  { value: "spanish", label: "Spanish" },
] as const;
type TtsLanguage = (typeof TTS_LANGUAGE_OPTIONS)[number]["value"];
const DEFAULT_TTS_LANGUAGE: TtsLanguage = "auto";

const TTS_SPEAKER_OPTIONS = [
  { value: "aiden", label: "Aiden" },
  { value: "dylan", label: "Dylan" },
  { value: "eric", label: "Eric" },
  { value: "ono_anna", label: "Ono_anna" },
  { value: "ryan", label: "Ryan" },
  { value: "serena", label: "Serena" },
  { value: "sohee", label: "Sohee" },
  { value: "uncle_fu", label: "Uncle_fu" },
  { value: "vivian", label: "Vivian" },
] as const;
type TtsSpeaker = (typeof TTS_SPEAKER_OPTIONS)[number]["value"];
const DEFAULT_TTS_SPEAKER: TtsSpeaker = "ryan";

const VOICE_CLONE_LANGUAGE_OPTIONS = [
  { value: "Korean", label: "한국어" },
  { value: "English", label: "English" },
  { value: "Chinese", label: "中文" },
  { value: "Japanese", label: "日本語" },
  { value: "French", label: "Français" },
  { value: "German", label: "Deutsch" },
  { value: "Spanish", label: "Español" },
  { value: "Italian", label: "Italiano" },
  { value: "Portuguese", label: "Português" },
  { value: "Russian", label: "Русский" },
] as const;
const DEFAULT_VC_LANGUAGE = "Korean";
const DEFAULT_VC_TEXT = "안녕하세요. 저는 보이스 클론 테스트 중입니다.";

const DEFAULT_RERANK_QUERY = "사람 없고 한적한 곳에서 힐링하고 싶어";
const DEFAULT_RERANK_DOCS_TEXT =
  "- 사람들이 가장 많이 찾는 서울 핫플레이스 TOP 10\n- 여름 휴가철 인파로 북적이는 해운대 해수욕장 현황\n- 숲소리만 들리는 깊은 산속 프라이빗 독채 펜션\n- 친구들과 시끌벅적하게 즐기는 강남역 맛집 탐방";

function CopyIcon({ className }: { className?: string }) {
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
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

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

function IconPlus(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

function IconX(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
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

function IconArrowLeft(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
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
          "bg-popover border-primary/30 shadow-[0_0_40px_rgba(232, 136, 138,0.10)]",
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

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Text Playground ↔ Developer Console 동기화용 LLM Request JSON */
function buildLlmConsoleRequestJson(
  promptValue: string,
  systemPromptValue: string,
  temperature: number,
) {
  return JSON.stringify(
    {
      model: "Qwen/Qwen3.6-35B-A3B",
      temperature,
      ...(systemPromptValue.trim()
        ? {
            messages: [
              { role: "system", content: systemPromptValue },
              { role: "user", content: promptValue },
            ],
          }
        : { messages: [{ role: "user", content: promptValue }] }),
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
  systemPrompt?: string;
  temperature?: number;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      temperature?: unknown;
      messages?: unknown;
      input?: unknown;
      systemPrompt?: unknown;
    };
    const out: {
      prompt?: string;
      systemPrompt?: string;
      temperature?: number;
    } = {};

    if (
      typeof parsed.temperature === "number" &&
      Number.isFinite(parsed.temperature)
    ) {
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
    let systemContent: string | undefined;
    if (Array.isArray(parsed.messages)) {
      const s = [...parsed.messages]
        .reverse()
        .find(
          (m) =>
            m &&
            typeof m === "object" &&
            (m as { role?: string }).role === "system" &&
            typeof (m as { content?: unknown }).content === "string",
        ) as { content?: string } | undefined;
      const u = [...parsed.messages]
        .reverse()
        .find(
          (m) =>
            m &&
            typeof m === "object" &&
            (m as { role?: string }).role === "user" &&
            typeof (m as { content?: unknown }).content === "string",
        ) as { content?: string } | undefined;
      systemContent = s?.content;
      msgContent = u?.content;
    }
    const directSystemPrompt =
      typeof parsed.systemPrompt === "string" ? parsed.systemPrompt : undefined;
    if (typeof systemContent === "string") {
      out.systemPrompt = systemContent;
    } else if (typeof directSystemPrompt === "string") {
      out.systemPrompt = directSystemPrompt;
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
function buildRerankConsoleRequestJson(
  query: string,
  docsText: string,
): string {
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

    if (
      typeof parsed.language === "string" &&
      isSttLanguageCode(parsed.language)
    ) {
      out.language = parsed.language;
    }

    if (typeof parsed.vad_filter === "boolean") {
      out.vadOn = parsed.vad_filter;
    }

    if (
      typeof parsed.beam_size === "number" &&
      Number.isFinite(parsed.beam_size)
    ) {
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

function buildVoiceCloneConsoleRequestJson(
  text: string,
  language: string,
  xVectorOnly: boolean,
  refText: string,
  refFileName: string | null,
) {
  const payload: Record<string, unknown> = {
    text,
    language,
    x_vector_only_mode: xVectorOnly,
    ref_audio: refFileName ? `(binary file: ${refFileName})` : "(binary file)",
  };
  if (!xVectorOnly && refText.trim()) {
    payload.ref_text = refText.trim();
  }
  return JSON.stringify(payload, null, 2);
}

const DEFAULT_IMAGE2TEXT_PROMPT =
  "이 이미지 내용을 한국어로 설명하고, 이미지 안의 글자를 줄바꿈 유지해서 그대로 추출해줘.";

function buildImage2TextConsoleRequestJson(
  prompt: string,
  fileName: string | null,
) {
  return JSON.stringify(
    {
      image: fileName ? `(binary file: ${fileName})` : "(binary file)",
      prompt: prompt.trim() || DEFAULT_IMAGE2TEXT_PROMPT,
    },
    null,
    2,
  );
}

function tryParseVoiceCloneConsoleToPlayground(jsonText: string): {
  text?: string;
  language?: string;
  xVectorOnly?: boolean;
  refText?: string;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      text?: unknown;
      language?: unknown;
      x_vector_only_mode?: unknown;
      ref_text?: unknown;
    };
    const out: {
      text?: string;
      language?: string;
      xVectorOnly?: boolean;
      refText?: string;
    } = {};
    if (typeof parsed.text === "string") out.text = parsed.text;
    if (typeof parsed.language === "string") out.language = parsed.language;
    if (typeof parsed.x_vector_only_mode === "boolean")
      out.xVectorOnly = parsed.x_vector_only_mode;
    if (typeof parsed.ref_text === "string") out.refText = parsed.ref_text;
    return out;
  } catch {
    return null;
  }
}

export default function ApiTestPage() {
  const router = useRouter();
  type ViewMode = "list" | "detail";
  const apis: ApiItem[] = useMemo(
    () => [
      {
        id: "llm",
        name: "LLM",
        description: "프롬프트 기반 텍스트 생성",
      },
      {
        id: "embedding",
        name: "Embedding",
        description: "문장을 벡터로 변환",
      },
      {
        id: "reranker",
        name: "Reranking",
        description: "검색 결과 재정렬로 정확도 향상",
      },
      {
        id: "tts",
        name: "TTS",
        description: "텍스트를 음성으로 변환",
      },
      {
        id: "stt",
        name: "STT",
        description: "음성을 텍스트로 변환",
      },
      {
        id: "voiceClone",
        name: "Voice Clone",
        description: "참조 음성으로 목소리를 클론하여 TTS",
      },
      {
        id: "image2text",
        name: "Image-to-Text",
        description: "이미지 분석 및 텍스트 추출 (OCR)",
      },
      {
        id: "t2m",
        name: "Text-to-Music",
        description: "텍스트 프롬프트로 음악 생성",
      },
      {
        id: "t2i",
        name: "Image Generation",
        description: "텍스트 프롬프트로 이미지 생성",
      },
    ],
    [],
  );

  const [selectedApi, setSelectedApi] = useState<ApiId>("llm");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [prompt, setPrompt] = useState("");
  const [llmSystemPrompt, setLlmSystemPrompt] = useState("");
  const [llmTemperature, setLlmTemperature] = useState<number>(0.1);
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(
    null,
  );
  const [limitExceededModalOpen, setLimitExceededModalOpen] = useState(false);
  const [t2iComingSoonOpen, setT2iComingSoonOpen] = useState(false);
  const comingSoonTimerRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const api = params.get("api");
    const view = params.get("view");

    if (api === "t2i") {
      setT2iComingSoonOpen(true);
      return;
    }

    if (
      api === "llm" ||
      api === "embedding" ||
      api === "reranker" ||
      api === "tts" ||
      api === "stt" ||
      api === "voiceClone" ||
      api === "image2text" ||
      api === "t2m"
    ) {
      setSelectedApi(api);
      // 홈 카드에서 들어올 때는 바로 해당 챕터 상세를 보여줌
      setViewMode(view === "list" ? "list" : "detail");
    }
  }, []);

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
        return buildLlmConsoleRequestJson("", "", llmTemperature);
      }
      if (api === "reranker") {
        return buildRerankConsoleRequestJson(
          DEFAULT_RERANK_QUERY,
          DEFAULT_RERANK_DOCS_TEXT,
        );
      }
      if (api === "embedding") {
        return buildEmbeddingConsoleRequestJson(
          DEFAULT_EMBEDDING_PLAYGROUND_TEXT,
        );
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
      if (api === "voiceClone") {
        return buildVoiceCloneConsoleRequestJson(
          DEFAULT_VC_TEXT,
          DEFAULT_VC_LANGUAGE,
          true,
          "",
          null,
        );
      }
      if (api === "image2text") {
        return buildImage2TextConsoleRequestJson(DEFAULT_IMAGE2TEXT_PROMPT, null);
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
      voiceClone: createDefaultConsoleState("voiceClone"),
      image2text: createDefaultConsoleState("image2text"),
      t2m: createDefaultConsoleState("t2m"),
      t2i: createDefaultConsoleState("t2i"),
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
    | "Voice Clone"
    | "Vision"
    | "Text-to-Music"
    | "Image Generation"
    | "Other";
  type LibraryFormat = "Transformers" | "GGUF" | "vLLM" | "ONNX";

  type MarketplaceItem = {
    id: string;
    task: MarketplaceTask;
    /** `/apis` 응답의 항목과 1:1 매칭할 때 사용 (플랜·정렬·표시) */
    backendApiId?: number;
    apiId?: ApiId;
    model: string;
    modelDisplay?: string;
    description?: string;
    modelSizeB: number;
    taskTags: string[]; // e.g. ["LLM", "Text-Gen"]
    formats: LibraryFormat[]; // filterable formats
  };

  const backendApiToMarketplaceItem = useCallback((api: Api): MarketplaceItem => {
    const task = getApiTask(api);
    const card = getPlanCardDisplay(api);
    const resolvedTask: MarketplaceTask = task
      ? (task as MarketplaceTask)
      : "Other";

    const playgroundApiId =
      resolvedTask === "Other"
        ? undefined
        : PLAN_TASK_TO_PLAYGROUND_API[task as PlanTask];

    return {
      id: `backend-api-${api.id}`,
      backendApiId: api.id,
      task: resolvedTask,
      apiId: playgroundApiId,
      model:
        (task ? getPlanTaskDisplayName(task) : null) ||
        (api.model_display && api.model_display.trim()) ||
        api.name ||
        card.modelDisplay,
      modelDisplay: card.modelDisplay,
      description: api.card_sublabel || card.sublabel,
      modelSizeB: 0,
      taskTags:
        task ? card.tags : (api.tags && api.tags.length > 0 ? api.tags : card.tags),
      formats: ["Transformers"] as LibraryFormat[],
    };
  }, []);

  const [filterTasks, setFilterTasks] = useState<
    Record<MarketplaceTask, boolean>
  >({
    "Text Generation": true,
    Embedding: true,
    Reranker: true,
    TTS: true,
    STT: true,
    "Voice Clone": true,
    Vision: true,
    "Text-to-Music": true,
    "Image Generation": true,
    Other: true,
  });
  const [sidebarMode, setSidebarMode] = useState<"all" | "my">("all");
  /** 목록 → 상세 진입 직전의 Tasks 필터(복귀 시 복원). 상세 내 API 전환(moveToApiDetail)에서는 갱신하지 않음 */
  const listViewFilterSnapshotRef = useRef<{
    filterTasks: Record<MarketplaceTask, boolean>;
    sidebarMode: "all" | "my";
  } | null>(null);
  const [apisFromBackend, setApisFromBackend] = useState<Api[]>([]);
  const [userMe, setUserMe] = useState<User | null>(null);

  // 각 API별 구독 여부: 해당 API에 플랜이 있는 경우에만 실 URL 노출
  const subscribedApis = useMemo(() => {
    const result: Partial<Record<keyof typeof REAL_ENDPOINTS, boolean>> = {};
    if (!userMe?.api_plans?.length) return result;
    const chapters = ["llm", "embedding", "reranker", "tts", "stt", "voiceClone", "image2text"] as const;
    for (const chapter of chapters) {
      const task = chapterQueryToPlanTask(chapter);
      if (!task) continue;
      const backendApi = apisFromBackend.find((a) => getApiTask(a) === task);
      if (backendApi) {
        result[chapter] = userMe.api_plans.some((p) => p.api_id === backendApi.id);
      }
    }
    return result;
  }, [userMe, apisFromBackend]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apis = await getApis();
        const sorted = [...apis].sort(
          (a, b) =>
            (a.sort_order ?? Number.MAX_SAFE_INTEGER) -
            (b.sort_order ?? Number.MAX_SAFE_INTEGER),
        );
        const hasT2m = sorted.some((a) => getApiTask(a) === "Text-to-Music");
        const withT2m: Api[] = hasT2m
          ? sorted
          : [
              ...sorted,
              {
                id: -1,
                name: "Text-to-Music API",
                slug: "t2m",
                company_id: 1,
                company_name: "코그로보",
                task_key: "Text-to-Music",
                task_label: "Text-to-Music",
                card_sublabel: "ACE-Step XL • T2M",
                model_display: "ACE-Step",
                tags: ["T2M", "Music", "Audio"],
                is_active: true,
                sort_order: 999,
              },
            ];
        const hasT2i = withT2m.some((a) => getApiTask(a) === "Image Generation");
        const withT2i: Api[] = hasT2i
          ? withT2m
          : [
              ...withT2m,
              {
                id: -2,
                name: "Image Generation API",
                slug: "t2i",
                company_id: 1,
                company_name: "코그로보",
                task_key: "Image Generation",
                task_label: "Image Generation",
                card_sublabel: "텍스트로 이미지 생성 • T2I",
                model_display: "T2I",
                tags: ["Image", "T2I"],
                is_active: true,
                sort_order: 1000,
              },
            ];
        if (!cancelled) setApisFromBackend(withT2i);
      } catch {
        if (!cancelled) setApisFromBackend([]);
      }
      if (!getToken()) {
        if (!cancelled) setUserMe(null);
        return;
      }
      try {
        const user = await getMe();
        if (!cancelled) setUserMe(user);
      } catch {
        if (!cancelled) setUserMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const taskKeys = useMemo<MarketplaceTask[]>(() => {
    const VISIBLE: MarketplaceTask[] = [
      "STT",
      "TTS",
      "Text-to-Music",
      "Image Generation",
      "Embedding",
      "Reranker",
      "Voice Clone",
      "Vision",
      "Text Generation",
    ];
    if (apisFromBackend.length === 0) return VISIBLE;
    const orderFor = (task: MarketplaceTask): number => {
      const api = apisFromBackend.find((a) => getApiTask(a) === task);
      return api?.sort_order ?? Number.MAX_SAFE_INTEGER;
    };
    return [...VISIBLE].sort((a, b) => orderFor(a) - orderFor(b));
  }, [apisFromBackend]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const taskParam = params.get("task")?.toLowerCase() ?? null;
    const viewParam = params.get("view")?.toLowerCase() ?? null;
    if (!taskParam) return;

    const targetTask: MarketplaceTask | null =
      taskParam === "llm" || taskParam === "text"
        ? "Text Generation"
        : taskParam === "embedding"
          ? "Embedding"
          : taskParam === "reranker" || taskParam === "rerank"
            ? "Reranker"
            : taskParam === "tts"
              ? "TTS"
              : taskParam === "stt" || taskParam === "sst"
                ? "STT"
                : taskParam === "voice-clone" ||
                    taskParam === "voiceclone" ||
                    taskParam === "보이스클론"
                  ? "Voice Clone"
                  : taskParam === "vision" ||
                      taskParam === "image2text" ||
                      taskParam === "ocr"
                    ? "Vision"
                    : taskParam === "t2m" ||
                        taskParam === "text-to-music" ||
                        taskParam === "texttomusic"
                      ? "Text-to-Music"
                      : taskParam === "t2i" ||
                          taskParam === "text-to-image" ||
                          taskParam === "imagegeneration" ||
                          taskParam === "image-generation"
                        ? "Image Generation"
                        : null;

    if (!targetTask) return;

    setViewMode(viewParam === "detail" ? "detail" : "list");
    setSidebarMode("all");
    setFilterTasks((prev) => {
      const next = { ...prev };
      taskKeys.forEach((k) => {
        next[k] = k === targetTask;
      });
      next.Other = false;
      return next;
    });

    if (targetTask === "Text Generation") setSelectedApi("llm");
    if (targetTask === "Embedding") setSelectedApi("embedding");
    if (targetTask === "Reranker") setSelectedApi("reranker");
    if (targetTask === "TTS") setSelectedApi("tts");
    if (targetTask === "STT") setSelectedApi("stt");
    if (targetTask === "Voice Clone") setSelectedApi("voiceClone");
    if (targetTask === "Vision") setSelectedApi("image2text");
    if (targetTask === "Text-to-Music") setSelectedApi("t2m");
    if (targetTask === "Image Generation") {
      setT2iComingSoonOpen(true);
      return;
    }
  }, [taskKeys]);

  const SESSION_SNAPSHOT_KEY = "apiTestResultSnapshot";

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_SNAPSHOT_KEY);
    if (!raw) return;
    sessionStorage.removeItem(SESSION_SNAPSHOT_KEY);
    try {
      const snap = JSON.parse(raw) as {
        messages?: ChatMessage[];
        prompt?: string;
        llmSystemPrompt?: string;
        embeddingText?: string;
        embeddingVector?: number[] | null;
        rerankQuestion?: string;
        rerankDocsText?: string;
        rerankResults?: Array<{ rank: number; doc: string; score: number }> | null;
        displayedQuery?: string;
        sttTranscript?: string | null;
        image2textResult?: string | null;
        image2textPrompt?: string;
        consoleByApi?: Record<ApiId, ConsoleState>;
      };
      if (snap.messages) setMessages(snap.messages);
      if (snap.prompt !== undefined) setPrompt(snap.prompt);
      if (snap.llmSystemPrompt !== undefined) setLlmSystemPrompt(snap.llmSystemPrompt);
      if (snap.embeddingText !== undefined) setEmbeddingText(snap.embeddingText);
      if (snap.embeddingVector !== undefined) setEmbeddingVector(snap.embeddingVector);
      if (snap.rerankQuestion !== undefined) setRerankQuestion(snap.rerankQuestion);
      if (snap.rerankDocsText !== undefined) setRerankDocsText(snap.rerankDocsText);
      if (snap.rerankResults !== undefined) setRerankResults(snap.rerankResults);
      if (snap.displayedQuery !== undefined) setDisplayedQuery(snap.displayedQuery);
      if (snap.sttTranscript !== undefined) setSttTranscript(snap.sttTranscript);
      if (snap.image2textResult !== undefined) setImage2TextResult(snap.image2textResult);
      if (snap.image2textPrompt !== undefined) setImage2TextPrompt(snap.image2textPrompt);
      if (snap.consoleByApi) setConsoleByApi(snap.consoleByApi);
    } catch {}
  }, []);

  useEffect(() => {
    function handlePopState() {
      if (viewMode !== "detail") return;
      const snap = listViewFilterSnapshotRef.current;
      if (snap) {
        setSidebarMode(snap.sidebarMode);
        setFilterTasks(snap.filterTasks);
        listViewFilterSnapshotRef.current = null;
      } else {
        setSidebarMode("all");
        setFilterTasks((prev) => {
          const next = { ...prev };
          taskKeys.forEach((k) => {
            next[k] = true;
          });
          next.Other = true;
          return next;
        });
      }
      setViewMode("list");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [viewMode, taskKeys]);

  const resolveMarketplacePlan = useCallback((item: MarketplaceItem) => {
    const api =
      item.backendApiId != null
        ? apisFromBackend.find((a) => a.id === item.backendApiId)
        : apisFromBackend.find((a) => getApiTask(a) === (item.task as PlanTask));
    if (!api) return null;
    return userMe?.api_plans?.find((p) => p.api_id === api.id) ?? null;
  }, [apisFromBackend, userMe]);

  const allTasksFilterOn = taskKeys.every((t) => filterTasks[t]);

  const filteredMarketplace = useMemo(() => {
    if (apisFromBackend.length === 0) {
      return taskKeys.reduce<MarketplaceItem[]>((items, task) => {
          const apiId = PLAN_TASK_TO_PLAYGROUND_API[task as PlanTask];
          const api = apiId ? apis.find((item) => item.id === apiId) : null;
          if (!apiId || !api) return items;
          items.push({
            id: `fallback-api-${apiId}`,
            task,
            apiId,
            model: api.name,
            description: api.description,
            modelSizeB: 0,
            taskTags: [api.name],
            formats: ["Transformers"] as LibraryFormat[],
          });
          return items;
        }, []);
    }

    const rows = apisFromBackend.map((api) =>
      backendApiToMarketplaceItem(api),
    );

    const filtered = rows.filter((item) => {
      if (sidebarMode === "my") {
        return resolveMarketplacePlan(item) != null;
      }
      if (item.task === "Other") {
        if (!allTasksFilterOn) return false;
      } else if (!filterTasks[item.task]) {
        return false;
      }
      return true;
    });

    const orderFor = (backendId: number | undefined) => {
      const api = apisFromBackend.find((a) => a.id === backendId);
      return api?.sort_order ?? Number.MAX_SAFE_INTEGER;
    };

    return [...filtered].sort(
      (a, b) => orderFor(a.backendApiId) - orderFor(b.backendApiId),
    );
  }, [
    filterTasks,
    sidebarMode,
    apis,
    apisFromBackend,
    allTasksFilterOn,
    backendApiToMarketplaceItem,
    resolveMarketplacePlan,
    taskKeys,
  ]);

  const detailApiItems = useMemo(() => {
    const byApiId = new Map(apis.map((api) => [api.id, api]));
    const orderedIds = apisFromBackend
      .map((api) => getApiTask(api))
      .map((task) => (task ? PLAN_TASK_TO_PLAYGROUND_API[task] : undefined))
      .filter((id): id is ApiId => Boolean(id));
    const seen = new Set<ApiId>();
    const ordered = orderedIds.reduce<ApiItem[]>((items, id) => {
      if (seen.has(id)) return items;
      const api = byApiId.get(id);
      if (!api) return items;
      seen.add(id);
      items.push(api);
      return items;
    }, []);

    apis.forEach((api) => {
      if (!seen.has(api.id)) ordered.push(api);
    });

    return ordered;
  }, [apis, apisFromBackend]);

  const activeTaskKey = useMemo(() => {
    if (sidebarMode === "my") return "My";
    if (allTasksFilterOn) return "All";
    const active = taskKeys.find((t) => filterTasks[t]);
    if (!active) return "All";
    if (active === "Text Generation") return "Text";
    if (active === "Embedding") return "Embedding";
    if (active === "Reranker") return "Rerank";
    if (active === "TTS") return "TTS";
    if (active === "STT") return "STT";
    if (active === "Voice Clone") return "VoiceClone";
    if (active === "Vision") return "Vision";
    if (active === "Text-to-Music") return "TextToMusic";
    if (active === "Image Generation") return "ImageGeneration";
    return "All";
  }, [filterTasks, sidebarMode, allTasksFilterOn, taskKeys]);

  function renderTaskGuide() {
    switch (activeTaskKey) {
      case "All":
        return (
          <>
            <span className="text-accent font-semibold">AI API 플레이그라운드</span>:
            API별 입력값을 구성하고 추론 결과를 실시간으로 확인합니다.
          </>
        );
      case "My":
        return (
          <>
            <span className="text-accent font-semibold">내 API</span>:
            플랜에서 구매한 API만 모아서 볼 수 있습니다. 로그인 후 구독이 있으면
            카드에 현재 플랜이 표시됩니다.
          </>
        );
      case "Text":
        return (
          <>
            <span className="text-accent font-semibold">
              비즈니스 대화 및 요약
            </span>
            : 복잡한 문서를 요약하거나 자연스러운 챗봇 답변을 생성하는{" "}
            <span className="text-accent font-semibold">
              초거대 언어 모델(LLM)
            </span>{" "}
            서비스입니다.
          </>
        );
      case "Embedding":
        return (
          <>
            <span className="text-accent font-semibold">
              지능형 데이터 검색
            </span>
            : 문장의 의미를 분석하여 대규모 문서에서 원하는 정보를 정확히
            찾아내는{" "}
            <span className="text-accent font-semibold">
              RAG(검색 증강 생성)
            </span>
            의 핵심 기술입니다.
          </>
        );
      case "Rerank":
        return (
          <>
            <span className="text-accent font-semibold">검색 결과 최적화</span>:
            단순 검색을 넘어, 사용자의 의도에 가장 가까운 순서로{" "}
            <span className="text-accent font-semibold">정확도를 극대화</span>
            하여 정렬합니다.
          </>
        );
      case "TTS":
        return (
          <>
            <span className="text-accent font-semibold">텍스트 → 음성 합성</span>:
            입력한 문장을 선택한{" "}
            <span className="text-accent font-semibold">화자·언어</span>로
            자연스럽게 읽어주는 고품질 TTS 서비스입니다.
          </>
        );
      case "STT":
        return (
          <>
            <span className="text-accent font-semibold">음성 → 텍스트 변환</span>:
            녹음 파일이나 마이크 입력을{" "}
            <span className="text-accent font-semibold">텍스트로 변환</span>하는
            Qwen3-STT 기반 서비스입니다.
          </>
        );
      case "VoiceClone":
        return (
          <>
            <span className="text-accent font-semibold">보이스 클론</span>:
            짧은 참조 음성만으로 동일한 목소리를 재현합니다.{" "}
            <span className="text-accent font-semibold">
              원하는 텍스트를 클론된 목소리로
            </span>{" "}
            합성하는 개인화 TTS 기술입니다.
          </>
        );
      case "Vision":
        return (
          <>
            <span className="text-accent font-semibold">이미지 분석 (Image2Text)</span>:
            이미지를 업로드하면{" "}
            <span className="text-accent font-semibold">
              내용 설명과 텍스트 추출
            </span>
            을 동시에 수행합니다.
          </>
        );
      case "ImageGeneration":
        return (
          <>
            <span className="text-accent font-semibold">이미지 생성 (Text-to-Image)</span>:
            텍스트 프롬프트로{" "}
            <span className="text-accent font-semibold">
              고품질 이미지를 생성
            </span>
            합니다.
          </>
        );
      default:
        return (
          <>
            <span className="text-accent font-semibold">AI API 플레이그라운드</span>:
            API별 입력값을 구성하고 추론 결과를 실시간으로 확인합니다.
          </>
        );
    }
  }

  const TASK_TO_PARAM: Partial<Record<MarketplaceTask, string>> = {
    "Text Generation": "llm",
    "Embedding": "embedding",
    "Reranker": "reranker",
    "TTS": "tts",
    "STT": "stt",
    "Voice Clone": "voice-clone",
    "Vision": "vision",
    "Text-to-Music": "t2m",
    "Image Generation": "t2i",
  };

  function enterDetailFor(item: MarketplaceItem) {
    if (item.task === "Image Generation") {
      setT2iComingSoonOpen(true);
      return;
    }

    if (item.apiId) {
      listViewFilterSnapshotRef.current = {
        filterTasks: { ...filterTasks },
        sidebarMode,
      };
      setSelectedApi(item.apiId);
      setViewMode("detail");
      window.scrollTo(0, 0);
      const taskParam = TASK_TO_PARAM[item.task as MarketplaceTask];
      const url = taskParam
        ? `/api-test?task=${taskParam}&view=detail`
        : window.location.href;
      window.history.pushState({ apiTestDetail: true }, "", url);
      return;
    }
    showComingSoon("준비 중입니다.");
  }

  // Embedding
  const [embeddingText, setEmbeddingText] = useState(
    DEFAULT_EMBEDDING_PLAYGROUND_TEXT,
  );
  const [embeddingVector, setEmbeddingVector] = useState<number[] | null>(null);
  const [isEmbeddingLoading, setIsEmbeddingLoading] = useState(false);
  const [embeddingError, setEmbeddingError] = useState<string | null>(null);
  const [, setEmbeddingDisplayNonce] = useState(0);
  const [embeddingDevCodeOpen, setEmbeddingDevCodeOpen] = useState(false);
  const [embeddingDevCodeCopied, setEmbeddingDevCodeCopied] = useState(false);

  const embeddingDevCodePython = useMemo(
    () => buildEmbeddingDevCodePython({
      inputText: embeddingText,
      url: subscribedApis.embedding ? REAL_ENDPOINTS.embedding : DUMMY_ENDPOINTS.embedding,
    }),
    [embeddingText, subscribedApis],
  );

  // Reranker
  const [rerankQuestion, setRerankQuestion] = useState(DEFAULT_RERANK_QUERY);
  const [rerankDocsText, setRerankDocsText] = useState(
    DEFAULT_RERANK_DOCS_TEXT,
  );
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
  const [ttsLanguage, setTtsLanguage] =
    useState<TtsLanguage>(DEFAULT_TTS_LANGUAGE);
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
  const [sttLanguage, setSttLanguage] =
    useState<SttLanguage>(STT_DEFAULT_LANGUAGE);
  const [sttVadOn, setSttVadOn] = useState<boolean>(STT_DEFAULT_VAD_ON);
  const [sttBeamSize, setSttBeamSize] = useState<number>(STT_DEFAULT_BEAM_SIZE);
  const [isSttLoading, setIsSttLoading] = useState(false);
  const [sttRecordedFileInfo, setSttRecordedFileInfo] = useState<string | null>(
    null,
  );
  const [sttError, setSttError] = useState<string | null>(null);

  const [sttMicBars, setSttMicBars] = useState<number[]>(() =>
    Array.from(
      { length: STT_WAVE_BARS_COUNT },
      () => STT_WAVE_BAR_MIN_HEIGHT_PX,
    ),
  );

  const [sttTooltipPinned, setSttTooltipPinned] =
    useState<SttHelpTooltipId | null>(null);
  const [sttTooltipHoverId, setSttTooltipHoverId] =
    useState<SttHelpTooltipId | null>(null);

  const [sttUploadClearMounted, setSttUploadClearMounted] = useState(false);
  const sttUploadClearTimerRef = useRef<number | null>(null);
  const sttLangDropdownRootRef = useRef<HTMLDivElement | null>(null);
  const sttLangInputRef = useRef<HTMLInputElement | null>(null);
  const [sttLangDropdownOpen, setSttLangDropdownOpen] = useState(false);
  const [sttLangQuery, setSttLangQuery] = useState<string>("");

  const sttFileInputRef = useRef<HTMLInputElement | null>(null);

  // Voice Clone
  const [vcText, setVcText] = useState(DEFAULT_VC_TEXT);
  const [vcLanguage, setVcLanguage] = useState(DEFAULT_VC_LANGUAGE);
  const [vcXVectorOnly, setVcXVectorOnly] = useState(true);
  const [vcRefText, setVcRefText] = useState("");
  const [vcRefAudioFile, setVcRefAudioFile] = useState<File | null>(null);
  const [vcRefFileName, setVcRefFileName] = useState<string | null>(null);
  const [vcAudioUrl, setVcAudioUrl] = useState<string | null>(null);
  const [vcIsLoading, setVcIsLoading] = useState(false);
  const [vcError, setVcError] = useState<string | null>(null);
  const [vcPlaying, setVcPlaying] = useState(false);
  const [vcProgress, setVcProgress] = useState(0);
  const [vcDurationMs, setVcDurationMs] = useState(0);
  const [vcWave, setVcWave] = useState<number[]>([]);
  const vcAudioRef = useRef<HTMLAudioElement | null>(null);
  const vcBlobUrlRef = useRef<string | null>(null);
  const vcRefAudioFileInputRef = useRef<HTMLInputElement | null>(null);
  const [vcDevCodeOpen, setVcDevCodeOpen] = useState(false);
  const [vcDevCodeCopied, setVcDevCodeCopied] = useState(false);

  // Image2Text
  const [image2textImageFile, setImage2TextImageFile] = useState<File | null>(null);
  const [image2textFileName, setImage2TextFileName] = useState<string | null>(null);
  const [image2textImagePreview, setImage2TextImagePreview] = useState<string | null>(null);
  const [image2textPrompt, setImage2TextPrompt] = useState(DEFAULT_IMAGE2TEXT_PROMPT);
  const [image2textResult, setImage2TextResult] = useState<string | null>(null);
  const [image2textIsLoading, setImage2TextIsLoading] = useState(false);
  const [image2textError, setImage2TextError] = useState<string | null>(null);
  const image2textFileInputRef = useRef<HTMLInputElement | null>(null);
  const [image2textDevCodeOpen, setImage2TextDevCodeOpen] = useState(false);
  const [image2textDevCodeCopied, setImage2TextDevCodeCopied] = useState(false);

  // Text-to-Music
  const [t2mPrompt, setT2mPrompt] = useState("Upbeat jazz with piano and saxophone, 120bpm, warm and lively");
  const [t2mLyrics, setT2mLyrics] = useState("");
  const [t2mDuration, setT2mDuration] = useState(10);
  const [t2mSeed, setT2mSeed] = useState("");
  const [t2mAudioUrl, setT2mAudioUrl] = useState<string | null>(null);
  const [t2mIsLoading, setT2mIsLoading] = useState(false);
  const [t2mError, setT2mError] = useState<string | null>(null);
  const [t2mPlaying, setT2mPlaying] = useState(false);
  const [t2mProgress, setT2mProgress] = useState(0);
  const [t2mDurationMs, setT2mDurationMs] = useState(0);
  const [t2mWave, setT2mWave] = useState<number[]>([]);
  const t2mAudioRef = useRef<HTMLAudioElement | null>(null);
  const t2mBlobUrlRef = useRef<string | null>(null);

  // Text-to-Image
  const [t2iPrompt, setT2iPrompt] = useState("A serene mountain landscape at sunset, photorealistic, 8k");
  const [t2iNegativePrompt, setT2iNegativePrompt] = useState("");
  const [t2iWidth, setT2iWidth] = useState(1024);
  const [t2iHeight, setT2iHeight] = useState(1024);
  const [t2iSteps, setT2iSteps] = useState(50);
  const [t2iSeed, setT2iSeed] = useState("");
  const [t2iImageUrl, setT2iImageUrl] = useState<string | null>(null);
  const [t2iIsLoading, setT2iIsLoading] = useState(false);
  const [t2iError, setT2iError] = useState<string | null>(null);
  const t2iBlobUrlRef = useRef<string | null>(null);

  // Latency measurement (ms, null = not yet tested)
  const [llmLatencyMs, setLlmLatencyMs] = useState<number | null>(null);
  const [embeddingLatencyMs, setEmbeddingLatencyMs] = useState<number | null>(null);
  const [rerankLatencyMs, setRerankLatencyMs] = useState<number | null>(null);
  const [ttsLatencyMs, setTtsLatencyMs] = useState<number | null>(null);
  const [sttLatencyMs, setSttLatencyMs] = useState<number | null>(null);
  const [vcLatencyMs, setVcLatencyMs] = useState<number | null>(null);
  const [image2textLatencyMs, setImage2TextLatencyMs] = useState<number | null>(null);
  const [t2mLatencyMs, setT2mLatencyMs] = useState<number | null>(null);
  const [t2iLatencyMs, setT2iLatencyMs] = useState<number | null>(null);

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
        url: subscribedApis.reranker ? REAL_ENDPOINTS.reranker : DUMMY_ENDPOINTS.reranker,
      }),
    [rerankQuestion, rerankDocsText, subscribedApis],
  );

  const ttsDevCodePython = useMemo(
    () =>
      buildTtsDevCodePython({
        text: ttsText,
        language: ttsLanguage,
        speaker: ttsSpeaker,
        url: subscribedApis.tts ? REAL_ENDPOINTS.tts : DUMMY_ENDPOINTS.tts,
      }),
    [ttsText, ttsLanguage, ttsSpeaker, subscribedApis],
  );

  const sttDevCodePython = useMemo(
    () =>
      buildSttDevCodePython({
        language: sttLanguage,
        task: STT_DEFAULT_TASK,
        beamSize: sttBeamSize,
        vadOn: sttVadOn,
        url: subscribedApis.stt ? REAL_ENDPOINTS.stt : DUMMY_ENDPOINTS.stt,
      }),
    [sttLanguage, sttBeamSize, sttVadOn, subscribedApis],
  );

  const vcDevCodePython = useMemo(
    () =>
      buildVoiceCloneDevCodePython({
        text: vcText,
        language: vcLanguage,
        xVectorOnly: vcXVectorOnly,
        refText: vcRefText,
        url: subscribedApis.voiceClone ? REAL_ENDPOINTS.voiceClone : DUMMY_ENDPOINTS.voiceClone,
      }),
    [vcText, vcLanguage, vcXVectorOnly, vcRefText, subscribedApis],
  );

  const image2textDevCodePython = useMemo(
    () =>
      buildImage2TextDevCodePython({
        prompt: image2textPrompt || DEFAULT_IMAGE2TEXT_PROMPT,
        temperature: 0.1,
        url: subscribedApis.image2text ? REAL_ENDPOINTS.image2text : DUMMY_ENDPOINTS.image2text,
      }),
    [image2textPrompt, subscribedApis],
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
    (selectedApi === "stt" && sttHasWorkflowResult) ||
    (selectedApi === "voiceClone" && Boolean(vcAudioUrl)) ||
    (selectedApi === "image2text" && Boolean(image2textResult)) ||
    (selectedApi === "t2m" && Boolean(t2mAudioUrl)) ||
    (selectedApi === "t2i" && Boolean(t2iImageUrl));

  const { mounted: workflowBannerMounted, visible: workflowBannerVisible } =
    useResultTriggeredBanner(hasWorkflowBannerResult);

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
    Array.from(
      { length: STT_WAVE_BARS_COUNT },
      () => STT_WAVE_BAR_MIN_HEIGHT_PX,
    ),
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
    return () => {
      if (vcBlobUrlRef.current) {
        URL.revokeObjectURL(vcBlobUrlRef.current);
        vcBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = vcAudioRef.current;
    if (!el || !vcAudioUrl) return;
    const onLoaded = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setVcDurationMs(Math.round(el.duration * 1000));
      }
    };
    const onTime = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setVcProgress(el.currentTime / el.duration);
      }
    };
    const onEnded = () => {
      setVcPlaying(false);
      setVcProgress(0);
    };
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [vcAudioUrl]);

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
    const nextRequestJson = buildVoiceCloneConsoleRequestJson(
      vcText,
      vcLanguage,
      vcXVectorOnly,
      vcRefText,
      vcRefFileName,
    );
    setConsoleByApi((prev) => {
      if (prev.voiceClone.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        voiceClone: { ...prev.voiceClone, requestJson: nextRequestJson },
      };
    });
  }, [vcText, vcLanguage, vcXVectorOnly, vcRefText, vcRefFileName]);

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
    const el = t2mAudioRef.current;
    if (!el || !t2mAudioUrl) return;

    const onLoaded = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setT2mDurationMs(Math.round(el.duration * 1000));
      }
    };
    const onTime = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setT2mProgress(el.currentTime / el.duration);
      }
    };
    const onEnded = () => {
      setT2mPlaying(false);
      setT2mProgress(0);
      el.currentTime = 0;
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [t2mAudioUrl]);

  useEffect(() => {
    const nextRequestJson = buildLlmConsoleRequestJson(
      prompt,
      llmSystemPrompt,
      llmTemperature,
    );
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
  }, [prompt, llmSystemPrompt, llmTemperature]);

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
        return "예: 한국어 고객 문의를 요약하고, 우선순위와 다음 액션을 제안해줘.";
      case "embedding":
        return "예: 벡터로 변환할 문장을 입력하세요…";
      case "reranker":
        return "예: 검색 결과를 재정렬할 기준을 입력하세요…";
      case "tts":
        return "예: 읽어줄 문장을 입력하세요…";
      case "stt":
        return "예: 들어온 음성 내용을 요약해줘…";
      case "voiceClone":
        return "예: 클론된 목소리로 읽어줄 내용을 입력하세요…";
      case "image2text":
        return "예: 이미지를 업로드하고 분석 지시를 입력하세요…";
      case "t2m":
        return "예: Upbeat jazz with piano and saxophone, 120bpm…";
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
      systemPrompt: llmSystemPrompt,
      userMessage: llmDevUserMessage,
      temperature: 0.1, // Get Developer Code에는 Temperature 슬라이더를 반영하지 않음
      baseUrl: subscribedApis.llm ? REAL_ENDPOINTS.llm : DUMMY_ENDPOINTS.llm,
    });
  }, [llmDevUserMessage, llmSystemPrompt, subscribedApis]);

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
      if (parsed.systemPrompt !== undefined) {
        setLlmSystemPrompt(parsed.systemPrompt);
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
    if (selectedApi === "voiceClone") {
      const parsed = tryParseVoiceCloneConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.text !== undefined) setVcText(parsed.text);
      if (parsed.language !== undefined) setVcLanguage(parsed.language);
      if (parsed.xVectorOnly !== undefined)
        setVcXVectorOnly(parsed.xVectorOnly);
      if (parsed.refText !== undefined) setVcRefText(parsed.refText);
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
    if (api === "voiceClone") {
      if (vcBlobUrlRef.current) {
        URL.revokeObjectURL(vcBlobUrlRef.current);
        vcBlobUrlRef.current = null;
      }
      setVcText(DEFAULT_VC_TEXT);
      setVcLanguage(DEFAULT_VC_LANGUAGE);
      setVcXVectorOnly(true);
      setVcRefText("");
      setVcRefAudioFile(null);
      setVcRefFileName(null);
      setVcAudioUrl(null);
      setVcError(null);
      setVcWave([]);
      setVcDurationMs(0);
      setVcProgress(0);
      setVcPlaying(false);
      setVcIsLoading(false);
    }
    if (api === "image2text") {
      handleImage2TextFileClear();
      setImage2TextPrompt(DEFAULT_IMAGE2TEXT_PROMPT);
      setImage2TextResult(null);
      setImage2TextError(null);
      setImage2TextIsLoading(false);
    }
    if (api === "t2m") {
      if (t2mBlobUrlRef.current) {
        URL.revokeObjectURL(t2mBlobUrlRef.current);
        t2mBlobUrlRef.current = null;
      }
      setT2mPrompt("Upbeat jazz with piano and saxophone, 120bpm, warm and lively");
      setT2mDuration(10);
      setT2mAudioUrl(null);
      setT2mIsLoading(false);
      setT2mError(null);
      setT2mWave([]);
      setT2mDurationMs(0);
      setT2mProgress(0);
      setT2mPlaying(false);
    }
    if (api === "t2i") {
      if (t2iBlobUrlRef.current) {
        URL.revokeObjectURL(t2iBlobUrlRef.current);
        t2iBlobUrlRef.current = null;
      }
      setT2iPrompt("A serene mountain landscape at sunset, photorealistic, 8k");
      setT2iNegativePrompt("");
      setT2iWidth(1024);
      setT2iHeight(1024);
      setT2iSteps(50);
      setT2iImageUrl(null);
      setT2iIsLoading(false);
      setT2iError(null);
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

    setSidebarMode("all");
    setFilterTasks((prev) => {
      const next = { ...prev };
      next["Text Generation"] = selectedApi === "llm";
      next.Embedding = selectedApi === "embedding";
      next.Reranker = selectedApi === "reranker";
      next.TTS = selectedApi === "tts";
      next.STT = selectedApi === "stt";
      next["Voice Clone"] = selectedApi === "voiceClone";
      next.Vision = selectedApi === "image2text";
      next["Text-to-Music"] = selectedApi === "t2m";
      next.Other = false;
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
      const token = getToken();
      const embStart = Date.now();
      const res = await fetch("/api/embedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });

      const data = (await res.json().catch(() => null)) as {
        embeddingVector?: unknown;
        error?: unknown;
      } | null;

      patchConsole("embedding", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
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
      setEmbeddingLatencyMs(Date.now() - embStart);
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
      requestJson: buildRerankConsoleRequestJson(
        rerankQuestion,
        rerankDocsText,
      ),
      responseJson: "",
      error: null,
    });

    let consoleAlreadySet = false;

    try {
      const token = getToken();
      const rerankStart = Date.now();
      const res = await fetch("/api/rerank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        throw new Error("RERANK_API_ERROR");
      }

      const sorted = normalizeRerankResults(data, documents);

      setRerankResults(sorted);
      setDisplayedQuery(query);
      setRerankLatencyMs(Date.now() - rerankStart);
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
  async function runTtsSynthesis(
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

    try {
      const token = getToken();
      const ttsStart = Date.now();
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: trimmed,
          language: languageForSynthesis,
          speaker: speakerForSynthesis,
          instruct: styleInstructionForSynthesis?.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        patchConsole("tts", {
          statusCode: res.status,
          statusLine: `${res.status} ${res.statusText || "Error"}`,
          responseJson: JSON.stringify(errJson ?? {}, null, 2),
          error: errJson?.error ?? "TTS 요청에 실패했습니다.",
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      ttsBlobUrlRef.current = url;

      setAudioUrl(url);
      setTtsPlaying(false);
      setTtsProgress(0);
      setTtsLatencyMs(Date.now() - ttsStart);
      setTtsWave(mockWaveform(trimmed, 32)); // 파형은 텍스트 기반 데모 유지

      const responseBody: Record<string, unknown> = {
        status: "success",
        audio_url: url,
        language: languageForSynthesis,
        speaker: speakerForSynthesis,
        content_type: blob.type || res.headers.get("content-type") || null,
      };
      const styleTrim = styleInstructionForSynthesis.trim();
      if (styleTrim) responseBody.instruct = styleTrim;
      setMockResponse(responseBody);

      patchConsole("tts", {
        statusCode: 200,
        statusLine: "200 OK",
        responseJson: JSON.stringify(responseBody, null, 2),
        error: null,
      });

      // 응답 도착 시 자동 재생 시도 (브라우저 정책에 따라 실패할 수 있음)
      window.setTimeout(() => {
        const el = ttsAudioRef.current;
        if (!el) return;
        // src 반영 타이밍을 위해 재생은 다음 tick에 시도
        void el
          .play()
          .then(() => {
            setTtsPlaying(true);
          })
          .catch(() => {
            setTtsPlaying(false);
          });
      }, 50);
    } catch {
      patchConsole("tts", {
        statusCode: 500,
        statusLine: "500 TTS Error",
        responseJson: JSON.stringify({ error: "TTS request failed" }, null, 2),
        error: "TTS API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsSynthesizing(false);
    }
  }

  function handleTtsRun() {
    void runTtsSynthesis(ttsText, ttsLanguage, ttsSpeaker, ttsStyleInstruction);
  }

  async function runVcSynthesis() {
    if (vcIsLoading || !vcRefAudioFile || !vcText.trim()) return;

    if (vcBlobUrlRef.current) {
      URL.revokeObjectURL(vcBlobUrlRef.current);
      vcBlobUrlRef.current = null;
    }

    setVcAudioUrl(null);
    setVcError(null);
    setVcPlaying(false);
    setVcProgress(0);
    setVcIsLoading(true);

    patchConsole("voiceClone", {
      statusCode: null,
      statusLine: "Pending...",
      responseJson: "",
      error: null,
    });

    try {
      const token = getToken();
      const form = new FormData();
      form.append("ref_audio", vcRefAudioFile, vcRefAudioFile.name);
      form.append("text", vcText.trim());
      form.append("language", vcLanguage);
      form.append("x_vector_only_mode", vcXVectorOnly ? "true" : "false");
      if (!vcXVectorOnly && vcRefText.trim()) {
        form.append("ref_text", vcRefText.trim());
      }

      const vcStart = Date.now();
      const res = await fetch("/api/voice-clone", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        const msg = errJson?.error ?? "Voice Clone 요청에 실패했습니다.";
        setVcError(msg);
        patchConsole("voiceClone", {
          statusCode: res.status,
          statusLine: `${res.status} ${res.statusText || "Error"}`,
          responseJson: JSON.stringify(errJson ?? {}, null, 2),
          error: msg,
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      vcBlobUrlRef.current = url;
      setVcAudioUrl(url);
      setVcPlaying(false);
      setVcProgress(0);
      setVcLatencyMs(Date.now() - vcStart);
      setVcWave(mockWaveform(vcText.trim(), 32));

      const responseBody: Record<string, unknown> = {
        status: "success",
        audio_url: url,
        language: vcLanguage,
        x_vector_only_mode: vcXVectorOnly,
        content_type: blob.type || res.headers.get("content-type") || null,
      };
      patchConsole("voiceClone", {
        statusCode: 200,
        statusLine: "200 OK",
        responseJson: JSON.stringify(responseBody, null, 2),
        error: null,
      });

      window.setTimeout(() => {
        const el = vcAudioRef.current;
        if (!el) return;
        void el
          .play()
          .then(() => setVcPlaying(true))
          .catch(() => setVcPlaying(false));
      }, 50);
    } catch {
      setVcError("Voice Clone API 호출에 실패했습니다.");
      patchConsole("voiceClone", {
        statusCode: 500,
        statusLine: "500 Error",
        responseJson: JSON.stringify(
          { error: "Voice Clone request failed" },
          null,
          2,
        ),
        error: "Voice Clone API 호출에 실패했습니다.",
      });
    } finally {
      setVcIsLoading(false);
    }
  }

  function handleVcRun() {
    void runVcSynthesis();
  }

  function handleVcPlayPause() {
    if (!vcAudioUrl) return;
    const el = vcAudioRef.current;
    if (!el) return;
    if (vcPlaying) {
      el.pause();
      setVcPlaying(false);
      return;
    }
    void el
      .play()
      .then(() => setVcPlaying(true))
      .catch(() => setVcPlaying(false));
  }

  function handleVcSave() {
    if (!vcAudioUrl || typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = vcAudioUrl;
    link.download = `voice-clone-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleT2mRun() {
    void runT2mGeneration();
  }

  async function runT2mGeneration() {
    if (t2mIsLoading) return;

    if (t2mBlobUrlRef.current) {
      URL.revokeObjectURL(t2mBlobUrlRef.current);
      t2mBlobUrlRef.current = null;
    }

    setT2mAudioUrl(null);
    setT2mError(null);
    setT2mPlaying(false);
    setT2mProgress(0);
    setT2mWave([]);
    setT2mIsLoading(true);

    patchConsole("t2m", {
      statusCode: null,
      statusLine: "Pending...",
      responseJson: "",
      error: null,
    });

    try {
      const token = getToken();
      const t2mStart = Date.now();
      const res = await fetch("/api/t2m", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: t2mPrompt.trim(),
          lyrics: t2mLyrics.trim(),
          audio_duration: t2mDuration,
          seed: t2mSeed !== "" ? Number(t2mSeed) : -1,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        const errMsg = errJson?.error ?? "T2M 요청에 실패했습니다.";
        setT2mError(errMsg);
        patchConsole("t2m", {
          statusCode: res.status,
          statusLine: `${res.status} ${res.statusText || "Error"}`,
          responseJson: JSON.stringify(errJson ?? {}, null, 2),
          error: errMsg,
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      t2mBlobUrlRef.current = url;

      setT2mAudioUrl(url);
      setT2mWave(mockWaveform(t2mPrompt, 32));
      setT2mDurationMs(t2mDuration * 1000);
      setT2mLatencyMs(Date.now() - t2mStart);

      patchConsole("t2m", {
        statusCode: 200,
        statusLine: "200 OK",
        responseJson: JSON.stringify(
          {
            status: "success",
            audio_duration: t2mDuration,
            prompt: t2mPrompt.trim(),
            ...(t2mLyrics.trim() ? { lyrics: t2mLyrics.trim() } : {}),
            content_type: blob.type || res.headers.get("content-type") || null,
          },
          null,
          2,
        ),
        error: null,
      });

      window.setTimeout(() => {
        const el = t2mAudioRef.current;
        if (!el) return;
        void el
          .play()
          .then(() => setT2mPlaying(true))
          .catch(() => setT2mPlaying(false));
      }, 50);
    } catch {
      const errMsg = "T2M API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.";
      setT2mError(errMsg);
      patchConsole("t2m", {
        statusCode: 500,
        statusLine: "500 T2M Error",
        responseJson: JSON.stringify({ error: "fetch failed" }, null, 2),
        error: errMsg,
      });
    } finally {
      setT2mIsLoading(false);
    }
  }

  function handleT2iRun() {
    void runT2iGeneration();
  }

  async function runT2iGeneration() {
    if (t2iIsLoading) return;

    if (t2iBlobUrlRef.current) {
      URL.revokeObjectURL(t2iBlobUrlRef.current);
      t2iBlobUrlRef.current = null;
    }

    setT2iImageUrl(null);
    setT2iError(null);
    setT2iIsLoading(true);

    patchConsole("t2i", {
      statusCode: null,
      statusLine: "Pending...",
      responseJson: "",
      error: null,
    });

    try {
      const token = getToken();
      const t2iStart = Date.now();
      const res = await fetch("/api/t2i", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: t2iPrompt.trim(),
          negative_prompt: t2iNegativePrompt.trim() || " ",
          width: t2iWidth,
          height: t2iHeight,
          num_inference_steps: t2iSteps,
          seed: t2iSeed !== "" ? Number(t2iSeed) : -1,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        const errMsg = errJson?.error ?? "이미지 생성 요청에 실패했습니다.";
        setT2iError(errMsg);
        patchConsole("t2i", {
          statusCode: res.status,
          statusLine: `${res.status} ${res.statusText || "Error"}`,
          responseJson: JSON.stringify(errJson ?? {}, null, 2),
          error: errMsg,
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      t2iBlobUrlRef.current = url;
      setT2iImageUrl(url);
      setT2iLatencyMs(Date.now() - t2iStart);

      patchConsole("t2i", {
        statusCode: 200,
        statusLine: "200 OK",
        responseJson: JSON.stringify(
          {
            status: "success",
            prompt: t2iPrompt.trim(),
            width: t2iWidth,
            height: t2iHeight,
            content_type: blob.type || res.headers.get("content-type") || null,
          },
          null,
          2,
        ),
        error: null,
      });
    } catch {
      const errMsg = "이미지 생성 API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.";
      setT2iError(errMsg);
      patchConsole("t2i", {
        statusCode: 500,
        statusLine: "500 T2I Error",
        responseJson: JSON.stringify({ error: "fetch failed" }, null, 2),
        error: errMsg,
      });
    } finally {
      setT2iIsLoading(false);
    }
  }

  function handleT2iSave() {
    if (!t2iImageUrl || typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = t2iImageUrl;
    link.download = `t2i-${Date.now()}.png`;
    link.click();
    link.remove();
  }

  function handleT2mPlayPause() {
    if (!t2mAudioUrl) return;
    const el = t2mAudioRef.current;
    if (!el) return;
    if (t2mPlaying) {
      el.pause();
      setT2mPlaying(false);
      return;
    }
    void el
      .play()
      .then(() => setT2mPlaying(true))
      .catch(() => setT2mPlaying(false));
  }

  function handleT2mSave() {
    if (!t2mAudioUrl || typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = t2mAudioUrl;
    link.download = `t2m-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleVcRefFileChange(file: File | null) {
    if (file && file.size > 20 * 1024 * 1024) {
      setVcError("파일 크기가 20MB를 초과합니다.");
      return;
    }
    setVcRefAudioFile(file);
    setVcRefFileName(file ? file.name : null);
    setVcAudioUrl(null);
    setVcError(null);
    if (vcBlobUrlRef.current) {
      URL.revokeObjectURL(vcBlobUrlRef.current);
      vcBlobUrlRef.current = null;
    }
  }

  function handleVcRefFileClear() {
    setVcRefAudioFile(null);
    setVcRefFileName(null);
    setVcAudioUrl(null);
    setVcError(null);
    if (vcBlobUrlRef.current) {
      URL.revokeObjectURL(vcBlobUrlRef.current);
      vcBlobUrlRef.current = null;
    }
    if (vcRefAudioFileInputRef.current) {
      vcRefAudioFileInputRef.current.value = "";
    }
  }

  function handleImage2TextFileChange(file: File | null) {
    if (file && file.size > 20 * 1024 * 1024) {
      setImage2TextError("파일 크기가 20MB를 초과합니다.");
      return;
    }
    setImage2TextImageFile(file);
    setImage2TextFileName(file ? file.name : null);
    setImage2TextResult(null);
    setImage2TextError(null);
    if (image2textImagePreview) {
      URL.revokeObjectURL(image2textImagePreview);
    }
    if (file) {
      setImage2TextImagePreview(URL.createObjectURL(file));
    } else {
      setImage2TextImagePreview(null);
    }
  }

  useEffect(() => {
    patchConsole("image2text", {
      requestJson: buildImage2TextConsoleRequestJson(
        image2textPrompt,
        image2textFileName,
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image2textPrompt, image2textFileName]);

  function handleImage2TextFileClear() {
    setImage2TextImageFile(null);
    setImage2TextFileName(null);
    setImage2TextResult(null);
    setImage2TextError(null);
    if (image2textImagePreview) {
      URL.revokeObjectURL(image2textImagePreview);
      setImage2TextImagePreview(null);
    }
    if (image2textFileInputRef.current) {
      image2textFileInputRef.current.value = "";
    }
  }

  async function runImage2Text() {
    if (!image2textImageFile) return;
    setImage2TextIsLoading(true);
    setImage2TextResult(null);
    setImage2TextError(null);
    patchConsole("image2text", {
      statusCode: null,
      statusLine: "Pending...",
      responseJson: "",
    });

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("image", image2textImageFile, image2textImageFile.name);
      if (image2textPrompt.trim()) {
        formData.append("prompt", image2textPrompt.trim());
      }

      const img2txtStart = Date.now();
      const res = await fetch("/api/image2text", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = (await res.json().catch(() => null)) as {
        text?: string;
        error?: string;
      } | null;

      patchConsole("image2text", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(json ?? {}, null, 2),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        setImage2TextError(
          json?.error ?? "Image2Text API 호출에 실패했습니다.",
        );
        return;
      }

      setImage2TextResult(json?.text ?? "");
      setImage2TextLatencyMs(Date.now() - img2txtStart);
    } catch {
      setImage2TextError("Image2Text API 호출에 실패했습니다.");
      patchConsole("image2text", {
        statusCode: 500,
        statusLine: "500 Error",
        responseJson: JSON.stringify({ error: "fetch failed" }, null, 2),
      });
    } finally {
      setImage2TextIsLoading(false);
    }
  }

  function handleImage2TextRun() {
    void runImage2Text();
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
    void el
      .play()
      .then(() => setTtsPlaying(true))
      .catch(() => {
        setTtsPlaying(false);
      });
  }

  function handleTtsSave() {
    if (!audioUrl || typeof document === "undefined") return;

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `ai-api-omakase-tts-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    link.remove();
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
          Array.from(
            { length: STT_WAVE_BARS_COUNT },
            () => STT_WAVE_BAR_MIN_HEIGHT_PX,
          ),
        );

        const barRange = Math.max(
          1,
          Math.floor(bufferLength / STT_WAVE_BARS_COUNT),
        );
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

            target = clamp(
              target,
              STT_WAVE_BAR_MIN_HEIGHT_PX,
              STT_WAVE_BAR_MAX_HEIGHT_PX,
            );

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
        isDenied
          ? "마이크 접근 권한이 필요합니다."
          : "마이크 사용에 실패했습니다.",
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
      Array.from(
        { length: STT_WAVE_BARS_COUNT },
        () => STT_WAVE_BAR_MIN_HEIGHT_PX,
      ),
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

      const token = getToken();
      const sttStart = Date.now();
      const res = await fetch("/api/stt", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = (await res.json().catch(() => null)) as unknown | null;

      if (!res.ok) {
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        const responseJson = JSON.stringify(
          data ?? { error: "Request failed" },
          null,
          2,
        );
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
      setSttLatencyMs(Date.now() - sttStart);

      patchConsole("stt", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || "OK"}`.trim(),
        responseJson: JSON.stringify(data ?? {}, null, 2),
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "STT 서버 연결 실패";
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
    if (file && file.size > 20 * 1024 * 1024) {
      setSttError("파일 크기가 20MB를 초과합니다.");
      return;
    }
    setSttFileName(file ? file.name : null);
    setSttSelectedAudioFile(file);
    setSttTranscript(null);
    setIsRecording(false);
    setSttRecordedFileInfo(file ? `${file.name} (binary from upload)` : null);
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
          model: "Qwen/Qwen3.6-35B-A3B",
          ...(llmSystemPrompt.trim()
            ? {
                messages: [
                  { role: "system", content: llmSystemPrompt.trim() },
                  { role: "user", content: trimmed },
                ],
              }
            : { input: trimmed }),
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
      const llmStart = Date.now();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          input: trimmed,
          systemPrompt: llmSystemPrompt.trim() || undefined,
          temperature: llmTemperature,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
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
      setLlmLatencyMs(Date.now() - llmStart);

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
    const targetApi = selectedApi;
    if (
      (targetApi === "llm" && isChatLoading)
    ) {
      return;
    }
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

        const token = getToken();
        const rerankStart = Date.now();
        const res = await fetch("/api/rerank", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
          if (res.status === 429) {
            setLimitExceededModalOpen(true);
          }
          throw new Error("RERANK_API_ERROR");
        }

        const sorted = normalizeRerankResults(responseJson, input);
        setRerankResults(sorted);
        setDisplayedQuery(query);
        setRerankLatencyMs(Date.now() - rerankStart);
        patchConsole("reranker", {
          responseJson: JSON.stringify({ rerank: sorted }, null, 2),
        });
        return;
      }

      if (targetApi === "embedding") {
        const body = parsed as { input?: unknown; input_type?: unknown };
        const input = typeof body.input === "string" ? body.input.trim() : "";
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

        const token = getToken();
        const embStart = Date.now();
        const res = await fetch("/api/embedding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ input, input_type: inputType }),
        });

        const responseJson = (await res.json().catch(() => null)) as {
          embeddingVector?: unknown;
        } | null;
        patchConsole("embedding", {
          statusCode: res.status,
          statusLine: `${res.status} ${
            res.statusText || (res.ok ? "OK" : "Error")
          }`,
          responseJson: JSON.stringify(responseJson ?? {}, null, 2),
        });
        consoleAlreadySet = true;

        if (!res.ok) {
          if (res.status === 429) {
            setLimitExceededModalOpen(true);
          }
          throw new Error("EMBEDDING_API_ERROR");
        }

        const vec = responseJson?.embeddingVector;
        if (Array.isArray(vec)) {
          const normalized = (vec as unknown[])
            .map((v) => (typeof v === "number" ? v : Number(v)))
            .filter((v): v is number => Number.isFinite(v));
          setEmbeddingVector(normalized);
          setEmbeddingDisplayNonce((n) => n + 1);
          setEmbeddingLatencyMs(Date.now() - embStart);
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
        const text = typeof body.text === "string" ? body.text.trim() : "";
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
        void runTtsSynthesis(text, language, speaker, styleInstruction);
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
        systemPrompt?: unknown;
        temperature?: unknown;
      };
      const directInput =
        typeof body.input === "string" ? body.input.trim() : "";
      const directSystemPrompt =
        typeof body.systemPrompt === "string" ? body.systemPrompt.trim() : "";
      const messageSystemPrompt = Array.isArray(body.messages)
        ? [...body.messages]
            .reverse()
            .find(
              (m) => m && m.role === "system" && typeof m.content === "string",
            )?.content
        : "";
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
      const systemPrompt = (
        typeof messageSystemPrompt === "string" && messageSystemPrompt.trim()
          ? messageSystemPrompt
          : directSystemPrompt
      ).trim();

      const parsedTemperature =
        typeof body.temperature === "number" &&
        Number.isFinite(body.temperature)
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
      setLlmSystemPrompt(systemPrompt);
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
      const llmStart = Date.now();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          input,
          systemPrompt: systemPrompt || undefined,
          temperature: parsedTemperature,
        }),
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
        if (res.status === 429) {
          setLimitExceededModalOpen(true);
        }
        if (res.status === 401) {
          throw new Error("401");
        }
        throw new Error("API_ERROR");
      }

      setLlmLatencyMs(Date.now() - llmStart);
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

  const selectedMarketplaceItem = filteredMarketplace.find(
    (item) => item.apiId === selectedApi,
  );
  const selectedPlan = selectedMarketplaceItem
    ? resolveMarketplacePlan(selectedMarketplaceItem)
    : null;
  const rateLimit = selectedPlan
    ? `분당 ${rpsToRequestsPerMinute(selectedPlan.max_rps).toLocaleString("ko-KR")}회`
    : "구독 후 확인";

  function fmtLatency(ms: number | null, isLoading: boolean): string {
    if (isLoading) return "running";
    if (ms === null) return "not tested";
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  const selectedRouteProfile = (() => {
    switch (selectedApi) {
      case "llm":
        return {
          label: "Text generation",
          model: "LLM API",
          endpoint: "/api/chat",
          latency: fmtLatency(llmLatencyMs, isChatLoading),
          rateLimit,
        };
      case "embedding":
        return {
          label: "Semantic indexing",
          model: "Embedding API",
          endpoint: "/api/embedding",
          latency: fmtLatency(embeddingLatencyMs, isEmbeddingLoading),
          rateLimit,
        };
      case "reranker":
        return {
          label: "Retrieval quality",
          model: "Reranking API",
          endpoint: "/api/rerank",
          latency: fmtLatency(rerankLatencyMs, isRerankLoading),
          rateLimit,
        };
      case "tts":
        return {
          label: "Voice synthesis",
          model: "TTS API",
          endpoint: "client synthesis demo",
          latency: fmtLatency(ttsLatencyMs, isSynthesizing),
          rateLimit,
        };
      case "stt":
        return {
          label: "Speech recognition",
          model: "STT API",
          endpoint: "/api/stt",
          latency: fmtLatency(sttLatencyMs, isSttLoading),
          rateLimit,
        };
      case "voiceClone":
        return {
          label: "Voice cloning",
          model: "Voice Clone API",
          endpoint: "/api/voice-clone",
          latency: fmtLatency(vcLatencyMs, vcIsLoading),
          rateLimit,
        };
      case "image2text":
        return {
          label: "Vision extraction",
          model: "Image-to-Text API",
          endpoint: "/api/image2text",
          latency: fmtLatency(image2textLatencyMs, image2textIsLoading),
          rateLimit,
        };
      case "t2m":
        return {
          label: "Audio generation",
          model: "Text-to-Music API",
          endpoint: "/api/t2m",
          latency: fmtLatency(t2mLatencyMs, t2mIsLoading),
          rateLimit,
        };
      case "t2i":
        return {
          label: "Image generation",
          model: "Image Generation API",
          endpoint: "/api/t2i",
          latency: fmtLatency(t2iLatencyMs, t2iIsLoading),
          rateLimit,
        };
      default:
        return {
          label: "API test",
          model: selectedApiItem?.name ?? "Selected API",
          endpoint: "/api/chat",
          latency: "not tested",
          rateLimit,
        };
    }
  })();
  const selectedIsRunning =
    (selectedApi === "llm" && isChatLoading) ||
    (selectedApi === "embedding" && isEmbeddingLoading) ||
    (selectedApi === "reranker" && isRerankLoading) ||
    (selectedApi === "tts" && isSynthesizing) ||
    (selectedApi === "stt" && isSttLoading) ||
    (selectedApi === "voiceClone" && vcIsLoading) ||
    (selectedApi === "image2text" && image2textIsLoading) ||
    (selectedApi === "t2m" && t2mIsLoading) ||
    (selectedApi === "t2i" && t2iIsLoading);
  const selectedHasResult =
    (selectedApi === "llm" && messages.some((m) => m.role === "assistant")) ||
    (selectedApi === "embedding" && Boolean(embeddingVector)) ||
    (selectedApi === "reranker" && Boolean(rerankResults)) ||
    (selectedApi === "tts" && Boolean(audioUrl)) ||
    (selectedApi === "stt" && Boolean(sttTranscript)) ||
    (selectedApi === "voiceClone" && Boolean(vcAudioUrl)) ||
    (selectedApi === "image2text" && Boolean(image2textResult)) ||
    (selectedApi === "t2m" && Boolean(t2mAudioUrl)) ||
    (selectedApi === "t2i" && Boolean(t2iImageUrl));

  return (
    <PlatformShell hideSidebar>
      {limitExceededModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[min(480px,90%)] rounded-xl border border-black/[0.08] bg-white p-6 shadow-xl">
            <p className="text-center text-base font-medium text-foreground">
              일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setLimitExceededModalOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
              >
                닫기
              </button>
              <Link
                href="/signup"
                onClick={() => setLimitExceededModalOpen(false)}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <div className="relative pb-12">

        {/* Page header — 리스트 뷰에서만 표시 */}
        {viewMode === "list" && (
          <header className="mb-6 flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                Workbench
              </p>
              <h1 className="mt-2 text-[30px] font-semibold leading-tight text-[#08090d] md:text-[40px]">
                AI API 워크벤치
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/56">
                API를 고르고, Playground에서 테스트한 뒤 response와 코드 예제를 확인하세요.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/plans"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-black/[0.08] bg-white px-4 text-[13px] font-semibold text-black/72 transition-colors hover:border-black/20 hover:text-black"
              >
                요금제 보기
              </Link>
            </div>
          </header>
        )}

        {viewMode === "list" ? (
          <div className="relative flex flex-col gap-6 lg:flex-row lg:gap-6">
            {comingSoonMessage ? (
              <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                <div className="w-[min(520px,90%)] rounded-xl border border-accent/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(232, 136, 138,0.18)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                      <IconPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        준비 중
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                        {comingSoonMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="닫기"
                      onClick={() => {
                        if (comingSoonTimerRef.current) window.clearTimeout(comingSoonTimerRef.current);
                        setComingSoonMessage(null);
                      }}
                      className="mt-0.5 shrink-0 rounded-lg p-1 text-foreground/40 transition-colors hover:bg-white/10 hover:text-foreground/70"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {/* API List */}
            <section className="w-full min-w-0">
              <div className="platform-panel rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-foreground/60">
                      API 선택
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">
                      테스트할 API를 선택하세요
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
                  <span className="whitespace-nowrap rounded-xl border border-accent/25 bg-accent/5 px-3 py-1 font-mono text-xs text-accent">
                    {filteredMarketplace.length === 0
                      ? "playground ready"
                      : filteredMarketplace.length === 1
                        ? "1 API"
                        : `${filteredMarketplace.length} APIs`}
                  </span>
                </div>

                {filteredMarketplace.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-black/[0.12] bg-background px-5 py-8">
                    <p className="text-base font-semibold text-foreground">
                      표시할 API가 없습니다.
                    </p>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/56">
                      필터를 초기화하거나, LLM playground에서 기본 텍스트 생성
                      API를 먼저 테스트해보세요.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApi("llm");
                        setViewMode("detail");
                        if (typeof window !== "undefined") {
                          window.history.pushState(null, "", "/api-test?api=llm");
                        }
                      }}
                      className="mt-5 rounded-lg bg-[#08090d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                    >
                      플레이그라운드 바로 열기
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMarketplace.map((item) => {
                    const currentPlan = resolveMarketplacePlan(item);
                    const rowApi =
                      item.backendApiId != null
                        ? apisFromBackend.find((a) => a.id === item.backendApiId)
                        : undefined;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => enterDetailFor(item)}
                        className={[
                          "group relative flex h-full flex-col rounded-xl border bg-white p-4 text-left transition-all",
                          "border-black/[0.06] hover:border-black/[0.16] hover:bg-background",
                        ].join(" ")}
                      >
                        <p className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                          {item.model}
                        </p>
                        {rowApi?.is_active === false ? (
                          <p className="mt-1 text-[11px] font-medium text-foreground/45">
                            비활성
                          </p>
                        ) : null}
                        {item.modelDisplay && (
                          <p className="mt-1 text-[11px] font-mono text-foreground/45">
                            {item.modelDisplay}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {[...item.taskTags.slice(0, 3), "트래픽 기반", "등급별 과금"].map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg border border-accent/25 bg-accent/5 px-2 py-1 text-[11px] font-mono text-accent"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {currentPlan ? (
                          <p className="mt-3 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent">
                            현재: {currentPlan.plan_name} ({rpsToRequestsPerMinute(currentPlan.max_rps).toLocaleString("ko-KR")} RPM)
                          </p>
                        ) : null}

                        <div className="mt-auto flex items-center justify-start gap-2 pt-4">
                          <span className="text-xs text-foreground/50">
                            테스트하러 가기
                          </span>
                          <span className="text-accent transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </div>
                      </button>
                    );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="relative grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_340px]">
            {/* 모바일 환경 안내 배너 */}
            <div className="hidden">
              <p className="text-center text-xs text-amber-700/70">
                더 넓은 화면에서 편하게 체험할 수 있습니다.
              </p>
            </div>

            {/* Left: API Selection */}
            <aside className="w-full min-w-0 xl:sticky xl:top-24 xl:self-start">
              <div className="max-h-[340px] overflow-y-auto rounded-xl border border-black/[0.08] bg-white p-3 shadow-[0_18px_70px_rgba(8,9,13,0.045)] xl:max-h-[calc(100vh-120px)]">
                <div className="px-2 pb-3">
                  <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                    API selection
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-foreground">
                    테스트할 API 선택
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-black/52">
                    목적에 맞는 API를 고르고, 가운데 Playground에서 바로
                    실행해보세요.
                  </p>
                </div>

                <div className="space-y-1.5">
                  {detailApiItems.map((api) => {
                    const isActive = selectedApi === api.id;
                    const statusText =
                      selectedApi === api.id && selectedIsRunning
                        ? "running"
                        : selectedApi === api.id && selectedHasResult
                          ? "tested"
                          : "ready";

                    return (
                      <button
                        key={api.id}
                        type="button"
                        onClick={() => {
                          if (api.id === "t2i") {
                            setT2iComingSoonOpen(true);
                            return;
                          }

                          setSelectedApi(api.id);
                          setViewMode("detail");
                          if (typeof window !== "undefined") {
                            window.history.pushState(
                              null,
                              "",
                              `/api-test?api=${api.id}`,
                            );
                          }
                        }}
                        className={[
                          "group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                          isActive
                            ? "border-black/20 bg-background"
                            : "border-transparent hover:border-black/[0.08] hover:bg-background/70",
                        ].join(" ")}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span
                          className={[
                            "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[10px]",
                            isActive
                              ? "border-accent/35 bg-accent/10 text-accent"
                              : "border-black/[0.08] bg-white text-black/44",
                          ].join(" ")}
                        >
                          {api.name
                            .split(/[\s-]/)
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {api.name}
                            </span>
                            <span
                              className={[
                                "shrink-0 font-mono text-[10px]",
                                isActive && selectedHasResult
                                  ? "text-emerald-600"
                                  : isActive && selectedIsRunning
                                    ? "text-accent"
                                    : "text-black/36",
                              ].join(" ")}
                            >
                              {statusText}
                            </span>
                          </span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-black/52">
                            {api.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Center: Playground */}
            <section className="w-full min-w-0">
              <div
                className="relative flex min-h-[700px] min-h-0 flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_20px_80px_rgba(8,9,13,0.06)]"
              >
                <div
                  className="border-b border-black/[0.06] bg-white p-5"
                >
                  <div className="min-w-0 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window === "undefined") return;

                        const params = new URLSearchParams(
                          window.location.search,
                        );
                        const openedFromDeepLink =
                          params.has("api") || params.get("view") === "detail";

                        if (!openedFromDeepLink) {
                          const snap = listViewFilterSnapshotRef.current;
                          if (snap) {
                            setSidebarMode(snap.sidebarMode);
                            setFilterTasks(snap.filterTasks);
                            listViewFilterSnapshotRef.current = null;
                          } else {
                            setSidebarMode("all");
                            setFilterTasks((prev) => {
                              const next = { ...prev };
                              taskKeys.forEach((k) => {
                                next[k] = true;
                              });
                              next.Other = true;
                              return next;
                            });
                          }
                          setViewMode("list");
                          return;
                        }

                        if (window.history.length > 1) {
                          router.back();
                        } else {
                          router.push("/");
                        }
                      }}
                      aria-label="이전 화면으로 돌아가기"
                      className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-black/20 hover:text-foreground"
                    >
                      <IconArrowLeft className="h-4 w-4 shrink-0" />
                      <span>API 목록으로</span>
                    </button>
                    <div className="mt-4">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                          API playground
                        </p>
                        <h3 className="mt-2 max-w-3xl break-words text-2xl font-semibold leading-tight tracking-normal text-foreground">
                          {selectedApiItem?.name ?? "API"} 테스트
                        </h3>
                        <p className="mt-2 max-w-full whitespace-normal break-all text-sm leading-6 text-black/56">
                          입력값을 구성하고 응답을 확인하세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {comingSoonMessage ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                    <div className="w-[min(520px,90%)] rounded-xl border border-accent/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(232, 136, 138,0.18)]">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                          <IconPlus className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            준비 중
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                            {comingSoonMessage}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="닫기"
                          onClick={() => {
                            if (comingSoonTimerRef.current) window.clearTimeout(comingSoonTimerRef.current);
                            setComingSoonMessage(null);
                          }}
                          className="mt-0.5 shrink-0 rounded-lg p-1 text-foreground/40 transition-colors hover:bg-white/10 hover:text-foreground/70"
                        >
                          <IconX className="h-4 w-4" />
                        </button>
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
                  className={
                    selectedApi === "llm" || selectedApi === "stt"
                      ? "api-center-anim flex min-h-0 flex-1 flex-col"
                      : "api-center-anim min-h-0 flex-1 overflow-y-auto"
                  }
                >
                  <div className={`px-3 py-4 ${selectedApi === "llm" ? "order-2 min-h-0 flex-1 overflow-y-auto pt-1" : selectedApi === "stt" ? "min-h-0 flex-1 overflow-y-auto" : ""}`}>
                      <ApiOutputPanel
                        selectedApi={selectedApi}
                        messages={messages}
                        endRef={endRef}
                        formatTime={formatTime}
                        liveNowText={formatTime(Date.now())}
                        embeddingVector={embeddingVector}
                        embeddingError={embeddingError}
                        isEmbeddingLoading={isEmbeddingLoading}
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
                        handleTtsSave={handleTtsSave}
                        IconPlay={IconPlay}
                        IconPause={IconPause}
                        sttTranscript={sttTranscript}
                        isSttLoading={isSttLoading}
                        sttError={sttError}
                        sttFileName={sttFileName}
                        isRecording={isRecording}
                        vcAudioUrl={vcAudioUrl}
                        vcIsSynthesizing={vcIsLoading}
                        vcAudioRef={vcAudioRef}
                        vcPlaying={vcPlaying}
                        vcWave={vcWave}
                        vcProgress={vcProgress}
                        vcDurationMs={vcDurationMs}
                        handleVcPlayPause={handleVcPlayPause}
                        handleVcSave={handleVcSave}
                        vcRefFileName={vcRefFileName}
                        vcError={vcError}
                        image2textResult={image2textResult}
                        image2textIsLoading={image2textIsLoading}
                        image2textError={image2textError}
                        image2textImagePreview={image2textImagePreview}
                        t2mAudioUrl={t2mAudioUrl}
                        t2mIsLoading={t2mIsLoading}
                        t2mError={t2mError}
                        t2mAudioRef={t2mAudioRef}
                        t2mPlaying={t2mPlaying}
                        t2mWave={t2mWave}
                        t2mProgress={t2mProgress}
                        t2mDurationMs={t2mDurationMs}
                        handleT2mPlayPause={handleT2mPlayPause}
                        handleT2mSave={handleT2mSave}
                        t2iImageUrl={t2iImageUrl}
                        t2iIsLoading={t2iIsLoading}
                        t2iError={t2iError}
                        handleT2iSave={handleT2iSave}
                      />
                    </div>
                  <div
                    className={
                      selectedApi === "llm"
                        ? "order-1 flex-shrink-0 px-3 pb-3 pt-3"
                        : selectedApi === "stt"
                        ? "flex-shrink-0 px-3 py-3"
                        : "px-3 py-3"
                    }
                  >
                    <ApiInputPanel
                      selectedApi={selectedApi}
                      onSend={onSend as React.FormEventHandler<HTMLFormElement>}
                      prompt={prompt}
                      llmSystemPrompt={llmSystemPrompt}
                      setPrompt={setPrompt}
                      setLlmSystemPrompt={setLlmSystemPrompt}
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
                        setTtsLanguage as React.Dispatch<
                          React.SetStateAction<string>
                        >
                      }
                      ttsLanguageOptions={TTS_LANGUAGE_OPTIONS.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      ttsSpeaker={ttsSpeaker}
                      setTtsSpeaker={
                        setTtsSpeaker as React.Dispatch<
                          React.SetStateAction<string>
                        >
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
                      handleVcRun={handleVcRun}
                      vcText={vcText}
                      setVcText={setVcText}
                      vcLanguage={vcLanguage}
                      setVcLanguage={setVcLanguage}
                      vcLanguageOptions={VOICE_CLONE_LANGUAGE_OPTIONS.map(
                        (opt) => ({
                          value: opt.value,
                          label: opt.label,
                        }),
                      )}
                      vcXVectorOnly={vcXVectorOnly}
                      setVcXVectorOnly={setVcXVectorOnly}
                      vcRefText={vcRefText}
                      setVcRefText={setVcRefText}
                      vcRefAudioFileInputRef={vcRefAudioFileInputRef}
                      vcRefFileName={vcRefFileName}
                      onVcRefAudioChange={handleVcRefFileChange}
                      onVcRefAudioClear={handleVcRefFileClear}
                      isVcSynthesizing={vcIsLoading}
                      handleImage2TextRun={handleImage2TextRun}
                      image2textPrompt={image2textPrompt}
                      setImage2TextPrompt={setImage2TextPrompt}
                      image2textFileInputRef={image2textFileInputRef}
                      image2textFileName={image2textFileName}
                      onImage2TextFileChange={handleImage2TextFileChange}
                      onImage2TextFileClear={handleImage2TextFileClear}
                      image2textIsLoading={image2textIsLoading}
                      t2mPrompt={t2mPrompt}
                      setT2mPrompt={setT2mPrompt}
                      t2mLyrics={t2mLyrics}
                      setT2mLyrics={setT2mLyrics}
                      t2mDuration={t2mDuration}
                      setT2mDuration={setT2mDuration}
                      t2mSeed={t2mSeed}
                      setT2mSeed={setT2mSeed}
                      t2mIsLoading={t2mIsLoading}
                      handleT2mRun={handleT2mRun}
                      t2iPrompt={t2iPrompt}
                      setT2iPrompt={setT2iPrompt}
                      t2iNegativePrompt={t2iNegativePrompt}
                      setT2iNegativePrompt={setT2iNegativePrompt}
                      t2iWidth={t2iWidth}
                      setT2iWidth={setT2iWidth}
                      t2iHeight={t2iHeight}
                      setT2iHeight={setT2iHeight}
                      t2iSteps={t2iSteps}
                      setT2iSteps={setT2iSteps}
                      t2iSeed={t2iSeed}
                      setT2iSeed={setT2iSeed}
                      t2iIsLoading={t2iIsLoading}
                      handleT2iRun={handleT2iRun}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Right: Result Panel */}
            <aside className="w-full min-w-0 xl:col-start-2 2xl:col-start-auto">
              <div
                className="sticky top-24 flex min-h-0 flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_20px_80px_rgba(8,9,13,0.055)] 2xl:max-h-[calc(100vh-120px)]"
              >
                <div className="border-b border-black/[0.06] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                        result panel
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        테스트 결과 확인
                      </p>
                      <p className="mt-1 text-xs leading-5 text-black/52">
                        응답 상태, latency, raw response를 확인하고 이 API를
                        사용할지 판단하세요.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resetConsoleForApi(selectedApi)}
                        className="whitespace-nowrap rounded-lg border border-black/[0.08] bg-background px-3 py-1 text-[11px] font-mono text-foreground/60 transition-colors hover:border-black/20 hover:text-foreground"
                      >
                        초기화
                      </button>
                      <span
                        className={[
                          "rounded-lg border border-black/[0.08] bg-background px-3 py-1 text-[11px] font-mono",
                          currentConsole.statusCode === 200
                            ? "text-accent"
                            : currentConsole.statusCode &&
                                currentConsole.statusCode >= 400
                              ? "text-red-500"
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
                    <div className="rounded-xl border border-black/[0.08] bg-background p-4">
                      <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                        선택한 API
                      </p>
                      <p className="mt-2 text-lg font-semibold leading-tight text-foreground">
                        {selectedRouteProfile.model}
                      </p>
                      <p className="mt-2 font-mono text-[11px] text-black/48">
                        {selectedRouteProfile.endpoint}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-black/[0.06] bg-white px-3 py-2">
                          <p className="font-mono text-[10px] uppercase text-black/36">
                            latency
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {selectedRouteProfile.latency}
                          </p>
                        </div>
                        <div className="rounded-lg border border-black/[0.06] bg-white px-3 py-2">
                          <p className="font-mono text-[10px] uppercase text-black/36">
                            rate limit
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {selectedRouteProfile.rateLimit}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-black/[0.08] bg-white p-3">
                      <div className="space-y-3">
                        {[
                          {
                            step: "1",
                            label: "API 선택",
                            value:
                              selectedApiItem?.name ?? selectedRouteProfile.model,
                            active: true,
                          },
                          {
                            step: "2",
                            label: "Playground 테스트",
                            value: selectedIsRunning
                              ? "실행 중"
                              : selectedHasResult
                                ? "완료"
                                : "입력 후 실행",
                            active: selectedIsRunning || selectedHasResult,
                          },
                          {
                            step: "3",
                            label: "사용 결정",
                            value: selectedHasResult
                              ? "응답 검토 가능"
                              : "결과 대기",
                            active: selectedHasResult,
                          },
                        ].map(({ step, label, value, active }) => (
                          <div key={step} className="flex items-center gap-3">
                            <span
                              className={[
                                "inline-flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px]",
                                active
                                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                                  : "border-black/[0.08] bg-background text-black/40",
                              ].join(" ")}
                            >
                              {step}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {label}
                              </p>
                              <p className="truncate font-mono text-[10px] text-black/40">
                                {value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <details className="group rounded-xl border border-black/[0.08] bg-background p-3">
                      <summary className="cursor-pointer list-none font-mono text-xs text-foreground/60 transition-colors group-open:text-foreground">
                        Advanced request payload
                      </summary>
                      <div className="mt-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs text-foreground/60">
                          Request
                        </p>
                        <span className="rounded-lg border border-black/[0.08] bg-white px-2 py-0.5 text-[11px] text-foreground/60">
                          {selectedApi === "stt" ||
                          selectedApi === "voiceClone" ||
                          selectedApi === "image2text"
                            ? "multipart/form-data"
                            : "JSON Body"}
                        </span>
                      </div>
                      <textarea
                        value={currentConsole.requestJson}
                        onChange={(e) => {
                          handleConsoleRequestJsonChange(e.target.value);
                        }}
                        placeholder={`{\n  "model": "Qwen/Qwen3.6-35B-A3B",\n  "input": "직접 입력한 내용"\n}`}
                        rows={9}
                        className="mt-3 min-h-[160px] w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-mono text-[12px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-foreground/60">
                          편집 후 JSON을 파싱해 전송합니다.
                        </p>
                        <button
                          type="button"
                          onClick={sendConsoleRequest}
                          disabled={
                            (selectedApi === "llm" && isChatLoading) ||
                            (selectedApi === "embedding" && isEmbeddingLoading) ||
                            (selectedApi === "reranker" && isRerankLoading)
                          }
                          className={[
                            "rounded-xl border px-4 py-2.5 text-xs font-medium transition-colors",
                            "border-accent/35 bg-accent/10 text-accent hover:bg-accent/15",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            consoleSubmitShake ? "console-shake" : "",
                          ].join(" ")}
                        >
                          {(selectedApi === "llm" && isChatLoading) ||
                          (selectedApi === "embedding" && isEmbeddingLoading) ||
                          (selectedApi === "reranker" && isRerankLoading)
                            ? "전송 중..."
                            : "요청 전송"}
                        </button>
                      </div>
                      </div>
                    </details>

                    <details className="group rounded-xl border border-black/[0.08] bg-background p-3">
                      <summary className="cursor-pointer list-none font-mono text-xs text-foreground/60 transition-colors group-open:text-foreground">
                        Raw response
                      </summary>
                      <div className="mt-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs text-foreground/60">
                          Response
                        </p>
                      </div>
                      {selectedApi === "tts" ? (
                        <div className="mt-3">
                          {audioUrl ? (
                            <button
                              type="button"
                              onClick={handleTtsPlayPause}
                              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                            >
                              {ttsPlaying ? "일시정지" : "오디오 재생"}
                            </button>
                          ) : (
                            <div className="text-xs text-foreground/60">
                              아직 오디오 응답이 없습니다.
                            </div>
                          )}
                        </div>
                      ) : currentConsole.responseJson ? (
                        <div className="mt-3">
                          <div className="mb-2 flex justify-end">
                            <button
                              type="button"
                              onClick={async () => {
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
                              aria-label={
                                consoleCopied ? "응답 복사 완료" : "응답 복사"
                              }
                              title={consoleCopied ? "복사됨" : "복사"}
                              className={[
                                "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                                consoleCopied
                                  ? "border-accent/50 bg-accent/10 text-accent"
                                  : "border-black/[0.08] bg-white text-foreground/70 hover:border-accent/40 hover:text-accent",
                              ].join(" ")}
                            >
                              {consoleCopied ? (
                                <CheckIcon className="h-4 w-4" />
                              ) : (
                                <CopyIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <JsonCode text={currentConsole.responseJson} />
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-foreground/60">
                          아직 응답 데이터가 없습니다.
                        </div>
                      )}
                      </div>
                    </details>

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
                            <span className="text-foreground/80">
                              /api/rerank
                            </span>{" "}
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
                            Playground는 클라이언트에서 파형을 시뮬레이션합니다.
                            위 코드는 Text API와 동일 호스트(51089) 기준 OpenAI
                            호환 음성 합성 예시입니다.
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
                    ) : selectedApi === "voiceClone" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={vcDevCodeOpen}
                        setDevCodeOpen={setVcDevCodeOpen}
                        devCodeCopied={vcDevCodeCopied}
                        setDevCodeCopied={setVcDevCodeCopied}
                        codePython={vcDevCodePython}
                        footer={
                          <>
                            multipart Voice Clone 예시입니다. 데모 앱은{" "}
                            <span className="text-foreground/80">
                              /api/voice-clone
                            </span>{" "}
                            프록시를 통해 동일 스펙으로 전달합니다.
                          </>
                        }
                      />
                    ) : selectedApi === "image2text" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={image2textDevCodeOpen}
                        setDevCodeOpen={setImage2TextDevCodeOpen}
                        devCodeCopied={image2textDevCodeCopied}
                        setDevCodeCopied={setImage2TextDevCodeCopied}
                        codePython={image2textDevCodePython}
                        footer={
                          <>
                            이미지를 base64로 인코딩하여 vLLM Vision API로 전송합니다.
                            데모 앱은{" "}
                            <span className="text-foreground/80">
                              /api/image2text
                            </span>{" "}
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

                    {(selectedApi === "llm" && isChatLoading) ||
                    (selectedApi === "embedding" && isEmbeddingLoading) ||
                    (selectedApi === "reranker" && isRerankLoading) ||
                    (selectedApi === "stt" && isSttLoading) ? (
                      <div className="rounded-xl border border-accent/25 bg-accent/5 p-3 text-xs text-accent">
                        응답 생성 중... (응답 대기)
                      </div>
                    ) : null}

                    <Link
                      href={`/plans?chapter=${selectedApi}&auto=1`}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
                    >
                      {selectedApiItem?.name ?? "API"} 플랜 보기 →
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {workflowBannerMounted &&
            (selectedApi === "llm" ||
              selectedApi === "reranker" ||
              selectedApi === "embedding" ||
              selectedApi === "tts" ||
              selectedApi === "stt" ||
              selectedApi === "voiceClone" ||
              selectedApi === "image2text" ||
              selectedApi === "t2i" ||
              selectedApi === "t2m") ? (
              <section className="w-full lg:basis-full">
                <div className="rounded-xl border-t border-accent/20 bg-accent/5 px-4 py-3">
                  <div
                    className={[
                      "transition-opacity duration-200",
                      workflowBannerVisible ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  >
                    <div className="mb-3 flex flex-col gap-2 border-b border-white/5 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <p className="text-[12px] leading-relaxed text-foreground/65">
                        테스트가 마음에 드셨다면, 요금제에서 맞는 플랜을 확인해
                        보세요.
                      </p>
                      <Link
                        href={`/plans?chapter=${selectedApi}&auto=1`}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-accent/85"
                        onClick={() => {
                          try {
                            sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify({
                              messages,
                              prompt,
                              llmSystemPrompt,
                              embeddingText,
                              embeddingVector,
                              sttTranscript,
                              image2textResult,
                              image2textPrompt,
                              consoleByApi,
                              rerankQuestion,
                              rerankDocsText,
                              rerankResults,
                              displayedQuery,
                            }));
                          } catch {}
                        }}
                      >
                        플랜 보기 →
                      </Link>
                    </div>
                    {selectedApi === "stt" ? (
                      <p className="text-sm leading-relaxed text-foreground/90">
                        인식된 목소리를 텍스트로 완성! 이제 추출된 내용을{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("llm")}
                          className="font-semibold text-accent underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent-bright"
                        >
                          [LLM]
                        </button>{" "}
                        으로 요약하거나{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("embedding")}
                          className="font-semibold text-accent underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent-bright"
                        >
                          [Embedding]
                        </button>
                        으로 사내 지식 베이스에 저장해보세요.
                      </p>
                    ) : selectedApi === "image2text" ? (
                      <p className="text-sm leading-relaxed text-foreground/90">
                        이미지에서 텍스트 추출 완료! 이제 추출된 내용을{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("llm")}
                          className="font-semibold text-accent underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent-bright"
                        >
                          [LLM]
                        </button>{" "}
                        으로 분석하거나{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("embedding")}
                          className="font-semibold text-accent underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent-bright"
                        >
                          [Embedding]
                        </button>
                        으로 사내 지식 베이스에 저장해보세요.
                      </p>
                    ) : selectedApi === "t2i" ? (
                      <p className="text-sm leading-relaxed text-foreground/90">
                        이미지 생성 완료! 결과 이미지를 기반으로{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("llm")}
                          className="font-semibold text-accent underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent-bright"
                        >
                          [LLM]
                        </button>
                        으로 설명 문구를 작성해보세요.
                      </p>
                    ) : selectedApi === "t2m" ? (
                      <p className="text-sm leading-relaxed text-foreground/90">
                        음악이 완성됐습니다!{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("tts")}
                          className="font-semibold text-accent underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent-bright"
                        >
                          [TTS]
                        </button>
                        로 나레이션을 더하거나{" "}
                        <button
                          type="button"
                          onClick={() => moveToApiDetail("llm")}
                          className="font-semibold text-accent underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent-bright"
                        >
                          [LLM]
                        </button>
                        으로 가사와 설명 문구를 작성해보세요.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      {t2iComingSoonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-black/[0.08] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">
              Image Generation API는 서버 안정화 후 제공될 예정입니다.
              <br />
              준비가 끝나면 바로 테스트할 수 있게 열어두겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setT2iComingSoonOpen(false)}
              className="mt-6 w-full rounded-xl bg-[#08090d] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              확인
            </button>
          </div>
        </div>
      )}

    </PlatformShell>
  );
}
