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
import { DEFAULT_AD_COPY_LANGUAGE } from "@/lib/adCopyLanguages";
import { getApis, getMe, type Api, type User } from "@/lib/api";
import { SiteNav } from "@/components/SiteNav";
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
import { buildAdCopyDevCodePython } from "./lib/buildAdCopyDevCodePython";
import { buildSummarizeDevCodePython } from "./lib/buildSummarizeDevCodePython";
import { buildSentimentDevCodePython } from "./lib/buildSentimentDevCodePython";
import { buildNerDevCodePython } from "./lib/buildNerDevCodePython";
import { buildTextToSqlDevCodePython } from "./lib/buildTextToSqlDevCodePython";
import { buildVoiceCloneDevCodePython } from "./lib/buildVoiceCloneDevCodePython";
import { buildImage2TextDevCodePython } from "./lib/buildImage2TextDevCodePython";
import type {
  NerPayload,
  SentimentAnalysisPayload,
  TextToSqlPayload,
} from "./lib/types";
import { useResultTriggeredBanner } from "./hooks/useResultTriggeredBanner";
import {
  getApiTask,
  getPlanTaskSublabel,
  type PlanTask,
} from "@/app/plans/planCatalog";

type ApiId =
  | "llm"
  | "adCopy"
  | "summarize"
  | "sentiment"
  | "ner"
  | "textToSql"
  | "embedding"
  | "reranker"
  | "tts"
  | "stt"
  | "voiceClone"
  | "image2text";

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

const DEFAULT_AD_COPY_BRIEF =
  "신제품 커피 머신 — 집에서 캡슐 커피 한 잔, 아침 루틴에 맞춘 광고 카피";

const DEFAULT_SUMMARY_TEXT = `지난 분기 고객 리뷰와 내부 VOC를 종합한 결과, 배송 지연에 대한 불만이 전년 대비 약 18% 증가했으며, 특히 주말 주문 건에서 체감이 컸습니다. 반면 제품 품질·포장 만족도는 92% 수준으로 유지되었고, 교환·환불 절차에 대한 긍정 평가도 높았습니다. 운영팀은 물류 파트너와의 캐파 조정 및 피크 시간대 알림을 강화하기로 했고, 고객 커뮤니케이션 템플릿은 '지연 사유·예상 도착'을 한 번에 안내하도록 개편합니다. 다음 스프린트에서는 실시간 배송 추적 API 연동과 CS 자동 분류(감성·토픽) 파일럿을 진행할 예정입니다.`;

const DEFAULT_SENTIMENT_TEXT =
  "치킨은 맛있는데 배송이 1시간 넘게 걸렸어요. 포장은 괜찮았어요.";

const DEFAULT_NER_TEXT = `내일 오후 2시에 세현님과 영등포 코그로보 사무실에서 3,000,000원 규모의 프로젝트 계약건으로 미팅이 있습니다.`;
const DEFAULT_NER_INSTRUCTION =
  "예: 인물과 장소만 우선 추출해줘 / 금액과 날짜를 빠짐없이 표시해줘";

const DEFAULT_TEXT_TO_SQL_TEXT = `최근 일주일 동안 PROTOCL 앱에서 루틴을 10번 이상 완료한 유저 수 알려줘.`;
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

function IconUser(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
      <path d="M4 20a8 8 0 0116 0" />
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

function IconVoiceClone(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M9 11a4 4 0 100-8 4 4 0 000 8z" />
      <path d="M3 20a6 6 0 0112 0" />
      <path d="M17 9c1.5 1.5 1.5 4.5 0 6" />
      <path d="M20 7c3 3 3 7 0 10" />
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

function IconX(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </IconBase>
  );
}

function IconImage(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
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

function IconPenLine(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </IconBase>
  );
}

function IconTextSummary(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M5 8h14" />
      <path d="M5 12h10" />
      <path d="M5 16h6" />
    </IconBase>
  );
}

function IconSentiment(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <circle cx="12" cy="12" r="10" />
    </IconBase>
  );
}

function IconTag(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 2H2v10l9.29 9.29a1 1 0 001.41 0l6.59-6.59a1 1 0 000-1.41L12 2z" />
      <path d="M7 7h.01" />
    </IconBase>
  );
}

function IconDatabase(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
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

function buildAdCopyConsoleRequestJson(
  brief: string,
  tone: string,
  channel: string,
  temperature: number,
  language: string,
) {
  return JSON.stringify(
    {
      brief,
      tone,
      channel,
      temperature,
      language,
    },
    null,
    2,
  );
}

function tryParseAdCopyConsoleToPlayground(jsonText: string): {
  brief?: string;
  tone?: string;
  channel?: string;
  temperature?: number;
  language?: string;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      brief?: unknown;
      tone?: unknown;
      channel?: unknown;
      temperature?: unknown;
      language?: unknown;
    };
    const out: {
      brief?: string;
      tone?: string;
      channel?: string;
      temperature?: number;
      language?: string;
    } = {};

    if (typeof parsed.brief === "string") out.brief = parsed.brief;
    if (typeof parsed.tone === "string") out.tone = parsed.tone;
    if (typeof parsed.channel === "string") out.channel = parsed.channel;
    if (typeof parsed.language === "string") out.language = parsed.language;
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

    return out;
  } catch {
    return null;
  }
}

function buildSummarizeConsoleRequestJson(
  text: string,
  style: string,
  temperature: number,
) {
  return JSON.stringify(
    {
      text,
      style,
      temperature,
    },
    null,
    2,
  );
}

function tryParseSummarizeConsoleToPlayground(jsonText: string): {
  text?: string;
  style?: string;
  temperature?: number;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      text?: unknown;
      style?: unknown;
      styleLine?: unknown;
      temperature?: unknown;
    };
    const out: {
      text?: string;
      style?: string;
      temperature?: number;
    } = {};

    if (typeof parsed.text === "string") out.text = parsed.text;
    if (typeof parsed.style === "string") out.style = parsed.style;
    else if (typeof parsed.styleLine === "string") out.style = parsed.styleLine;
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

    return out;
  } catch {
    return null;
  }
}

function buildSentimentConsoleRequestJson(text: string, temperature: number) {
  return JSON.stringify(
    {
      text,
      temperature,
    },
    null,
    2,
  );
}

function tryParseSentimentConsoleToPlayground(jsonText: string): {
  text?: string;
  temperature?: number;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      text?: unknown;
      temperature?: unknown;
    };
    const out: {
      text?: string;
      temperature?: number;
    } = {};

    if (typeof parsed.text === "string") out.text = parsed.text;
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

    return out;
  } catch {
    return null;
  }
}

function buildNerConsoleRequestJson(
  text: string,
  temperature: number,
  prompt = "",
) {
  return JSON.stringify(
    {
      text,
      ...(prompt.trim() ? { prompt } : {}),
      temperature,
    },
    null,
    2,
  );
}

function tryParseNerConsoleToPlayground(jsonText: string): {
  text?: string;
  prompt?: string;
  temperature?: number;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      text?: unknown;
      prompt?: unknown;
      temperature?: unknown;
    };
    const out: {
      text?: string;
      prompt?: string;
      temperature?: number;
    } = {};

    if (typeof parsed.text === "string") out.text = parsed.text;
    if (typeof parsed.prompt === "string") out.prompt = parsed.prompt;
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

    return out;
  } catch {
    return null;
  }
}

function buildTextToSqlConsoleRequestJson(
  text: string,
  ddl: string,
  temperature: number,
) {
  return JSON.stringify(
    {
      text,
      ...(ddl.trim() ? { ddl: ddl.trim() } : {}),
      temperature,
    },
    null,
    2,
  );
}

function tryParseTextToSqlConsoleToPlayground(jsonText: string): {
  text?: string;
  ddl?: string;
  temperature?: number;
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      text?: unknown;
      ddl?: unknown;
      temperature?: unknown;
    };
    const out: {
      text?: string;
      ddl?: string;
      temperature?: number;
    } = {};

    if (typeof parsed.text === "string") out.text = parsed.text;
    if (typeof parsed.ddl === "string") out.ddl = parsed.ddl;
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
        name: "Text",
        description: "프롬프트 기반 텍스트 생성",
      },
      {
        id: "adCopy",
        name: "Ad Copy",
        description: "광고 카피라이팅 생성 (자사 NLP 엔진)",
      },
      {
        id: "summarize",
        name: "Text Summary",
        description: "긴 문서·리뷰를 핵심만 압축 요약 (자사 NLP 엔진)",
      },
      {
        id: "sentiment",
        name: "Sentiment",
        description: "리뷰 감정 분석 · 측면별 긍·부정·점수 (자사 NLP 엔진)",
      },
      {
        id: "ner",
        name: "NER",
        description:
          "개체명 인식 · 인물·장소·시간·금액 등 추출 (자사 NLP 엔진)",
      },
      {
        id: "textToSql",
        name: "Text-to-SQL",
        description: "자연어 질문을 SQL로 변환 · 분석·리포트 질의 (자사 엔진)",
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
        name: "Image2Text",
        description: "이미지 분석 및 텍스트 추출 (OCR)",
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
  const comingSoonTimerRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const api = params.get("api");
    const view = params.get("view");

    if (
      api === "llm" ||
      api === "adCopy" ||
      api === "summarize" ||
      api === "sentiment" ||
      api === "ner" ||
      api === "textToSql" ||
      api === "embedding" ||
      api === "reranker" ||
      api === "tts" ||
      api === "stt" ||
      api === "voiceClone" ||
      api === "image2text"
    ) {
      setSelectedApi(api);
      // 홈 카드에서 들어올 때는 바로 해당 챕터 상세를 보여줌
      setViewMode(view === "list" ? "list" : "detail");
    }
  }, []);

  const [isChatLoading, setIsChatLoading] = useState(false);
  const pendingAssistantIdRef = useRef<string | null>(null);

  const [adCopyBrief, setAdCopyBrief] = useState(DEFAULT_AD_COPY_BRIEF);
  const [adCopyTone, setAdCopyTone] = useState("");
  const [adCopyChannel, setAdCopyChannel] = useState("");
  const [adCopyLanguage, setAdCopyLanguage] = useState(
    DEFAULT_AD_COPY_LANGUAGE,
  );
  const [adCopyTemperature, setAdCopyTemperature] = useState(0.7);
  const [adCopyResult, setAdCopyResult] = useState<string | null>(null);
  const [isAdCopyLoading, setIsAdCopyLoading] = useState(false);
  const [adCopyDevCodeOpen, setAdCopyDevCodeOpen] = useState(false);
  const [adCopyDevCodeCopied, setAdCopyDevCodeCopied] = useState(false);

  const [summarizeText, setSummarizeText] = useState(DEFAULT_SUMMARY_TEXT);
  const [summarizeStyle, setSummarizeStyle] = useState("");
  const [summarizeTemperature, setSummarizeTemperature] = useState(0.3);
  const [summarizeResult, setSummarizeResult] = useState<string | null>(null);
  const [isSummarizeLoading, setIsSummarizeLoading] = useState(false);
  const [summarizeDevCodeOpen, setSummarizeDevCodeOpen] = useState(false);
  const [summarizeDevCodeCopied, setSummarizeDevCodeCopied] = useState(false);

  const [sentimentText, setSentimentText] = useState(DEFAULT_SENTIMENT_TEXT);
  const [sentimentTemperature, setSentimentTemperature] = useState(0.2);
  const [sentimentAnalysis, setSentimentAnalysis] =
    useState<SentimentAnalysisPayload | null>(null);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);
  const [sentimentDevCodeOpen, setSentimentDevCodeOpen] = useState(false);
  const [sentimentDevCodeCopied, setSentimentDevCodeCopied] = useState(false);

  const [nerText, setNerText] = useState(DEFAULT_NER_TEXT);
  const [nerPrompt, setNerPrompt] = useState("");
  const [nerTemperature, setNerTemperature] = useState(0.1);
  const [nerResult, setNerResult] = useState<NerPayload | null>(null);
  const [nerError, setNerError] = useState<string | null>(null);
  const [isNerLoading, setIsNerLoading] = useState(false);
  const [nerDevCodeOpen, setNerDevCodeOpen] = useState(false);
  const [nerDevCodeCopied, setNerDevCodeCopied] = useState(false);

  const [textToSqlText, setTextToSqlText] = useState(DEFAULT_TEXT_TO_SQL_TEXT);
  const [textToSqlDdl, setTextToSqlDdl] = useState("");
  const [textToSqlTemperature, setTextToSqlTemperature] = useState(0.2);
  const [textToSqlResult, setTextToSqlResult] =
    useState<TextToSqlPayload | null>(null);
  const [textToSqlError, setTextToSqlError] = useState<string | null>(null);
  const [isTextToSqlLoading, setIsTextToSqlLoading] = useState(false);
  const [textToSqlDevCodeOpen, setTextToSqlDevCodeOpen] = useState(false);
  const [textToSqlDevCodeCopied, setTextToSqlDevCodeCopied] = useState(false);

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
      if (api === "adCopy") {
        return buildAdCopyConsoleRequestJson(
          DEFAULT_AD_COPY_BRIEF,
          "",
          "",
          0.7,
          DEFAULT_AD_COPY_LANGUAGE,
        );
      }
      if (api === "summarize") {
        return buildSummarizeConsoleRequestJson(DEFAULT_SUMMARY_TEXT, "", 0.3);
      }
      if (api === "sentiment") {
        return buildSentimentConsoleRequestJson(DEFAULT_SENTIMENT_TEXT, 0.2);
      }
      if (api === "ner") {
        return buildNerConsoleRequestJson(DEFAULT_NER_TEXT, 0.1);
      }
      if (api === "textToSql") {
        return buildTextToSqlConsoleRequestJson(
          DEFAULT_TEXT_TO_SQL_TEXT,
          "",
          0.2,
        );
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
      adCopy: createDefaultConsoleState("adCopy"),
      summarize: createDefaultConsoleState("summarize"),
      sentiment: createDefaultConsoleState("sentiment"),
      ner: createDefaultConsoleState("ner"),
      textToSql: createDefaultConsoleState("textToSql"),
      embedding: createDefaultConsoleState("embedding"),
      reranker: createDefaultConsoleState("reranker"),
      tts: createDefaultConsoleState("tts"),
      stt: createDefaultConsoleState("stt"),
      voiceClone: createDefaultConsoleState("voiceClone"),
      image2text: createDefaultConsoleState("image2text"),
    }),
  );
  const [consoleCopied, setConsoleCopied] = useState<boolean>(false);
  const [consoleSubmitShake, setConsoleSubmitShake] = useState(false);

  const [devCodeOpen, setDevCodeOpen] = useState(false);
  const [devCodeCopied, setDevCodeCopied] = useState(false);

  type MarketplaceTask =
    | "Text Generation"
    | "Ad Copy"
    | "Text Summary"
    | "Sentiment Analysis"
    | "NER"
    | "Text-to-SQL"
    | "Embedding"
    | "Reranker"
    | "TTS"
    | "STT"
    | "Voice Clone"
    | "Vision";
  type LibraryFormat = "Transformers" | "GGUF" | "vLLM" | "ONNX";

  type MarketplaceItem = {
    id: string;
    task: MarketplaceTask;
    apiId?: ApiId;
    model: string;
    modelSizeB: number;
    taskTags: string[]; // e.g. ["LLM", "Text-Gen"]
    formats: LibraryFormat[]; // filterable formats
  };

  const marketplaceItems: MarketplaceItem[] = useMemo(
    () => [
      {
        id: "Qwen/Qwen3.6-35B-A3B",
        task: "Text Generation",
        apiId: "llm",
        model: "Text",
        modelSizeB: 120,
        taskTags: ["LLM", "Text-Gen"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "ad-copy-modu-nlp",
        task: "Ad Copy",
        apiId: "adCopy",
        model: "Ad Copy",
        modelSizeB: 120,
        taskTags: ["Ad-Copy", "Marketing"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "text-summary-modu-nlp",
        task: "Text Summary",
        apiId: "summarize",
        model: "Text Summary",
        modelSizeB: 120,
        taskTags: ["Summary", "NLP"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "review-sentiment-modu-nlp",
        task: "Sentiment Analysis",
        apiId: "sentiment",
        model: "Sentiment",
        modelSizeB: 120,
        taskTags: ["Sentiment", "Reviews"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "ner-modu-nlp",
        task: "NER",
        apiId: "ner",
        model: "NER",
        modelSizeB: 120,
        taskTags: ["NER", "NLP"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "text-to-sql-modu-nlp",
        task: "Text-to-SQL",
        apiId: "textToSql",
        model: "Text-to-SQL",
        modelSizeB: 120,
        taskTags: ["Text-to-SQL", "SQL", "Analytics"],
        formats: ["vLLM", "Transformers", "ONNX"],
      },
      {
        id: "embedding-70b",
        task: "Embedding",
        apiId: "embedding",
        model: "Embedding",
        modelSizeB: 8,
        taskTags: ["Embedding", "Semantic-Search"],
        formats: ["Transformers", "ONNX"],
      },
      {
        id: "reranker-8b",
        task: "Reranker",
        apiId: "reranker",
        model: "Reranker",
        modelSizeB: 8,
        taskTags: ["Reranker", "Qwen3", "Search-Quality"],
        formats: ["GGUF", "Transformers"],
      },
      {
        id: "tts-13b",
        task: "TTS",
        apiId: "tts",
        model: "TTS",
        modelSizeB: 13,
        taskTags: ["TTS", "Audio"],
        formats: ["vLLM", "ONNX"],
      },
      {
        id: "stt-13b",
        task: "STT",
        apiId: "stt",
        model: "STT",
        modelSizeB: 13,
        taskTags: ["STT", "Transcription"],
        formats: ["ONNX"],
      },
      {
        id: "voice-clone-modu",
        task: "Voice Clone",
        apiId: "voiceClone",
        model: "Voice Clone",
        modelSizeB: 13,
        taskTags: ["VoiceClone", "Audio"],
        formats: ["ONNX"],
      },
      {
        id: "image2text",
        task: "Vision",
        apiId: "image2text",
        model: "Image2Text",
        modelSizeB: 35,
        taskTags: ["Vision", "OCR", "Multimodal"],
        formats: ["vLLM"],
      },
    ],
    [],
  );

  const [filterTasks, setFilterTasks] = useState<
    Record<MarketplaceTask, boolean>
  >({
    "Text Generation": true,
    "Ad Copy": true,
    "Text Summary": true,
    "Sentiment Analysis": true,
    NER: true,
    "Text-to-SQL": true,
    Embedding: true,
    Reranker: true,
    TTS: true,
    STT: true,
    "Voice Clone": true,
    Vision: true,
  });
  const [sidebarMode, setSidebarMode] = useState<"all" | "my">("all");
  /** 목록 → 상세 진입 직전의 Tasks 필터(복귀 시 복원). 상세 내 API 전환(moveToApiDetail)에서는 갱신하지 않음 */
  const listViewFilterSnapshotRef = useRef<{
    filterTasks: Record<MarketplaceTask, boolean>;
    sidebarMode: "all" | "my";
  } | null>(null);
  const [apisFromBackend, setApisFromBackend] = useState<Api[]>([]);
  const [userMe, setUserMe] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apis = await getApis();
        const active = apis.filter((a) => a.is_active !== false);
        const sorted = [...active].sort(
          (a, b) =>
            (a.sort_order ?? Number.MAX_SAFE_INTEGER) -
            (b.sort_order ?? Number.MAX_SAFE_INTEGER),
        );
        if (!cancelled) setApisFromBackend(sorted);
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

  const taskKeys = useMemo<MarketplaceTask[]>(
    () => [
      "Text Generation",
      "Ad Copy",
      "Text Summary",
      "Sentiment Analysis",
      "NER",
      "Text-to-SQL",
      "Embedding",
      "Reranker",
      "TTS",
      "STT",
      "Voice Clone",
      "Vision",
    ],
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const taskParam = params.get("task")?.toLowerCase() ?? null;
    if (!taskParam) return;

    const targetTask: MarketplaceTask | null =
      taskParam === "llm" || taskParam === "text"
        ? "Text Generation"
        : taskParam === "adcopy" || taskParam === "ad-copy"
          ? "Ad Copy"
          : taskParam === "summarize" ||
              taskParam === "summary" ||
              taskParam === "text-summary"
            ? "Text Summary"
            : taskParam === "sentiment" ||
                taskParam === "review-sentiment" ||
                taskParam === "감정"
              ? "Sentiment Analysis"
              : taskParam === "ner" ||
                  taskParam === "named-entity" ||
                  taskParam === "개체명"
                ? "NER"
                : taskParam === "text-to-sql" ||
                    taskParam === "texttosql" ||
                    taskParam === "nl2sql" ||
                    taskParam === "쿼리"
                  ? "Text-to-SQL"
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
                              : null;

    if (!targetTask) return;

    setViewMode("list");
    setSidebarMode("all");
    setFilterTasks((prev) => {
      const next = { ...prev };
      taskKeys.forEach((k) => {
        next[k] = k === targetTask;
      });
      return next;
    });

    if (targetTask === "Text Generation") setSelectedApi("llm");
    if (targetTask === "Ad Copy") setSelectedApi("adCopy");
    if (targetTask === "Text Summary") setSelectedApi("summarize");
    if (targetTask === "Sentiment Analysis") setSelectedApi("sentiment");
    if (targetTask === "NER") setSelectedApi("ner");
    if (targetTask === "Text-to-SQL") setSelectedApi("textToSql");
    if (targetTask === "Embedding") setSelectedApi("embedding");
    if (targetTask === "Reranker") setSelectedApi("reranker");
    if (targetTask === "TTS") setSelectedApi("tts");
    if (targetTask === "STT") setSelectedApi("stt");
    if (targetTask === "Voice Clone") setSelectedApi("voiceClone");
    if (targetTask === "Vision") setSelectedApi("image2text");
  }, [taskKeys]);

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
          return next;
        });
      }
      setViewMode("list");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [viewMode, taskKeys]);

  function resolveMarketplacePlan(item: MarketplaceItem) {
    const task = item.task as PlanTask;
    const api = apisFromBackend.find((a) => getApiTask(a) === task);
    if (!api) return null;
    return userMe?.api_plans?.find((p) => p.api_id === api.id) ?? null;
  }

  const filteredMarketplace = useMemo(() => {
    const filtered = marketplaceItems.filter((item) => {
      // 서버에서 API 목록을 받은 경우:
      // - 서버에 존재하지 않는(매칭 불가) 정적 카드는 숨김
      // - 서버에서 비활성(is_active:false)로 내려온 API도 숨김
      if (apisFromBackend.length > 0) {
        const task = item.task as PlanTask;
        const api = apisFromBackend.find((a) => getApiTask(a) === task);
        if (!api) return false;
        if (api.is_active === false) return false;
      }
      if (sidebarMode === "my") {
        const plan = resolveMarketplacePlan(item);
        return plan != null;
      }
      return filterTasks[item.task];
    });

    // 목록 순서를 서버 `sort_order` 기준으로 맞춤
    // (같은 `sort_order`면 기존 정적 배열 순서를 유지)
    if (apisFromBackend.length === 0) return filtered;

    const orderByTask = new Map<PlanTask, number>();
    apisFromBackend.forEach((api) => {
      const task = getApiTask(api);
      if (!task) return;
      if (api.is_active === false) return;
      orderByTask.set(
        task,
        api.sort_order ?? Number.MAX_SAFE_INTEGER,
      );
    });

    return [...filtered].sort((a, b) => {
      const ao =
        orderByTask.get(a.task as PlanTask) ?? Number.MAX_SAFE_INTEGER;
      const bo =
        orderByTask.get(b.task as PlanTask) ?? Number.MAX_SAFE_INTEGER;
      return ao - bo;
    });
  }, [filterTasks, marketplaceItems, sidebarMode, apisFromBackend, userMe]);

  const allTasksFilterOn = taskKeys.every((t) => filterTasks[t]);
  const isAllTasksActive = sidebarMode === "all" && allTasksFilterOn;

  const activeTaskKey = useMemo(() => {
    if (sidebarMode === "my") return "My";
    if (allTasksFilterOn) return "All";
    const active = taskKeys.find((t) => filterTasks[t]);
    if (!active) return "All";
    if (active === "Text Generation") return "Text";
    if (active === "Ad Copy") return "AdCopy";
    if (active === "Text Summary") return "TextSummary";
    if (active === "Sentiment Analysis") return "SentimentAnalysis";
    if (active === "NER") return "NERTask";
    if (active === "Text-to-SQL") return "TextToSqlTask";
    if (active === "Embedding") return "Embedding";
    if (active === "Reranker") return "Rerank";
    if (active === "TTS") return "TTS";
    if (active === "STT") return "STT";
    if (active === "Voice Clone") return "VoiceClone";
    if (active === "Vision") return "Vision";
    return "All";
  }, [filterTasks, sidebarMode, allTasksFilterOn, taskKeys]);

  function renderTaskGuide() {
    switch (activeTaskKey) {
      case "All":
        return (
          <>
            입점된 다양한 API 모델의 성능을 실시간으로 테스트해 볼 수 있는
            체험존입니다. 🚀
          </>
        );
      case "My":
        return (
          <>
            <span className="text-accent font-semibold">내 구독(My)</span>:
            플랜에서 구매한 API만 모아서 볼 수 있습니다. 로그인 후 구독이 있으면
            카드에 현재 플랜이 표시됩니다.
          </>
        );
      case "Text":
        return (
          <>
            ✨{" "}
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
      case "AdCopy":
        return (
          <>
            ✍️{" "}
            <span className="text-accent font-semibold">광고·마케팅 카피</span>:
            브리프·톤·채널에 맞춰{" "}
            <span className="text-accent font-semibold">배너·SNS 등 문구</span>
            를 생성하는 자사 자연어 처리 엔진 기반 서비스입니다.
          </>
        );
      case "TextSummary":
        return (
          <>
            📄 <span className="text-accent font-semibold">텍스트 요약</span>:
            리뷰·뉴스·회의록 등 긴 본문에서{" "}
            <span className="text-accent font-semibold">
              핵심만 추려 짧게 압축
            </span>
            하는 자사 자연어 처리 엔진 기반 서비스입니다.
          </>
        );
      case "SentimentAnalysis":
        return (
          <>
            💬 <span className="text-accent font-semibold">리뷰 감정 분석</span>
            : 긍·부정·중립과{" "}
            <span className="text-accent font-semibold">측면별 점수</span>로
            브랜드 평판·이슈를 빠르게 파악하는 자사 자연어 처리 엔진 기반
            서비스입니다.
          </>
        );
      case "NERTask":
        return (
          <>
            🏷️{" "}
            <span className="text-accent font-semibold">개체명 인식 (NER)</span>
            : 인물·장소·시간·금액 등을{" "}
            <span className="text-accent font-semibold">
              label·category로 정형 추출
            </span>
            하는 자사 자연어 처리 엔진 기반 서비스입니다.
          </>
        );
      case "TextToSqlTask":
        return (
          <>
            🗄️{" "}
            <span className="text-accent font-semibold">
              Text-to-SQL (쿼리 자동 생성)
            </span>
            : 기획·마케팅 질문을{" "}
            <span className="text-accent font-semibold">MySQL 호환 SELECT</span>
            로 바꿔 주는 자사 자연어 처리 엔진 기반 서비스입니다.
          </>
        );
      case "Embedding":
        return (
          <>
            🔍{" "}
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
            🎯{" "}
            <span className="text-accent font-semibold">검색 결과 최적화</span>:
            단순 검색을 넘어, 사용자의 의도에 가장 가까운 순서로{" "}
            <span className="text-accent font-semibold">정확도를 극대화</span>
            하여 정렬합니다.
          </>
        );
      case "TTS":
        return (
          <>
            🔊{" "}
            <span className="text-accent font-semibold">텍스트 → 음성 합성</span>:
            입력한 문장을 선택한{" "}
            <span className="text-accent font-semibold">화자·언어</span>로
            자연스럽게 읽어주는 고품질 TTS 서비스입니다.
          </>
        );
      case "STT":
        return (
          <>
            🎙️{" "}
            <span className="text-accent font-semibold">음성 → 텍스트 변환</span>:
            녹음 파일이나 마이크 입력을{" "}
            <span className="text-accent font-semibold">텍스트로 변환</span>하는
            Qwen3-STT 기반 서비스입니다.
          </>
        );
      case "VoiceClone":
        return (
          <>
            🎭 <span className="text-accent font-semibold">보이스 클론</span>:
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
            🖼️{" "}
            <span className="text-accent font-semibold">이미지 분석 (Image2Text)</span>:
            이미지를 업로드하면{" "}
            <span className="text-accent font-semibold">
              내용 설명과 텍스트 추출
            </span>
            을 동시에 수행합니다.
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
      listViewFilterSnapshotRef.current = {
        filterTasks: { ...filterTasks },
        sidebarMode,
      };
      setSelectedApi(item.apiId);
      setViewMode("detail");
      window.history.pushState({ apiTestDetail: true }, "", window.location.href);
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

  const adCopyDevCodePython = useMemo(
    () =>
      buildAdCopyDevCodePython({
        brief: adCopyBrief,
        tone: adCopyTone,
        channel: adCopyChannel,
        temperature: adCopyTemperature,
        language: adCopyLanguage,
      }),
    [adCopyBrief, adCopyTone, adCopyChannel, adCopyTemperature, adCopyLanguage],
  );

  const summarizeDevCodePython = useMemo(
    () =>
      buildSummarizeDevCodePython({
        text: summarizeText,
        style: summarizeStyle,
        temperature: summarizeTemperature,
      }),
    [summarizeText, summarizeStyle, summarizeTemperature],
  );

  const sentimentDevCodePython = useMemo(
    () =>
      buildSentimentDevCodePython({
        text: sentimentText,
        temperature: sentimentTemperature,
      }),
    [sentimentText, sentimentTemperature],
  );

  const nerDevCodePython = useMemo(
    () =>
      buildNerDevCodePython({
        text: nerText,
        temperature: nerTemperature,
      }),
    [nerText, nerTemperature],
  );

  const textToSqlDevCodePython = useMemo(
    () =>
      buildTextToSqlDevCodePython({
        text: textToSqlText,
        ddl: textToSqlDdl,
        temperature: textToSqlTemperature,
      }),
    [textToSqlDdl, textToSqlText, textToSqlTemperature],
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

  const vcDevCodePython = useMemo(
    () =>
      buildVoiceCloneDevCodePython({
        text: vcText,
        language: vcLanguage,
        xVectorOnly: vcXVectorOnly,
        refText: vcRefText,
      }),
    [vcText, vcLanguage, vcXVectorOnly, vcRefText],
  );

  const image2textDevCodePython = useMemo(
    () =>
      buildImage2TextDevCodePython({
        prompt: image2textPrompt || DEFAULT_IMAGE2TEXT_PROMPT,
        temperature: 0.1,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [image2textPrompt],
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

  const adCopyHasWorkflowResult =
    typeof adCopyResult === "string" && adCopyResult.trim().length > 0;

  const summarizeHasWorkflowResult =
    typeof summarizeResult === "string" && summarizeResult.trim().length > 0;

  const sentimentHasWorkflowResult =
    sentimentAnalysis !== null && !sentimentError;

  const nerHasWorkflowResult = nerResult !== null && !nerError;

  const textToSqlHasWorkflowResult =
    textToSqlResult !== null && !textToSqlError;

  const hasWorkflowBannerResult =
    (selectedApi === "llm" && llmHasWorkflowResult) ||
    (selectedApi === "adCopy" && adCopyHasWorkflowResult) ||
    (selectedApi === "summarize" && summarizeHasWorkflowResult) ||
    (selectedApi === "sentiment" && sentimentHasWorkflowResult) ||
    (selectedApi === "ner" && nerHasWorkflowResult) ||
    (selectedApi === "textToSql" && textToSqlHasWorkflowResult) ||
    (selectedApi === "embedding" && embeddingHasWorkflowResult) ||
    (selectedApi === "reranker" && rerankerHasWorkflowResult) ||
    (selectedApi === "tts" && ttsHasWorkflowResult) ||
    (selectedApi === "stt" && sttHasWorkflowResult) ||
    (selectedApi === "voiceClone" && Boolean(vcAudioUrl)) ||
    (selectedApi === "image2text" && Boolean(image2textResult));

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

  function taskIcon(task: MarketplaceTask) {
    const base = "h-4 w-4";
    switch (task) {
      case "Text Generation":
        return <IconSparkles className={base} />;
      case "Ad Copy":
        return <IconPenLine className={base} />;
      case "Text Summary":
        return <IconTextSummary className={base} />;
      case "Sentiment Analysis":
        return <IconSentiment className={base} />;
      case "NER":
        return <IconTag className={base} />;
      case "Text-to-SQL":
        return <IconDatabase className={base} />;
      case "Embedding":
        return <IconLayers className={base} />;
      case "Reranker":
        return <IconShuffle className={base} />;
      case "TTS":
        return <IconVolume2 className={base} />;
      case "STT":
        return <IconMic className={base} />;
      case "Voice Clone":
        return <IconVoiceClone className={base} />;
      case "Vision":
        return <IconImage className={base} />;
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
    const nextRequestJson = buildAdCopyConsoleRequestJson(
      adCopyBrief,
      adCopyTone,
      adCopyChannel,
      adCopyTemperature,
      adCopyLanguage,
    );
    setConsoleByApi((prev) => {
      if (prev.adCopy.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        adCopy: {
          ...prev.adCopy,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [
    adCopyBrief,
    adCopyTone,
    adCopyChannel,
    adCopyTemperature,
    adCopyLanguage,
  ]);

  useEffect(() => {
    const nextRequestJson = buildSummarizeConsoleRequestJson(
      summarizeText,
      summarizeStyle,
      summarizeTemperature,
    );
    setConsoleByApi((prev) => {
      if (prev.summarize.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        summarize: {
          ...prev.summarize,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [summarizeText, summarizeStyle, summarizeTemperature]);

  useEffect(() => {
    const nextRequestJson = buildSentimentConsoleRequestJson(
      sentimentText,
      sentimentTemperature,
    );
    setConsoleByApi((prev) => {
      if (prev.sentiment.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        sentiment: {
          ...prev.sentiment,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [sentimentText, sentimentTemperature]);

  useEffect(() => {
    const nextRequestJson = buildNerConsoleRequestJson(
      nerText,
      nerTemperature,
      nerPrompt,
    );
    setConsoleByApi((prev) => {
      if (prev.ner.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        ner: {
          ...prev.ner,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [nerPrompt, nerText, nerTemperature]);

  useEffect(() => {
    const nextRequestJson = buildTextToSqlConsoleRequestJson(
      textToSqlText,
      textToSqlDdl,
      textToSqlTemperature,
    );
    setConsoleByApi((prev) => {
      if (prev.textToSql.requestJson === nextRequestJson) return prev;
      return {
        ...prev,
        textToSql: {
          ...prev.textToSql,
          requestJson: nextRequestJson,
        },
      };
    });
  }, [textToSqlDdl, textToSqlText, textToSqlTemperature]);

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
        return "질문이나 요약을 요청해 보세요. (AI API 오마카세 텍스트 코스)";
      case "adCopy":
        return "브리프는 하단 입력에서 수정하세요.";
      case "summarize":
        return "요약할 본문은 하단 입력에서 수정하세요.";
      case "sentiment":
        return "분석할 리뷰는 하단 입력에서 수정하세요.";
      case "ner":
        return "개체를 추출할 문장은 하단 입력에서 수정하세요.";
      case "textToSql":
        return "SQL로 바꿀 자연어 질문은 하단 입력에서 수정하세요.";
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
    });
  }, [llmDevUserMessage, llmSystemPrompt]);

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
    if (selectedApi === "adCopy") {
      const parsed = tryParseAdCopyConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.brief !== undefined) {
        setAdCopyBrief(parsed.brief);
      }
      if (parsed.tone !== undefined) {
        setAdCopyTone(parsed.tone);
      }
      if (parsed.channel !== undefined) {
        setAdCopyChannel(parsed.channel);
      }
      if (parsed.temperature !== undefined) {
        setAdCopyTemperature(parsed.temperature);
      }
      if (parsed.language !== undefined) {
        setAdCopyLanguage(parsed.language);
      }
      return;
    }
    if (selectedApi === "summarize") {
      const parsed = tryParseSummarizeConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.text !== undefined) {
        setSummarizeText(parsed.text);
      }
      if (parsed.style !== undefined) {
        setSummarizeStyle(parsed.style);
      }
      if (parsed.temperature !== undefined) {
        setSummarizeTemperature(parsed.temperature);
      }
      return;
    }
    if (selectedApi === "sentiment") {
      const parsed = tryParseSentimentConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.text !== undefined) {
        setSentimentText(parsed.text);
      }
      if (parsed.temperature !== undefined) {
        setSentimentTemperature(parsed.temperature);
      }
      return;
    }
    if (selectedApi === "ner") {
      const parsed = tryParseNerConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.text !== undefined) {
        setNerText(parsed.text);
      }
      if (parsed.prompt !== undefined) {
        setNerPrompt(parsed.prompt);
      }
      if (parsed.temperature !== undefined) {
        setNerTemperature(parsed.temperature);
      }
      return;
    }
    if (selectedApi === "textToSql") {
      const parsed = tryParseTextToSqlConsoleToPlayground(nextJson);
      if (!parsed) return;
      if (parsed.text !== undefined) {
        setTextToSqlText(parsed.text);
      }
      if (parsed.ddl !== undefined) {
        setTextToSqlDdl(parsed.ddl);
      }
      if (parsed.temperature !== undefined) {
        setTextToSqlTemperature(parsed.temperature);
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
    if (api === "adCopy") {
      setAdCopyBrief(DEFAULT_AD_COPY_BRIEF);
      setAdCopyTone("");
      setAdCopyChannel("");
      setAdCopyLanguage(DEFAULT_AD_COPY_LANGUAGE);
      setAdCopyTemperature(0.7);
      setAdCopyResult(null);
    }
    if (api === "summarize") {
      setSummarizeText(DEFAULT_SUMMARY_TEXT);
      setSummarizeStyle("");
      setSummarizeTemperature(0.3);
      setSummarizeResult(null);
    }
    if (api === "sentiment") {
      setSentimentText(DEFAULT_SENTIMENT_TEXT);
      setSentimentTemperature(0.2);
      setSentimentAnalysis(null);
      setSentimentError(null);
    }
    if (api === "ner") {
      setNerText(DEFAULT_NER_TEXT);
      setNerPrompt("");
      setNerTemperature(0.1);
      setNerResult(null);
      setNerError(null);
    }
    if (api === "textToSql") {
      setTextToSqlText(DEFAULT_TEXT_TO_SQL_TEXT);
      setTextToSqlDdl("");
      setTextToSqlTemperature(0.2);
      setTextToSqlResult(null);
      setTextToSqlError(null);
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
      next["Ad Copy"] = selectedApi === "adCopy";
      next["Text Summary"] = selectedApi === "summarize";
      next["Sentiment Analysis"] = selectedApi === "sentiment";
      next.NER = selectedApi === "ner";
      next["Text-to-SQL"] = selectedApi === "textToSql";
      next.Embedding = selectedApi === "embedding";
      next.Reranker = selectedApi === "reranker";
      next.TTS = selectedApi === "tts";
      next.STT = selectedApi === "stt";
      next["Voice Clone"] = selectedApi === "voiceClone";
      next.Vision = selectedApi === "image2text";
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

  async function handleAdCopyRun() {
    if (isAdCopyLoading) return;
    const brief = adCopyBrief.trim();
    if (!brief) return;
    setIsAdCopyLoading(true);
    setAdCopyResult(null);
    setConsoleCopied(false);
    patchConsole("adCopy", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: buildAdCopyConsoleRequestJson(
        adCopyBrief,
        adCopyTone,
        adCopyChannel,
        adCopyTemperature,
        adCopyLanguage,
      ),
      responseJson: "",
      error: null,
    });
    try {
      const token = getToken();
      const res = await fetch("/api/ad-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          brief,
          tone: adCopyTone.trim() || undefined,
          channel: adCopyChannel.trim() || undefined,
          temperature: adCopyTemperature,
          language: adCopyLanguage,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        copy?: unknown;
        headline?: unknown;
        body?: unknown;
        error?: unknown;
      } | null;
      patchConsole("adCopy", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });
      if (!res.ok) {
        if (res.status === 429) setLimitExceededModalOpen(true);
        setAdCopyResult(
          typeof data?.error === "string" ? data.error : "요청에 실패했습니다.",
        );
        return;
      }
      const copyLegacy =
        typeof data?.copy === "string" ? data.copy.trim() : "";
      const headline =
        typeof data?.headline === "string" ? data.headline.trim() : "";
      const bodyLine =
        typeof data?.body === "string" ? data.body.trim() : "";
      const display =
        copyLegacy ||
        [headline, bodyLine].filter((s) => s.length > 0).join("\n\n");
      setAdCopyResult(display || "응답이 비어있습니다.");
    } catch {
      patchConsole("adCopy", {
        statusLine: "—",
        statusCode: 500,
        responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
      });
      setAdCopyResult("서버 연결에 실패했습니다.");
    } finally {
      setIsAdCopyLoading(false);
    }
  }

  async function handleSummarizeRun() {
    if (isSummarizeLoading) return;
    const text = summarizeText.trim();
    if (!text) return;
    setIsSummarizeLoading(true);
    setSummarizeResult(null);
    setConsoleCopied(false);
    patchConsole("summarize", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: buildSummarizeConsoleRequestJson(
        summarizeText,
        summarizeStyle,
        summarizeTemperature,
      ),
      responseJson: "",
      error: null,
    });
    try {
      const token = getToken();
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          style: summarizeStyle.trim() || undefined,
          temperature: summarizeTemperature,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        summary?: unknown;
        error?: unknown;
      } | null;
      patchConsole("summarize", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });
      if (!res.ok) {
        if (res.status === 429) setLimitExceededModalOpen(true);
        setSummarizeResult(
          typeof data?.error === "string" ? data.error : "요청에 실패했습니다.",
        );
        return;
      }
      const summary =
        typeof data?.summary === "string" ? data.summary.trim() : "";
      setSummarizeResult(summary || "응답이 비어있습니다.");
    } catch {
      patchConsole("summarize", {
        statusLine: "—",
        statusCode: 500,
        responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
      });
      setSummarizeResult("서버 연결에 실패했습니다.");
    } finally {
      setIsSummarizeLoading(false);
    }
  }

  function isSentimentPayload(d: unknown): d is SentimentAnalysisPayload {
    if (!d || typeof d !== "object") return false;
    const o = d as Record<string, unknown>;
    const ov = o.overall;
    if (!ov || typeof ov !== "object") return false;
    const overall = ov as Record<string, unknown>;
    if (
      typeof overall.label !== "string" ||
      typeof overall.score !== "number"
    ) {
      return false;
    }
    if (!Array.isArray(o.aspects)) return false;
    return o.aspects.every((a) => {
      if (!a || typeof a !== "object") return false;
      const x = a as Record<string, unknown>;
      return (
        typeof x.aspect === "string" &&
        typeof x.label === "string" &&
        typeof x.score === "number"
      );
    });
  }

  async function handleSentimentRun() {
    if (isSentimentLoading) return;
    const text = sentimentText.trim();
    if (!text) return;
    setIsSentimentLoading(true);
    setSentimentAnalysis(null);
    setSentimentError(null);
    setConsoleCopied(false);
    patchConsole("sentiment", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: buildSentimentConsoleRequestJson(
        sentimentText,
        sentimentTemperature,
      ),
      responseJson: "",
      error: null,
    });
    try {
      const token = getToken();
      const res = await fetch("/api/sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          temperature: sentimentTemperature,
        }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      patchConsole("sentiment", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });
      if (!res.ok) {
        if (res.status === 429) setLimitExceededModalOpen(true);
        const msg =
          typeof data === "object" &&
          data !== null &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "요청에 실패했습니다.";
        setSentimentError(msg);
        return;
      }
      if (!isSentimentPayload(data)) {
        setSentimentError("응답 형식을 해석하지 못했습니다.");
        return;
      }
      setSentimentAnalysis(data);
    } catch {
      patchConsole("sentiment", {
        statusLine: "—",
        statusCode: 500,
        responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
      });
      setSentimentError("서버 연결에 실패했습니다.");
    } finally {
      setIsSentimentLoading(false);
    }
  }

  function isNerPayload(d: unknown): d is NerPayload {
    if (!d || typeof d !== "object") return false;
    const o = d as Record<string, unknown>;
    if (!Array.isArray(o.entities)) return false;
    return o.entities.every((e) => {
      if (!e || typeof e !== "object") return false;
      const x = e as Record<string, unknown>;
      return (
        typeof x.text === "string" &&
        typeof x.label === "string" &&
        typeof x.category === "string"
      );
    });
  }

  async function handleNerRun() {
    if (isNerLoading) return;
    const text = nerText.trim();
    if (!text) return;
    setIsNerLoading(true);
    setNerResult(null);
    setNerError(null);
    setConsoleCopied(false);
    patchConsole("ner", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: buildNerConsoleRequestJson(
        nerText,
        nerTemperature,
        nerPrompt,
      ),
      responseJson: "",
      error: null,
    });
    try {
      const token = getToken();
      const res = await fetch("/api/ner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          ...(nerPrompt.trim() ? { prompt: nerPrompt.trim() } : {}),
          temperature: nerTemperature,
        }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      patchConsole("ner", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });
      if (!res.ok) {
        if (res.status === 429) setLimitExceededModalOpen(true);
        const msg =
          typeof data === "object" &&
          data !== null &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "요청에 실패했습니다.";
        setNerError(msg);
        return;
      }
      if (!isNerPayload(data)) {
        setNerError("응답 형식을 해석하지 못했습니다.");
        return;
      }
      setNerResult(data);
    } catch {
      patchConsole("ner", {
        statusLine: "—",
        statusCode: 500,
        responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
      });
      setNerError("서버 연결에 실패했습니다.");
    } finally {
      setIsNerLoading(false);
    }
  }

  function isTextToSqlPayload(d: unknown): d is TextToSqlPayload {
    if (!d || typeof d !== "object") return false;
    const o = d as Record<string, unknown>;
    return typeof o.sql === "string" && o.sql.trim().length > 0;
  }

  async function handleTextToSqlRun() {
    if (isTextToSqlLoading) return;
    const text = textToSqlText.trim();
    if (!text) return;
    setIsTextToSqlLoading(true);
    setTextToSqlResult(null);
    setTextToSqlError(null);
    setConsoleCopied(false);
    patchConsole("textToSql", {
      statusCode: null,
      statusLine: "Pending...",
      requestJson: buildTextToSqlConsoleRequestJson(
        textToSqlText,
        textToSqlDdl,
        textToSqlTemperature,
      ),
      responseJson: "",
      error: null,
    });
    try {
      const token = getToken();
      const res = await fetch("/api/text2sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          ...(textToSqlDdl.trim() ? { ddl: textToSqlDdl.trim() } : {}),
          temperature: textToSqlTemperature,
        }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      patchConsole("textToSql", {
        statusCode: res.status,
        statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        responseJson: JSON.stringify(data ?? {}, null, 2),
      });
      if (!res.ok) {
        if (res.status === 429) setLimitExceededModalOpen(true);
        const msg =
          typeof data === "object" &&
          data !== null &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "요청에 실패했습니다.";
        setTextToSqlError(msg);
        return;
      }
      if (!isTextToSqlPayload(data)) {
        setTextToSqlError("응답 형식을 해석하지 못했습니다.");
        return;
      }
      setTextToSqlResult(data);
    } catch {
      patchConsole("textToSql", {
        statusLine: "—",
        statusCode: 500,
        responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
      });
      setTextToSqlError("서버 연결에 실패했습니다.");
    } finally {
      setIsTextToSqlLoading(false);
    }
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
      (targetApi === "llm" && isChatLoading) ||
      (targetApi === "adCopy" && isAdCopyLoading) ||
      (targetApi === "summarize" && isSummarizeLoading) ||
      (targetApi === "sentiment" && isSentimentLoading) ||
      (targetApi === "ner" && isNerLoading) ||
      (targetApi === "textToSql" && isTextToSqlLoading)
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

      if (targetApi === "adCopy") {
        const body = parsed as {
          brief?: unknown;
          toneLine?: unknown;
          channelLine?: unknown;
          temperature?: unknown;
          language?: unknown;
        };
        const brief = typeof body.brief === "string" ? body.brief.trim() : "";
        if (!brief) {
          patchConsole("adCopy", {
            error: "`brief` 문자열을 확인해주세요.",
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

        const tone =
          typeof body.toneLine === "string" ? body.toneLine.trim() : "";
        const channel =
          typeof body.channelLine === "string" ? body.channelLine.trim() : "";
        const parsedTemperature =
          typeof body.temperature === "number" &&
          Number.isFinite(body.temperature)
            ? body.temperature
            : typeof body.temperature === "string" &&
                body.temperature.trim() &&
                Number.isFinite(Number(body.temperature))
              ? Number(body.temperature)
              : adCopyTemperature;

        const langRaw =
          typeof body.language === "string" ? body.language.trim() : "";
        const parsedLanguage =
          langRaw !== "" ? langRaw : DEFAULT_AD_COPY_LANGUAGE;

        setIsAdCopyLoading(true);
        setAdCopyResult(null);
        setAdCopyBrief(brief);
        setAdCopyTone(tone);
        setAdCopyChannel(channel);
        setAdCopyLanguage(parsedLanguage);
        setAdCopyTemperature(Math.min(1, Math.max(0, parsedTemperature)));

        try {
          const token = getToken();
          const res = await fetch("/api/ad-copy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              brief,
              tone: tone || undefined,
              channel: channel || undefined,
              temperature: parsedTemperature,
              language: parsedLanguage,
            }),
          });
          const data = (await res.json().catch(() => null)) as {
            copy?: unknown;
            headline?: unknown;
            body?: unknown;
            error?: unknown;
          } | null;
          patchConsole("adCopy", {
            statusCode: res.status,
            statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
            responseJson: JSON.stringify(data ?? {}, null, 2),
          });
          consoleAlreadySet = true;

          if (!res.ok) {
            if (res.status === 429) setLimitExceededModalOpen(true);
            setAdCopyResult(
              typeof data?.error === "string"
                ? data.error
                : "요청에 실패했습니다.",
            );
            return;
          }
          const copyLegacy =
            typeof data?.copy === "string" ? data.copy.trim() : "";
          const headline =
            typeof data?.headline === "string" ? data.headline.trim() : "";
          const bodyLine =
            typeof data?.body === "string" ? data.body.trim() : "";
          const display =
            copyLegacy ||
            [headline, bodyLine].filter((s) => s.length > 0).join("\n\n");
          setAdCopyResult(display || "응답이 비어있습니다.");
        } catch {
          patchConsole("adCopy", {
            statusLine: "—",
            statusCode: 500,
            responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
          });
          setAdCopyResult("서버 연결에 실패했습니다.");
        } finally {
          setIsAdCopyLoading(false);
        }
        return;
      }

      if (targetApi === "summarize") {
        const body = parsed as {
          text?: unknown;
          style?: unknown;
          temperature?: unknown;
        };
        const textBody = typeof body.text === "string" ? body.text.trim() : "";
        if (!textBody) {
          patchConsole("summarize", {
            error: "`text` 문자열을 확인해주세요.",
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

        const style = typeof body.style === "string" ? body.style.trim() : "";
        const parsedTemperature =
          typeof body.temperature === "number" &&
          Number.isFinite(body.temperature)
            ? body.temperature
            : typeof body.temperature === "string" &&
                body.temperature.trim() &&
                Number.isFinite(Number(body.temperature))
              ? Number(body.temperature)
              : summarizeTemperature;

        setIsSummarizeLoading(true);
        setSummarizeResult(null);
        setSummarizeText(textBody);
        setSummarizeStyle(style);
        setSummarizeTemperature(Math.min(1, Math.max(0, parsedTemperature)));

        try {
          const token = getToken();
          const res = await fetch("/api/summarize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              text: textBody,
              style: style || undefined,
              temperature: parsedTemperature,
            }),
          });
          const data = (await res.json().catch(() => null)) as {
            summary?: unknown;
            error?: unknown;
          } | null;
          patchConsole("summarize", {
            statusCode: res.status,
            statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
            responseJson: JSON.stringify(data ?? {}, null, 2),
          });
          consoleAlreadySet = true;

          if (!res.ok) {
            if (res.status === 429) setLimitExceededModalOpen(true);
            setSummarizeResult(
              typeof data?.error === "string"
                ? data.error
                : "요청에 실패했습니다.",
            );
            return;
          }
          const summary =
            typeof data?.summary === "string" ? data.summary.trim() : "";
          setSummarizeResult(summary || "응답이 비어있습니다.");
        } catch {
          patchConsole("summarize", {
            statusLine: "—",
            statusCode: 500,
            responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
          });
          setSummarizeResult("서버 연결에 실패했습니다.");
        } finally {
          setIsSummarizeLoading(false);
        }
        return;
      }

      if (targetApi === "sentiment") {
        const body = parsed as {
          text?: unknown;
          temperature?: unknown;
        };
        const textBody = typeof body.text === "string" ? body.text.trim() : "";
        if (!textBody) {
          patchConsole("sentiment", {
            error: "`text` 문자열을 확인해주세요.",
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

        const parsedTemperature =
          typeof body.temperature === "number" &&
          Number.isFinite(body.temperature)
            ? body.temperature
            : typeof body.temperature === "string" &&
                body.temperature.trim() &&
                Number.isFinite(Number(body.temperature))
              ? Number(body.temperature)
              : sentimentTemperature;

        setIsSentimentLoading(true);
        setSentimentAnalysis(null);
        setSentimentError(null);
        setSentimentText(textBody);
        setSentimentTemperature(Math.min(1, Math.max(0, parsedTemperature)));

        try {
          const token = getToken();
          const res = await fetch("/api/sentiment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              text: textBody,
              temperature: parsedTemperature,
            }),
          });
          const data = (await res.json().catch(() => null)) as unknown;
          patchConsole("sentiment", {
            statusCode: res.status,
            statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
            responseJson: JSON.stringify(data ?? {}, null, 2),
          });
          consoleAlreadySet = true;

          if (!res.ok) {
            if (res.status === 429) setLimitExceededModalOpen(true);
            const msg =
              typeof data === "object" &&
              data !== null &&
              typeof (data as { error?: unknown }).error === "string"
                ? (data as { error: string }).error
                : "요청에 실패했습니다.";
            setSentimentError(msg);
            return;
          }
          if (!isSentimentPayload(data)) {
            setSentimentError("응답 형식을 해석하지 못했습니다.");
            return;
          }
          setSentimentAnalysis(data);
        } catch {
          patchConsole("sentiment", {
            statusLine: "—",
            statusCode: 500,
            responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
          });
          setSentimentError("서버 연결에 실패했습니다.");
        } finally {
          setIsSentimentLoading(false);
        }
        return;
      }

      if (targetApi === "ner") {
        const body = parsed as {
          text?: unknown;
          prompt?: unknown;
          temperature?: unknown;
        };
        const textBody = typeof body.text === "string" ? body.text.trim() : "";
        if (!textBody) {
          patchConsole("ner", {
            error: "`text` 문자열을 확인해주세요.",
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

        const parsedTemperature =
          typeof body.temperature === "number" &&
          Number.isFinite(body.temperature)
            ? body.temperature
            : typeof body.temperature === "string" &&
                body.temperature.trim() &&
                Number.isFinite(Number(body.temperature))
              ? Number(body.temperature)
              : nerTemperature;

        setIsNerLoading(true);
        setNerResult(null);
        setNerError(null);
        setNerText(textBody);
        setNerPrompt(typeof body.prompt === "string" ? body.prompt : "");
        setNerTemperature(Math.min(1, Math.max(0, parsedTemperature)));

        try {
          const token = getToken();
          const res = await fetch("/api/ner", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              text: textBody,
              ...(typeof body.prompt === "string" && body.prompt.trim()
                ? { prompt: body.prompt.trim() }
                : {}),
              temperature: parsedTemperature,
            }),
          });
          const data = (await res.json().catch(() => null)) as unknown;
          patchConsole("ner", {
            statusCode: res.status,
            statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
            responseJson: JSON.stringify(data ?? {}, null, 2),
          });
          consoleAlreadySet = true;

          if (!res.ok) {
            if (res.status === 429) setLimitExceededModalOpen(true);
            const msg =
              typeof data === "object" &&
              data !== null &&
              typeof (data as { error?: unknown }).error === "string"
                ? (data as { error: string }).error
                : "요청에 실패했습니다.";
            setNerError(msg);
            return;
          }
          if (!isNerPayload(data)) {
            setNerError("응답 형식을 해석하지 못했습니다.");
            return;
          }
          setNerResult(data);
        } catch {
          patchConsole("ner", {
            statusLine: "—",
            statusCode: 500,
            responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
          });
          setNerError("서버 연결에 실패했습니다.");
        } finally {
          setIsNerLoading(false);
        }
        return;
      }

      if (targetApi === "textToSql") {
        const body = parsed as {
          text?: unknown;
          ddl?: unknown;
          temperature?: unknown;
        };
        const textBody = typeof body.text === "string" ? body.text.trim() : "";
        if (!textBody) {
          patchConsole("textToSql", {
            error: "`text` 문자열을 확인해주세요.",
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

        const parsedTemperature =
          typeof body.temperature === "number" &&
          Number.isFinite(body.temperature)
            ? body.temperature
            : typeof body.temperature === "string" &&
                body.temperature.trim() &&
                Number.isFinite(Number(body.temperature))
              ? Number(body.temperature)
              : textToSqlTemperature;

        setIsTextToSqlLoading(true);
        setTextToSqlResult(null);
        setTextToSqlError(null);
        setTextToSqlText(textBody);
        setTextToSqlDdl(typeof body.ddl === "string" ? body.ddl : "");
        setTextToSqlTemperature(Math.min(1, Math.max(0, parsedTemperature)));

        try {
          const token = getToken();
          const res = await fetch("/api/text2sql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              text: textBody,
              ...(typeof body.ddl === "string" && body.ddl.trim()
                ? { ddl: body.ddl.trim() }
                : {}),
              temperature: parsedTemperature,
            }),
          });
          const data = (await res.json().catch(() => null)) as unknown;
          patchConsole("textToSql", {
            statusCode: res.status,
            statusLine: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
            responseJson: JSON.stringify(data ?? {}, null, 2),
          });
          consoleAlreadySet = true;

          if (!res.ok) {
            if (res.status === 429) setLimitExceededModalOpen(true);
            const msg =
              typeof data === "object" &&
              data !== null &&
              typeof (data as { error?: unknown }).error === "string"
                ? (data as { error: string }).error
                : "요청에 실패했습니다.";
            setTextToSqlError(msg);
            return;
          }
          if (!isTextToSqlPayload(data)) {
            setTextToSqlError("응답 형식을 해석하지 못했습니다.");
            return;
          }
          setTextToSqlResult(data);
        } catch {
          patchConsole("textToSql", {
            statusLine: "—",
            statusCode: 500,
            responseJson: JSON.stringify({ error: "Server Error" }, null, 2),
          });
          setTextToSqlError("서버 연결에 실패했습니다.");
        } finally {
          setIsTextToSqlLoading(false);
        }
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
      {limitExceededModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[min(480px,90%)] rounded-2xl border border-amber-500/30 bg-surface/95 p-6 shadow-xl">
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
      {/* Header */}
      <SiteNav fixed />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,136,138,0.06),transparent_62%)]" />

        {viewMode === "list" ? (
          <div className="relative flex flex-col gap-6 lg:flex-row lg:gap-6">
            {comingSoonMessage ? (
              <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                <div className="w-[min(520px,90%)] rounded-2xl border border-accent/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(232, 136, 138,0.18)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                      <IconPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        Coming Soon
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
            {/* Left: Filters */}
            <aside className="w-full lg:w-[240px] lg:flex-shrink-0">
              <div className="rounded-2xl border border-white/5 bg-surface/40 p-3 backdrop-blur-xl">
                <div className="mb-4 space-y-3">
                  <p className="font-mono text-xs text-foreground/60">
                    Tasks
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    API 유형 필터
                  </h2>
                </div>

                <div className="mt-4 rounded-xl border border-white/5 bg-background/20 p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarMode("all");
                          setFilterTasks((prev) => {
                            const next = { ...prev };
                            taskKeys.forEach((k) => {
                              next[k] = true;
                            });
                            // Vision is now active
                            return next;
                          });
                        }}
                        className={[
                          "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                          "border-white/10 bg-background/30 hover:border-accent/30 hover:bg-accent/10",
                          isAllTasksActive
                            ? "border-accent/50 bg-accent/10 shadow-[0_0_40px_rgba(232, 136, 138,0.12)]"
                            : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                            isAllTasksActive
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-white/10 bg-background/20 text-foreground/70",
                          ].join(" ")}
                        >
                          <IconLayers className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          All
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!userMe && !getToken()) {
                            window.location.href = "/login?redirect=%2Fapi-test";
                            return;
                          }
                          setSidebarMode("my");
                        }}
                        className={[
                          "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                          "border-white/10 bg-background/30 hover:border-accent/30 hover:bg-accent/10",
                          sidebarMode === "my"
                            ? "border-accent/50 bg-accent/10 shadow-[0_0_40px_rgba(232, 136, 138,0.12)]"
                            : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                            sidebarMode === "my"
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-white/10 bg-background/20 text-foreground/70",
                          ].join(" ")}
                        >
                          <IconUser className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          My
                        </span>
                      </button>

                      {taskKeys.map((t) => {
                        // "All"이 켜져 있을 때는 전 태스크가 true라서, 개별 버튼은 강조하지 않음
                        const isActive =
                          sidebarMode === "all" &&
                          filterTasks[t] &&
                          !allTasksFilterOn;
                        const label =
                          t === "Text Generation"
                            ? "Text"
                            : t === "Ad Copy"
                              ? "카피"
                              : t === "Text Summary"
                                ? "요약"
                                : t === "Sentiment Analysis"
                                  ? "감성"
                                  : t === "NER"
                                    ? "개체명"
                                    : t === "Text-to-SQL"
                                      ? "SQL"
                                      : t === "Voice Clone"
                                        ? "클론"
                                        : t === "Vision"
                                          ? "Vision"
                                          : t;

                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setSidebarMode("all");
                              setFilterTasks((prev) => {
                                const next = { ...prev };
                                taskKeys.forEach((k) => {
                                  next[k] = k === t;
                                });
                                // Vision is now active
                                return next;
                              });
                            }}
                            className={[
                              "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                              "border-white/10 bg-background/30 hover:border-accent/30 hover:bg-accent/10",
                              isActive
                                ? "border-accent/50 bg-accent/10 shadow-[0_0_40px_rgba(232, 136, 138,0.12)]"
                                : "",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                                isActive
                                  ? "border-accent/40 bg-accent/10 text-accent"
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
                  <span className="whitespace-nowrap rounded-xl border border-accent/25 bg-accent/5 px-3 py-1 font-mono text-xs text-accent">
                    {filteredMarketplace.length === 1
                      ? "1 API"
                      : `${filteredMarketplace.length} APIs`}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredMarketplace.map((item) => {
                    const currentPlan = resolveMarketplacePlan(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => enterDetailFor(item)}
                        className={[
                          "group relative flex h-full flex-col rounded-2xl border bg-background/20 p-4 text-left transition-all",
                          "border-white/5 hover:-translate-y-0.5 hover:border-accent/45 hover:bg-background/30",
                          "hover:shadow-[0_0_60px_rgba(232, 136, 138,0.12)]",
                        ].join(" ")}
                      >
                        <p className="font-mono text-[11px] text-foreground/50">
                          {getPlanTaskSublabel(item.task as PlanTask)}
                        </p>
                        <p className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                          {item.model}
                        </p>
                        <p className="mt-1 text-[11px] text-foreground/40">
                          코그로보
                        </p>
                        <p className="mt-2 text-[11px] text-foreground/45">
                          트래픽 기반 · 등급별 과금
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.taskTags.slice(0, 3).map((tag) => (
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
                            현재: {currentPlan.plan_name} ({currentPlan.max_rps}{" "}
                            RPS)
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
              </div>
            </section>
          </div>
        ) : (
          <div className="relative flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:gap-3">
            {/* Center: Playground */}
            <section className="w-full lg:min-w-0 lg:flex-1">
              <div
                className={`relative flex min-h-0 flex-col rounded-2xl border border-white/5 bg-surface/35 backdrop-blur-xl overflow-hidden ${
                  selectedApi === "adCopy" ||
                  selectedApi === "summarize" ||
                  selectedApi === "sentiment" ||
                  selectedApi === "ner" ||
                  selectedApi === "textToSql"
                    ? "h-[calc(100vh-200px)]"
                    : "h-[calc(100vh-240px)]"
                }`}
              >
                <div
                  className={`flex items-center justify-between gap-3 border-b border-white/5 bg-background/20 ${
                    selectedApi === "adCopy" ||
                    selectedApi === "summarize" ||
                    selectedApi === "sentiment" ||
                    selectedApi === "ner" ||
                    selectedApi === "textToSql"
                      ? "p-3"
                      : "p-4"
                  }`}
                >
                  <div className="min-w-0 w-full flex-1">
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
                              // Vision is now active
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
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-sm font-medium text-foreground/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors hover:border-accent/35 hover:bg-accent/10 hover:text-accent"
                    >
                      <IconArrowLeft className="h-4 w-4 shrink-0" />
                      <span>API 목록으로</span>
                    </button>
                    <div className="mt-3 flex w-full min-w-0 items-center gap-3">
                      <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">
                        {selectedApiItem?.name ?? "API"} Playground
                      </h3>
                    </div>
                    {selectedApi === "llm" ||
                    selectedApi === "adCopy" ||
                    selectedApi === "summarize" ||
                    selectedApi === "sentiment" ||
                    selectedApi === "ner" ||
                    selectedApi === "textToSql" ||
                    selectedApi === "reranker" ||
                    selectedApi === "embedding" ||
                    selectedApi === "tts" ||
                    selectedApi === "stt" ||
                    selectedApi === "voiceClone" ||
                    selectedApi === "image2text" ? (
                      <div
                        className={
                          selectedApi === "adCopy" ||
                          selectedApi === "summarize" ||
                          selectedApi === "sentiment" ||
                          selectedApi === "ner" ||
                          selectedApi === "textToSql"
                            ? "mt-1"
                            : "mt-2"
                        }
                      >
                        <span className="inline-flex items-center rounded-xl border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-mono text-accent">
                          {selectedApi === "llm"
                            ? "High-Performance Infra • Omakase Text • 실시간"
                            : selectedApi === "adCopy"
                              ? "High-Performance Infra • 자사 NLP • 광고 카피"
                              : selectedApi === "summarize"
                                ? "High-Performance Infra • 자사 NLP • 텍스트 요약"
                                : selectedApi === "sentiment"
                                  ? "High-Performance Infra • 자사 NLP • 리뷰 감정"
                                  : selectedApi === "ner"
                                    ? "High-Performance Infra • 자사 NLP • 개체명 인식"
                                    : selectedApi === "textToSql"
                                      ? "High-Performance Infra • 자사 NLP • Text-to-SQL"
                                      : selectedApi === "reranker"
                                        ? "High-Performance Infra • Qwen3-Reranker-8B • 실시간"
                                        : selectedApi === "embedding"
                                          ? "24G VRAM Workstation • Qwen-Embedding-8B • 실시간"
                                          : selectedApi === "tts"
                                            ? "High-Performance Infra • Qwen3-TTS • 실시간"
                                            : selectedApi === "voiceClone"
                                              ? "High-Performance Infra • Voice Clone • 실시간"
                                              : selectedApi === "image2text"
                                                ? "High-Performance Infra • Image2Text • 실시간"
                                                : "High-Performance Infra • Qwen3-STT • 실시간"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {comingSoonMessage ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                    <div className="w-[min(520px,90%)] rounded-2xl border border-accent/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(232, 136, 138,0.18)]">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                          <IconPlus className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            Coming Soon
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
                  className="api-center-anim flex min-h-0 flex-1 flex-col"
                >
                  {selectedApi !== "adCopy" &&
                  selectedApi !== "summarize" &&
                  selectedApi !== "sentiment" &&
                  selectedApi !== "ner" &&
                  selectedApi !== "textToSql" ? (
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                      <ApiOutputPanel
                        selectedApi={selectedApi}
                        messages={messages}
                        endRef={endRef}
                        formatTime={formatTime}
                        liveNowText={formatTime(Date.now())}
                        adCopyResult={adCopyResult}
                        isAdCopyLoading={isAdCopyLoading}
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
                      />
                    </div>
                  ) : null}
                  <div
                    className={
                      selectedApi === "adCopy" ||
                      selectedApi === "summarize" ||
                      selectedApi === "sentiment" ||
                      selectedApi === "textToSql"
                        ? "min-h-0 flex-1 overflow-y-auto px-3 py-3"
                        : selectedApi === "ner"
                          ? "min-h-0 flex-1 overflow-hidden px-3 py-2"
                          : "flex-shrink-0"
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
                      handleAdCopyRun={() => void handleAdCopyRun()}
                      adCopyBrief={adCopyBrief}
                      setAdCopyBrief={setAdCopyBrief}
                      adCopyTone={adCopyTone}
                      setAdCopyTone={setAdCopyTone}
                      adCopyChannel={adCopyChannel}
                      setAdCopyChannel={setAdCopyChannel}
                      adCopyLanguage={adCopyLanguage}
                      setAdCopyLanguage={setAdCopyLanguage}
                      adCopyTemperature={adCopyTemperature}
                      setAdCopyTemperature={setAdCopyTemperature}
                      isAdCopyLoading={isAdCopyLoading}
                      adCopyResult={adCopyResult}
                      handleSummarizeRun={() => void handleSummarizeRun()}
                      summarizeText={summarizeText}
                      setSummarizeText={setSummarizeText}
                      summarizeStyle={summarizeStyle}
                      setSummarizeStyle={setSummarizeStyle}
                      summarizeTemperature={summarizeTemperature}
                      setSummarizeTemperature={setSummarizeTemperature}
                      isSummarizeLoading={isSummarizeLoading}
                      summarizeResult={summarizeResult}
                      handleSentimentRun={() => void handleSentimentRun()}
                      sentimentText={sentimentText}
                      setSentimentText={setSentimentText}
                      sentimentTemperature={sentimentTemperature}
                      setSentimentTemperature={setSentimentTemperature}
                      isSentimentLoading={isSentimentLoading}
                      sentimentAnalysis={sentimentAnalysis}
                      sentimentError={sentimentError}
                      handleNerRun={() => void handleNerRun()}
                      nerText={nerText}
                      setNerText={setNerText}
                      nerPrompt={nerPrompt}
                      setNerPrompt={setNerPrompt}
                      nerTemperature={nerTemperature}
                      setNerTemperature={setNerTemperature}
                      isNerLoading={isNerLoading}
                      nerResult={nerResult}
                      nerError={nerError}
                      handleTextToSqlRun={() => void handleTextToSqlRun()}
                      textToSqlText={textToSqlText}
                      setTextToSqlText={setTextToSqlText}
                      textToSqlDdl={textToSqlDdl}
                      setTextToSqlDdl={setTextToSqlDdl}
                      textToSqlTemperature={textToSqlTemperature}
                      setTextToSqlTemperature={setTextToSqlTemperature}
                      isTextToSqlLoading={isTextToSqlLoading}
                      textToSqlResult={textToSqlResult}
                      textToSqlError={textToSqlError}
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
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Right: Developer Console */}
            <aside className="w-full lg:w-[38%] lg:min-w-[320px] lg:flex-shrink-0">
              <div
                className={`flex min-h-0 flex-col rounded-2xl border border-white/5 bg-surface/35 backdrop-blur-xl overflow-hidden ${
                  selectedApi === "adCopy" ||
                  selectedApi === "summarize" ||
                  selectedApi === "sentiment" ||
                  selectedApi === "ner" ||
                  selectedApi === "textToSql"
                    ? "h-[calc(100vh-200px)]"
                    : "h-[calc(100vh-240px)]"
                }`}
              >
                <div className="border-b border-white/5 bg-background/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-foreground/60">
                        Developer Console
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        POST{" "}
                        <span className="text-accent">
                          {selectedApi === "embedding"
                            ? "/api/embedding"
                            : selectedApi === "reranker"
                              ? "/api/rerank"
                              : selectedApi === "adCopy"
                                ? "/api/ad-copy"
                                : selectedApi === "summarize"
                                  ? "/api/summarize"
                                  : selectedApi === "sentiment"
                                    ? "/api/sentiment"
                                    : selectedApi === "ner"
                                      ? "/api/ner"
                                      : selectedApi === "textToSql"
                                        ? "/api/text2sql"
                                        : selectedApi === "stt"
                                          ? "/api/stt"
                                          : selectedApi === "tts"
                                            ? "Mock TTS (client)"
                                            : selectedApi === "voiceClone"
                                              ? "/api/voice-clone"
                                              : selectedApi === "image2text"
                                                ? "/api/image2text"
                                                : "/api/chat"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resetConsoleForApi(selectedApi)}
                        className="rounded-lg border border-white/10 bg-background/30 px-3 py-1 text-[11px] font-mono text-foreground/70 transition-colors hover:border-accent/40 hover:text-accent"
                      >
                        Reset
                      </button>
                      <span
                        className={[
                          "rounded-lg border border-white/10 bg-background/30 px-3 py-1 text-[11px] font-mono",
                          currentConsole.statusCode === 200
                            ? "text-accent"
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
                        className="mt-3 min-h-[180px] w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 font-mono text-[12px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
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
                            (selectedApi === "adCopy" && isAdCopyLoading) ||
                            (selectedApi === "summarize" &&
                              isSummarizeLoading) ||
                            (selectedApi === "sentiment" &&
                              isSentimentLoading) ||
                            (selectedApi === "ner" && isNerLoading) ||
                            (selectedApi === "textToSql" && isTextToSqlLoading)
                          }
                          className={[
                            "rounded-xl border px-5 py-3 text-xs font-medium transition-colors",
                            "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            consoleSubmitShake ? "console-shake" : "",
                          ].join(" ")}
                        >
                          {(selectedApi === "llm" && isChatLoading) ||
                          (selectedApi === "adCopy" && isAdCopyLoading) ||
                          (selectedApi === "summarize" && isSummarizeLoading) ||
                          (selectedApi === "sentiment" && isSentimentLoading) ||
                          (selectedApi === "ner" && isNerLoading) ||
                          (selectedApi === "textToSql" && isTextToSqlLoading)
                            ? "전송 중..."
                            : "요청 전송"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-background/20 p-3">
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
                                  : "border-white/10 bg-background/30 text-foreground/70 hover:border-accent/40 hover:text-accent",
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
                    ) : selectedApi === "adCopy" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={adCopyDevCodeOpen}
                        setDevCodeOpen={setAdCopyDevCodeOpen}
                        devCodeCopied={adCopyDevCodeCopied}
                        setDevCodeCopied={setAdCopyDevCodeCopied}
                        codePython={adCopyDevCodePython}
                        footer={
                          <>
                            <span className="text-foreground/80">
                              POST /api/ad-copy
                            </span>
                            와 동일한 JSON 본문입니다.{" "}
                            <span className="font-mono text-foreground/70">
                              BASE_URL
                            </span>
                            을 실행 환경에 맞게 바꾸고, 필요 시{" "}
                            <span className="font-mono text-foreground/70">
                              Authorization
                            </span>{" "}
                            헤더를 켜세요. 위 요청은{" "}
                            <span className="text-foreground/80">
                              /api/ad-copy
                            </span>{" "}
                            라우트로 전송됩니다.
                          </>
                        }
                      />
                    ) : selectedApi === "summarize" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={summarizeDevCodeOpen}
                        setDevCodeOpen={setSummarizeDevCodeOpen}
                        devCodeCopied={summarizeDevCodeCopied}
                        setDevCodeCopied={setSummarizeDevCodeCopied}
                        codePython={summarizeDevCodePython}
                        footer={
                          <>
                            데모 앱은{" "}
                            <span className="text-foreground/80">
                              /api/summarize
                            </span>{" "}
                            프록시를 통해 텍스트 요약을 생성합니다.
                          </>
                        }
                      />
                    ) : selectedApi === "sentiment" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={sentimentDevCodeOpen}
                        setDevCodeOpen={setSentimentDevCodeOpen}
                        devCodeCopied={sentimentDevCodeCopied}
                        setDevCodeCopied={setSentimentDevCodeCopied}
                        codePython={sentimentDevCodePython}
                        footer={
                          <>
                            데모 앱은{" "}
                            <span className="text-foreground/80">
                              /api/sentiment
                            </span>{" "}
                            프록시를 통해 리뷰 감정 분석 결과를 반환합니다.
                          </>
                        }
                      />
                    ) : selectedApi === "ner" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={nerDevCodeOpen}
                        setDevCodeOpen={setNerDevCodeOpen}
                        devCodeCopied={nerDevCodeCopied}
                        setDevCodeCopied={setNerDevCodeCopied}
                        codePython={nerDevCodePython}
                        footer={
                          <>
                            데모 앱은{" "}
                            <span className="text-foreground/80">/api/ner</span>{" "}
                            프록시를 통해 개체명 인식 결과를 반환합니다.
                          </>
                        }
                      />
                    ) : selectedApi === "textToSql" ? (
                      <PlaygroundDeveloperCodeSection
                        devCodeOpen={textToSqlDevCodeOpen}
                        setDevCodeOpen={setTextToSqlDevCodeOpen}
                        devCodeCopied={textToSqlDevCodeCopied}
                        setDevCodeCopied={setTextToSqlDevCodeCopied}
                        codePython={textToSqlDevCodePython}
                        footer={
                          <>
                            데모 앱은{" "}
                            <span className="text-foreground/80">
                              /api/text2sql
                            </span>{" "}
                            프록시를 통해 자연어→SQL 결과를 반환합니다.
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
                    (selectedApi === "adCopy" && isAdCopyLoading) ||
                    (selectedApi === "summarize" && isSummarizeLoading) ||
                    (selectedApi === "sentiment" && isSentimentLoading) ||
                    (selectedApi === "ner" && isNerLoading) ||
                    (selectedApi === "textToSql" && isTextToSqlLoading) ? (
                      <div className="rounded-xl border border-accent/25 bg-accent/5 p-3 text-xs text-accent">
                        {selectedApi === "adCopy"
                          ? "카피 생성 중... (응답 대기)"
                          : selectedApi === "summarize"
                            ? "요약 생성 중... (응답 대기)"
                            : selectedApi === "sentiment"
                              ? "감정 분석 중... (응답 대기)"
                              : selectedApi === "ner"
                                ? "개체명 추출 중... (응답 대기)"
                                : selectedApi === "textToSql"
                                  ? "SQL 생성 중... (응답 대기)"
                                  : "답변 생성 중... (응답 대기)"}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>

            {workflowBannerMounted &&
            (selectedApi === "llm" ||
              selectedApi === "adCopy" ||
              selectedApi === "summarize" ||
              selectedApi === "sentiment" ||
              selectedApi === "ner" ||
              selectedApi === "textToSql" ||
              selectedApi === "reranker" ||
              selectedApi === "embedding" ||
              selectedApi === "tts" ||
              selectedApi === "stt" ||
              selectedApi === "voiceClone") ? (
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
                      >
                        플랜 보기 →
                      </Link>
                    </div>
                    {selectedApi === "stt" ? (
                      <p className="text-sm leading-relaxed text-foreground/90">
                        <span className="mr-2">🎙️</span>
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
