import React, { useState } from "react";

import { AD_COPY_LANGUAGE_OPTIONS } from "@/lib/adCopyLanguages";
import type {
  ApiId,
  NerPayload,
  SentimentAnalysisPayload,
  TextToSqlPayload,
} from "../lib/types";
import { ChatMarkdown } from "./ChatMarkdown";

/** range 슬라이더 값 파싱 — `0`은 falsy라 `|| 기본값` 패턴으로는 0을 쓸 수 없음 */
function parseTemperatureRange(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

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

type SttHelpTooltipId = "vad" | "beam";

type Props = {
  selectedApi: ApiId;

  // LLM input
  onSend: React.FormEventHandler<HTMLFormElement>;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
  isChatLoading: boolean;
  llmTemperature: number;
  setLlmTemperature: React.Dispatch<React.SetStateAction<number>>;

  // Ad Copy input
  handleAdCopyRun: () => void;
  adCopyBrief: string;
  setAdCopyBrief: React.Dispatch<React.SetStateAction<string>>;
  adCopyTone: string;
  setAdCopyTone: React.Dispatch<React.SetStateAction<string>>;
  adCopyChannel: string;
  setAdCopyChannel: React.Dispatch<React.SetStateAction<string>>;
  adCopyLanguage: string;
  setAdCopyLanguage: React.Dispatch<React.SetStateAction<string>>;
  adCopyTemperature: number;
  setAdCopyTemperature: React.Dispatch<React.SetStateAction<number>>;
  isAdCopyLoading: boolean;
  adCopyResult: string | null;

  // Text Summary input
  handleSummarizeRun: () => void;
  summarizeText: string;
  setSummarizeText: React.Dispatch<React.SetStateAction<string>>;
  summarizeStyle: string;
  setSummarizeStyle: React.Dispatch<React.SetStateAction<string>>;
  summarizeTemperature: number;
  setSummarizeTemperature: React.Dispatch<React.SetStateAction<number>>;
  isSummarizeLoading: boolean;
  summarizeResult: string | null;

  // Sentiment input
  handleSentimentRun: () => void;
  sentimentText: string;
  setSentimentText: React.Dispatch<React.SetStateAction<string>>;
  sentimentTemperature: number;
  setSentimentTemperature: React.Dispatch<React.SetStateAction<number>>;
  isSentimentLoading: boolean;
  sentimentAnalysis: SentimentAnalysisPayload | null;
  sentimentError: string | null;

  // NER input
  handleNerRun: () => void;
  nerText: string;
  setNerText: React.Dispatch<React.SetStateAction<string>>;
  nerPrompt: string;
  setNerPrompt: React.Dispatch<React.SetStateAction<string>>;
  nerTemperature: number;
  setNerTemperature: React.Dispatch<React.SetStateAction<number>>;
  isNerLoading: boolean;
  nerResult: NerPayload | null;
  nerError: string | null;

  // Text-to-SQL input
  handleTextToSqlRun: () => void;
  textToSqlText: string;
  setTextToSqlText: React.Dispatch<React.SetStateAction<string>>;
  textToSqlTemperature: number;
  setTextToSqlTemperature: React.Dispatch<React.SetStateAction<number>>;
  isTextToSqlLoading: boolean;
  textToSqlResult: TextToSqlPayload | null;
  textToSqlError: string | null;

  // Embedding input
  handleEmbeddingRun: () => void;
  embeddingText: string;
  setEmbeddingText: React.Dispatch<React.SetStateAction<string>>;
  isEmbeddingLoading: boolean;

  // TTS input
  handleTtsRun: () => void;
  ttsText: string;
  setTtsText: React.Dispatch<React.SetStateAction<string>>;
  ttsLanguage: string;
  setTtsLanguage: React.Dispatch<React.SetStateAction<string>>;
  ttsLanguageOptions: Array<{ value: string; label: string }>;
  ttsSpeaker: string;
  setTtsSpeaker: React.Dispatch<React.SetStateAction<string>>;
  ttsSpeakerOptions: Array<{ value: string; label: string }>;
  ttsStyleInstruction: string;
  setTtsStyleInstruction: React.Dispatch<React.SetStateAction<string>>;
  isTtsSynthesizing: boolean;

  // STT input
  sttFileInputRef: React.RefObject<HTMLInputElement | null>;
  sttFileName: string | null;
  sttUploadClearMounted: boolean;
  onSttFileChange: (file: File | null) => void;
  onSttUploadClear: () => void;

  isRecording: boolean;
  onSttMicToggle: () => void;

  sttLangDropdownRootRef: React.RefObject<HTMLDivElement | null>;
  sttLangInputRef: React.RefObject<HTMLInputElement | null>;
  sttLangDropdownOpen: boolean;
  setSttLangDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sttLangQuery: string;
  setSttLangQuery: React.Dispatch<React.SetStateAction<string>>;

  sttLangOptions: string[];
  sttLanguage: string;
  setSttLanguage: React.Dispatch<React.SetStateAction<string>>;
  getSttLanguageLabel: (code: string) => string;

  sttTooltipPinned: SttHelpTooltipId | null;
  setSttTooltipPinned: React.Dispatch<
    React.SetStateAction<SttHelpTooltipId | null>
  >;
  sttTooltipHoverId: SttHelpTooltipId | null;
  setSttTooltipHoverId: React.Dispatch<
    React.SetStateAction<SttHelpTooltipId | null>
  >;
  SttHelpTooltip: React.ComponentType<{
    id: SttHelpTooltipId;
    pinnedId: SttHelpTooltipId | null;
    setPinnedId: React.Dispatch<React.SetStateAction<SttHelpTooltipId | null>>;
    hoverId: SttHelpTooltipId | null;
    setHoverId: React.Dispatch<React.SetStateAction<SttHelpTooltipId | null>>;
    content: string;
  }>;

  sttVadOn: boolean;
  setSttVadOn: React.Dispatch<React.SetStateAction<boolean>>;

  STT_DEFAULT_BEAM_SIZE: number;
  sttBeamSize: number;
  setSttBeamSize: React.Dispatch<React.SetStateAction<number>>;

  STT_WAVE_BAR_MIN_HEIGHT_PX: number;
  STT_WAVE_BAR_MAX_HEIGHT_PX: number;
  sttMicBars: number[];

  isSttLoading: boolean;
  onSttRun: () => void;

  // Icons
  IconUpload: React.ComponentType<{ className?: string }>;
  IconMic: React.ComponentType<{ className?: string }>;
};

export function ApiInputPanel({
  selectedApi,

  onSend,
  prompt,
  setPrompt,
  placeholder,
  isChatLoading,
  llmTemperature,
  setLlmTemperature,

  handleAdCopyRun,
  adCopyBrief,
  setAdCopyBrief,
  adCopyTone,
  setAdCopyTone,
  adCopyChannel,
  setAdCopyChannel,
  adCopyLanguage,
  setAdCopyLanguage,
  adCopyTemperature,
  setAdCopyTemperature,
  isAdCopyLoading,
  adCopyResult,

  handleSummarizeRun,
  summarizeText,
  setSummarizeText,
  summarizeStyle,
  setSummarizeStyle,
  summarizeTemperature,
  setSummarizeTemperature,
  isSummarizeLoading,
  summarizeResult,

  handleSentimentRun,
  sentimentText,
  setSentimentText,
  sentimentTemperature,
  setSentimentTemperature,
  isSentimentLoading,
  sentimentAnalysis,
  sentimentError,

  handleNerRun,
  nerText,
  setNerText,
  nerPrompt,
  setNerPrompt,
  nerTemperature,
  setNerTemperature,
  isNerLoading,
  nerResult,
  nerError,

  handleTextToSqlRun,
  textToSqlText,
  setTextToSqlText,
  textToSqlTemperature,
  setTextToSqlTemperature,
  isTextToSqlLoading,
  textToSqlResult,
  textToSqlError,

  handleEmbeddingRun,
  embeddingText,
  setEmbeddingText,
  isEmbeddingLoading,

  handleTtsRun,
  ttsText,
  setTtsText,
  ttsLanguage,
  setTtsLanguage,
  ttsLanguageOptions,
  ttsSpeaker,
  setTtsSpeaker,
  ttsSpeakerOptions,
  ttsStyleInstruction,
  setTtsStyleInstruction,
  isTtsSynthesizing,

  sttFileInputRef,
  sttFileName,
  sttUploadClearMounted,
  onSttFileChange,
  onSttUploadClear,

  isRecording,
  onSttMicToggle,

  sttLangDropdownRootRef,
  sttLangInputRef,
  sttLangDropdownOpen,
  setSttLangDropdownOpen,
  sttLangQuery,
  setSttLangQuery,
  sttLangOptions,
  sttLanguage,
  setSttLanguage,
  getSttLanguageLabel,

  sttTooltipPinned,
  setSttTooltipPinned,
  sttTooltipHoverId,
  setSttTooltipHoverId,
  SttHelpTooltip,

  sttVadOn,
  setSttVadOn,

  STT_DEFAULT_BEAM_SIZE,
  sttBeamSize,
  setSttBeamSize,

  STT_WAVE_BAR_MIN_HEIGHT_PX,
  STT_WAVE_BAR_MAX_HEIGHT_PX,
  sttMicBars,

  isSttLoading,
  onSttRun,

  IconUpload,
  IconMic,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function renderCopyButton(key: string, onClick: () => void, disabled = false) {
    const isCopied = copiedKey === key;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={isCopied ? "복사 완료" : "결과 복사"}
        title={isCopied ? "복사됨" : "복사"}
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
          isCopied
            ? "border-accent/50 bg-accent/10 text-accent"
            : "border-white/10 bg-background/25 text-foreground/65 hover:border-accent/40 hover:text-accent",
          disabled ? "cursor-not-allowed opacity-45" : "",
        ].join(" ")}
      >
        {isCopied ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </button>
    );
  }

  async function copyText(key: string, text: string) {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1200);
    } catch {
      setCopiedKey(null);
    }
  }

  return (
    <div
      className={
        selectedApi === "reranker"
          ? "hidden"
          : [
              "flex-shrink-0 bg-background/20 p-2",
              selectedApi === "adCopy" ||
              selectedApi === "summarize" ||
              selectedApi === "sentiment" ||
              selectedApi === "ner" ||
              selectedApi === "textToSql"
                ? "border-b border-white/5"
                : "border-t border-white/5",
            ].join(" ")
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
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || isChatLoading}
                className={[
                  "group inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-background transition-all",
                  "bg-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_40px_rgba(232, 136, 138,0.22)]",
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

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-foreground/60">
                  Temperature
                </p>
                <span className="font-mono text-xs text-foreground/70">
                  {llmTemperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={llmTemperature}
                onChange={(e) =>
                  setLlmTemperature(parseTemperatureRange(e.target.value, 0.1))
                }
                className="mt-2 w-full accent-accent"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-foreground/45">
                <span className="text-foreground/55">Temperature</span>는 답이
                얼마나 “정해진 느낌”으로 나올지를 조절해요.{" "}
                <span className="text-foreground/60">낮으면</span> 같은 질문에
                비슷하고 안정적인 문장을,{" "}
                <span className="text-foreground/60">높으면</span> 표현이 더
                다양해지고 때로는 예측하기 어려울 수 있어요. 요약·보고서처럼
                톤을 맞추고 싶을 땐 낮게, 아이디어나 문장을 넓게 펼치고 싶을 땐
                높게 써보세요.
              </p>
            </div>
          </div>
        </form>
      ) : null}

      {selectedApi === "adCopy" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdCopyRun();
          }}
        >
          <div className="flex flex-col gap-2.5 lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-stretch lg:gap-4">
            <div className="order-2 flex min-h-0 flex-col gap-2.5 lg:order-1">
              <div>
                <p className="font-mono text-xs text-foreground/60">
                  브리프 (필수)
                </p>
                <textarea
                  value={adCopyBrief}
                  onChange={(e) => setAdCopyBrief(e.target.value)}
                  rows={2}
                  placeholder="제품·서비스 설명을 입력하세요"
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <p className="font-mono text-xs text-foreground/60">
                  출력 언어
                </p>
                <select
                  value={adCopyLanguage}
                  onChange={(e) => setAdCopyLanguage(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-background/40 px-3 text-sm text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                >
                  {AD_COPY_LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-xs text-foreground/60">
                    톤 (선택)
                  </p>
                  <input
                    type="text"
                    value={adCopyTone}
                    onChange={(e) => setAdCopyTone(e.target.value)}
                    placeholder="예: 친근, 전문"
                    className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-background/40 px-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <p className="font-mono text-xs text-foreground/60">
                    채널 (선택)
                  </p>
                  <input
                    type="text"
                    value={adCopyChannel}
                    onChange={(e) => setAdCopyChannel(e.target.value)}
                    placeholder="예: SNS 배너"
                    className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-background/40 px-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs text-foreground/60">
                    Temperature
                  </p>
                  <span className="font-mono text-xs text-foreground/70">
                    {adCopyTemperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={adCopyTemperature}
                  onChange={(e) =>
                    setAdCopyTemperature(
                      parseTemperatureRange(e.target.value, 0.7),
                    )
                  }
                  className="mt-1.5 w-full accent-accent"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/50">
                  낮을수록 톤이 안정적이고, 높을수록 표현이 다양해집니다. 브랜드
                  톤을 맞출 땐 낮게, 여러 초안을 넓게 볼 땐 높게 조절해 보세요.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAdCopyLoading || !adCopyBrief.trim()}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
                    "bg-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_40px_rgba(232, 136, 138,0.22)]",
                  ].join(" ")}
                >
                  {isAdCopyLoading ? (
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
                      <span>카피 생성 중...</span>
                    </>
                  ) : (
                    <>
                      <span>카피 생성</span>
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="order-1 flex min-h-0 flex-col lg:order-2">
              <div className="flex min-h-0 flex-col rounded-2xl border border-accent/25 bg-background/35 p-3 shadow-[inset_0_1px_0_0_rgba(232, 136, 138,0.08)] lg:max-h-[min(58vh,520px)] lg:flex-1 lg:overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium text-accent">
                    생성 결과
                  </p>
                  {isAdCopyLoading ? (
                    <span className="text-[11px] text-foreground/50">
                      생성 중…
                    </span>
                  ) : adCopyResult ? (
                    <span className="text-[11px] text-foreground/50">완료</span>
                  ) : null}
                </div>
                <div className="mt-2.5 min-h-[120px] max-h-[min(38vh,280px)] overflow-y-auto rounded-xl border border-white/5 bg-background/40 p-3 lg:min-h-[200px] lg:max-h-none lg:flex-1">
                  {isAdCopyLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      카피를 생성하는 중입니다…
                    </p>
                  ) : adCopyResult ? (
                    <div>
                      <div className="mb-3 flex justify-end">
                        {renderCopyButton("adCopy", () =>
                          void copyText("adCopy", adCopyResult),
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <ChatMarkdown content={adCopyResult} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/45">
                      <span className="text-foreground/65">카피 생성</span>을
                      누르면 이곳에 생성된 문구가 표시됩니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : null}

      {selectedApi === "summarize" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSummarizeRun();
          }}
        >
          <div className="flex flex-col gap-2.5 lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-stretch lg:gap-4">
            <div className="flex min-h-0 flex-col gap-2.5 lg:order-1">
              <div className="flex min-h-0 flex-1 flex-col">
                <p className="font-mono text-xs text-foreground/60">
                  본문 (필수)
                </p>
                <textarea
                  value={summarizeText}
                  onChange={(e) => setSummarizeText(e.target.value)}
                  rows={4}
                  placeholder="요약할 긴 문서·리뷰·회의록을 붙여 넣으세요"
                  className="mt-1.5 min-h-[120px] max-h-[min(38vh,280px)] w-full flex-1 resize-y rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 lg:min-h-[min(28vh,320px)] lg:max-h-[min(54vh,480px)]"
                />
              </div>
              <div>
                <p className="font-mono text-xs text-foreground/60">
                  요약 형식·톤 (선택)
                </p>
                <input
                  type="text"
                  value={summarizeStyle}
                  onChange={(e) => setSummarizeStyle(e.target.value)}
                  placeholder="예: 3줄 불릿, 한 문단, 결론 먼저"
                  className="mt-1.5 h-9 w-full rounded-lg border border-white/10 bg-background/40 px-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-foreground/60">
                      Temperature
                    </p>
                    <span className="font-mono text-xs text-foreground/70">
                      {summarizeTemperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={summarizeTemperature}
                    onChange={(e) =>
                      setSummarizeTemperature(
                        parseTemperatureRange(e.target.value, 0.3),
                      )
                    }
                    className="mt-1.5 w-full accent-accent"
                  />
                  <p className="mt-1 text-[11px] leading-snug text-foreground/45">
                    낮을수록 톤이 안정적이고, 높을수록 표현이 달라질 수 있어요.
                  </p>
                </div>
                <div className="flex shrink-0 justify-end sm:pb-0.5">
                  <button
                    type="submit"
                    disabled={isSummarizeLoading || !summarizeText.trim()}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
                      "bg-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_40px_rgba(232, 136, 138,0.22)]",
                    ].join(" ")}
                  >
                    {isSummarizeLoading ? (
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
                        <span>요약 생성 중...</span>
                      </>
                    ) : (
                      <>
                        <span>요약 생성</span>
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col lg:order-2">
              <div className="flex min-h-0 flex-col rounded-2xl border border-accent/25 bg-background/35 p-3 shadow-[inset_0_1px_0_0_rgba(232, 136, 138,0.08)] lg:max-h-[min(58vh,520px)] lg:flex-1 lg:overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium text-accent">
                    요약 결과
                  </p>
                  {isSummarizeLoading ? (
                    <span className="text-[11px] text-foreground/50">
                      생성 중…
                    </span>
                  ) : summarizeResult ? (
                    <span className="text-[11px] text-foreground/50">완료</span>
                  ) : null}
                </div>
                <div className="mt-2.5 min-h-[120px] max-h-[min(38vh,280px)] flex-1 overflow-y-auto rounded-xl border border-white/5 bg-background/40 p-3 lg:min-h-[200px] lg:max-h-none">
                  {isSummarizeLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      요약을 생성하는 중입니다…
                    </p>
                  ) : summarizeResult ? (
                    <div>
                      <div className="mb-3 flex justify-end">
                        {renderCopyButton("summarize", () =>
                          void copyText("summarize", summarizeResult),
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <ChatMarkdown content={summarizeResult} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/45">
                      <span className="text-foreground/65">요약 생성</span>을
                      누르면 이곳에 요약이 표시됩니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : null}

      {selectedApi === "sentiment" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSentimentRun();
          }}
        >
          <div className="flex flex-col gap-2.5 lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-stretch lg:gap-4">
            <div className="flex min-h-0 flex-col gap-2.5 lg:order-1">
              <div className="flex min-h-0 flex-1 flex-col">
                <p className="font-mono text-xs text-foreground/60">
                  리뷰·문장 (필수)
                </p>
                <textarea
                  value={sentimentText}
                  onChange={(e) => setSentimentText(e.target.value)}
                  rows={4}
                  placeholder="예: 치킨은 맛있는데 배송이 너무 늦었어요"
                  className="mt-1.5 min-h-[120px] max-h-[min(38vh,280px)] w-full flex-1 resize-y rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 lg:min-h-[min(28vh,320px)] lg:max-h-[min(54vh,480px)]"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-foreground/60">
                      Temperature
                    </p>
                    <span className="font-mono text-xs text-foreground/70">
                      {sentimentTemperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={sentimentTemperature}
                    onChange={(e) =>
                      setSentimentTemperature(
                        parseTemperatureRange(e.target.value, 0.2),
                      )
                    }
                    className="mt-1.5 w-full accent-accent"
                  />
                  <p className="mt-1 text-[11px] leading-snug text-foreground/45">
                    낮을수록 분류가 안정적이고, 높을수록 표현 변동이 커질 수
                    있어요.
                  </p>
                </div>
                <div className="flex shrink-0 justify-end sm:pb-0.5">
                  <button
                    type="submit"
                    disabled={isSentimentLoading || !sentimentText.trim()}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
                      "bg-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_40px_rgba(232, 136, 138,0.22)]",
                    ].join(" ")}
                  >
                    {isSentimentLoading ? (
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
                        <span>분석 중...</span>
                      </>
                    ) : (
                      <>
                        <span>감정 분석</span>
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col lg:order-2">
              <div className="flex min-h-0 flex-col rounded-2xl border border-accent/25 bg-background/35 p-3 shadow-[inset_0_1px_0_0_rgba(232, 136, 138,0.08)] lg:max-h-[min(58vh,520px)] lg:flex-1 lg:overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium text-accent">
                    분석 결과
                  </p>
                  {isSentimentLoading ? (
                    <span className="text-[11px] text-foreground/50">
                      분석 중…
                    </span>
                  ) : sentimentAnalysis ? (
                    <span className="text-[11px] text-foreground/50">완료</span>
                  ) : null}
                </div>
                <div className="mt-2.5 min-h-[120px] max-h-[min(38vh,280px)] flex-1 overflow-y-auto rounded-xl border border-white/5 bg-background/40 p-3 lg:min-h-[200px] lg:max-h-none">
                  {isSentimentLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      감정을 분석하는 중입니다…
                    </p>
                  ) : sentimentError ? (
                    <p className="text-sm leading-relaxed text-red-300">
                      {sentimentError}
                    </p>
                  ) : sentimentAnalysis ? (
                    <div className="space-y-3 text-sm">
                      <div className="rounded-lg border border-white/10 bg-background/30 px-3 py-2">
                        <p className="font-mono text-[11px] text-foreground/50">
                          전체 (overall)
                        </p>
                        <p className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span
                            className={[
                              "font-semibold uppercase",
                              sentimentAnalysis.overall.label === "positive"
                                ? "text-emerald-300"
                                : sentimentAnalysis.overall.label === "negative"
                                  ? "text-red-300"
                                  : "text-zinc-300",
                            ].join(" ")}
                          >
                            {sentimentAnalysis.overall.label}
                          </span>
                          <span className="font-mono text-foreground/80">
                            score {sentimentAnalysis.overall.score.toFixed(3)}{" "}
                            (0~1)
                          </span>
                        </p>
                      </div>
                      {sentimentAnalysis.aspects.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-white/10">
                          <table className="w-full min-w-[280px] text-left text-[13px]">
                            <thead>
                              <tr className="border-b border-white/10 font-mono text-[11px] text-foreground/50">
                                <th className="px-2 py-2">측면</th>
                                <th className="px-2 py-2">label</th>
                                <th className="px-2 py-2">score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sentimentAnalysis.aspects.map((row, idx) => (
                                <tr
                                  key={`${row.aspect}-${idx}`}
                                  className="border-b border-white/5 last:border-0"
                                >
                                  <td className="px-2 py-2 text-foreground/90">
                                    {row.aspect}
                                  </td>
                                  <td
                                    className={[
                                      "px-2 py-2 font-medium",
                                      row.label === "positive"
                                        ? "text-emerald-300"
                                        : row.label === "negative"
                                          ? "text-red-300"
                                          : "text-zinc-300",
                                    ].join(" ")}
                                  >
                                    {row.label}
                                  </td>
                                  <td className="px-2 py-2 font-mono text-foreground/80">
                                    {row.score.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[12px] text-foreground/45">
                          측면별 항목이 없습니다. 단일 톤의 짧은 문장일 수 있어요.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/45">
                      <span className="text-foreground/65">감정 분석</span>을
                      누르면 이곳에 전체·측면별 결과가 표시됩니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : null}

      {selectedApi === "ner" ? (
        <form
          className="h-full"
          onSubmit={(e) => {
            e.preventDefault();
            handleNerRun();
          }}
        >
          <div className="flex h-full flex-col gap-2 lg:grid lg:min-h-0 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch lg:gap-3">
            <div className="flex min-h-0 flex-col gap-2 lg:order-1 lg:h-full">
              <div className="flex flex-col">
                <p className="font-mono text-xs text-foreground/60">
                  분석할 문장 (필수)
                </p>
                <textarea
                  value={nerText}
                  onChange={(e) => setNerText(e.target.value)}
                  rows={3}
                  placeholder="예: 일정·인명·장소·금액이 섞인 문장을 붙여 넣으세요"
                  className="mt-1.5 min-h-[88px] max-h-[min(24vh,180px)] w-full resize-y rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 lg:min-h-[164px] lg:max-h-[164px] lg:resize-none"
                />
              </div>
              <div className="flex flex-col">
                <p className="font-mono text-xs text-foreground/60">
                  추가 요청사항 (선택)
                </p>
                <textarea
                  value={nerPrompt}
                  onChange={(e) => setNerPrompt(e.target.value)}
                  rows={2}
                  placeholder="예: 인물과 장소만 우선 추출해줘 / 금액과 날짜를 빠짐없이 표시해줘"
                  className="mt-1.5 min-h-[64px] max-h-[min(16vh,112px)] w-full resize-y rounded-xl border border-white/10 bg-background/35 px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 lg:min-h-[112px] lg:max-h-[112px] lg:resize-none"
                />
                <p className="mt-1 text-[11px] leading-snug text-foreground/45 lg:hidden">
                  사용자가 원하는 추출 기준이나 우선순위를 함께 전달할 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-foreground/60">
                      Temperature
                    </p>
                    <span className="font-mono text-xs text-foreground/70">
                      {nerTemperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={nerTemperature}
                    onChange={(e) =>
                      setNerTemperature(
                        parseTemperatureRange(e.target.value, 0.1),
                      )
                    }
                    className="mt-1.5 w-full accent-accent"
                  />
                  <p className="mt-1 text-[11px] leading-snug text-foreground/45 lg:hidden">
                    낮을수록 태그·라벨이 안정적이고, 높을수록 변동이 커질 수
                    있어요.
                  </p>
                </div>
                <div className="flex shrink-0 justify-end sm:pb-0.5">
                  <button
                    type="submit"
                    disabled={isNerLoading || !nerText.trim()}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all lg:min-w-[140px] lg:justify-center",
                      "bg-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_40px_rgba(232, 136, 138,0.22)]",
                    ].join(" ")}
                  >
                    {isNerLoading ? (
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
                        <span>추출 중...</span>
                      </>
                    ) : (
                      <>
                        <span>개체명 추출</span>
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:order-2">
              <div className="flex flex-col rounded-2xl border border-accent/25 bg-background/35 p-3 shadow-[inset_0_1px_0_0_rgba(232, 136, 138,0.08)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium text-accent">
                    추출 결과
                  </p>
                  {isNerLoading ? (
                    <span className="text-[11px] text-foreground/50">
                      추출 중…
                    </span>
                  ) : nerResult ? (
                    <span className="text-[11px] text-foreground/50">완료</span>
                  ) : null}
                </div>
                <div className="mt-2 max-h-[min(40vh,392px)] overflow-y-auto rounded-xl border border-white/5 bg-background/40 px-2.5 pt-2.5 pb-3">
                  {isNerLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      개체를 추출하는 중입니다…
                    </p>
                  ) : nerError ? (
                    <p className="text-sm leading-relaxed text-red-300">
                      {nerError}
                    </p>
                  ) : nerResult ? (
                    nerResult.entities.length > 0 ? (
                      <div className="mb-0.5 overflow-x-auto rounded-lg border border-white/10">
                        <table className="w-full min-w-[320px] text-left text-[12px] lg:text-[11px]">
                          <thead>
                            <tr className="border-b border-white/10 font-mono text-[10px] text-foreground/50">
                              <th className="px-2 py-1.5">표면</th>
                              <th className="px-2 py-1.5">label</th>
                              <th className="px-2 py-1.5">category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nerResult.entities.map((row, idx) => (
                              <tr
                                key={`${row.text}-${row.label}-${idx}`}
                                className="border-b border-white/5 last:border-0"
                              >
                                <td className="truncate px-2 py-1.5 text-foreground/90">
                                  {row.text}
                                </td>
                                <td className="px-2 py-1.5 font-mono text-accent/90">
                                  {row.label}
                                </td>
                                <td className="truncate px-2 py-1.5 text-foreground/80">
                                  {row.category}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[12px] text-foreground/45">
                        추출된 개체가 없습니다. 문장을 조금 더 구체적으로 적어
                        보세요.
                      </p>
                    )
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/45">
                      <span className="text-foreground/65">개체명 추출</span>을
                      누르면 이곳에 표면·라벨·범주가 표시됩니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : null}

      {selectedApi === "textToSql" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTextToSqlRun();
          }}
        >
          <div className="flex flex-col gap-2.5 lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-stretch lg:gap-4">
            <div className="flex min-h-0 flex-col gap-2.5 lg:order-1">
              <div className="flex min-h-0 flex-1 flex-col">
                <p className="font-mono text-xs text-foreground/60">
                  자연어 질문 (필수)
                </p>
                <textarea
                  value={textToSqlText}
                  onChange={(e) => setTextToSqlText(e.target.value)}
                  rows={4}
                  placeholder="예: 지난달 서울 지역 매출 상위 상품 5개를 보여줘"
                  className="mt-1.5 min-h-[120px] max-h-[min(38vh,280px)] w-full flex-1 resize-y rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 lg:min-h-[min(28vh,320px)] lg:max-h-[min(54vh,480px)]"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-foreground/60">
                      Temperature
                    </p>
                    <span className="font-mono text-xs text-foreground/70">
                      {textToSqlTemperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={textToSqlTemperature}
                    onChange={(e) =>
                      setTextToSqlTemperature(
                        parseTemperatureRange(e.target.value, 0.2),
                      )
                    }
                    className="mt-1.5 w-full accent-accent"
                  />
                  <p className="mt-1 text-[11px] leading-snug text-foreground/45">
                    낮을수록 SQL 문법이 안정적이고, 높을수록 표현이 달라질 수
                    있어요.
                  </p>
                </div>
                <div className="flex shrink-0 justify-end sm:pb-0.5">
                  <button
                    type="submit"
                    disabled={isTextToSqlLoading || !textToSqlText.trim()}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
                      "bg-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_40px_rgba(232, 136, 138,0.22)]",
                    ].join(" ")}
                  >
                    {isTextToSqlLoading ? (
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
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <span>SQL 생성</span>
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col lg:order-2">
              <div className="flex min-h-0 flex-col rounded-2xl border border-accent/25 bg-background/35 p-3 shadow-[inset_0_1px_0_0_rgba(232, 136, 138,0.08)] lg:max-h-[min(58vh,520px)] lg:flex-1 lg:overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium text-accent">
                    생성된 SQL
                  </p>
                  {isTextToSqlLoading ? (
                    <span className="text-[11px] text-foreground/50">
                      생성 중…
                    </span>
                  ) : textToSqlResult ? (
                    <span className="text-[11px] text-foreground/50">완료</span>
                  ) : null}
                </div>
                <div className="mt-2.5 min-h-[120px] max-h-[min(38vh,280px)] flex-1 overflow-y-auto rounded-xl border border-white/5 bg-background/40 p-3 lg:min-h-[200px] lg:max-h-none">
                  {isTextToSqlLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      SQL을 생성하는 중입니다…
                    </p>
                  ) : textToSqlError ? (
                    <p className="text-sm leading-relaxed text-red-300">
                      {textToSqlError}
                    </p>
                  ) : textToSqlResult ? (
                    <div>
                      <div className="mb-3 flex justify-end">
                        {renderCopyButton("textToSql", () =>
                          void copyText("textToSql", textToSqlResult.sql),
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground/90">
                        {textToSqlResult.sql}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/45">
                      <span className="text-foreground/65">SQL 생성</span>을
                      누르면 이곳에 쿼리가 표시됩니다.
                    </p>
                  )}
                </div>
              </div>
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
                rows={2}
                className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-foreground/60">
                버튼 클릭 시 실제 임베딩을 생성합니다.
              </p>
              <button
                type="submit"
                disabled={isEmbeddingLoading || !embeddingText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(232, 136, 138,0.22)] hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEmbeddingLoading ? (
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
                    <span>생성 중...</span>
                  </>
                ) : (
                  <span>임베딩 생성</span>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {selectedApi === "tts" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTtsRun();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-foreground/60">언어</p>
                <select
                  value={ttsLanguage}
                  onChange={(e) => setTtsLanguage(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-background/40 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                >
                  {ttsLanguageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-foreground/60">Speaker</p>
                <select
                  value={ttsSpeaker}
                  onChange={(e) => setTtsSpeaker(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-background/40 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                >
                  {ttsSpeakerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <p className="font-mono text-xs text-foreground/60">
                Style Instruction (Optional)
              </p>
              <input
                value={ttsStyleInstruction}
                onChange={(e) => setTtsStyleInstruction(e.target.value)}
                placeholder="e.g., Speak in a cheerful and energetic tone"
                className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-background/40 px-4 text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <p className="font-mono text-xs text-foreground/60">
                읽어줄 텍스트
              </p>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-[13px] leading-snug text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-foreground/55">
                Mock 합성 후 blob 오디오 재생 · 콘솔에 더미 응답이 표시됩니다.
              </p>
              <button
                type="submit"
                disabled={isTtsSynthesizing || !ttsText.trim()}
                className={[
                  "inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm text-background font-medium shadow-[0_0_40px_rgba(232, 136, 138,0.22)] transition-opacity",
                  isTtsSynthesizing || !ttsText.trim()
                    ? "cursor-not-allowed opacity-50"
                    : "hover:opacity-90",
                ].join(" ")}
              >
                {isTtsSynthesizing ? (
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
                    <span>합성 중…</span>
                  </>
                ) : (
                  <span>합성</span>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {selectedApi === "stt" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="flex-[4] min-w-0">
              <p className="font-mono text-xs text-foreground/60">
                음성 파일 업로드 (선택)
              </p>
              <label
                className={[
                  "mt-2 block cursor-pointer rounded-xl border border-dashed px-3 py-3 transition-colors relative",
                  sttFileName
                    ? "border-accent/40 bg-accent/5"
                    : "border-white/10 bg-background/30 hover:border-accent/30",
                ].join(" ")}
              >
                <input
                  type="file"
                  accept="audio/*"
                  ref={sttFileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    onSttFileChange(f);
                  }}
                />

                {sttUploadClearMounted ? (
                  <button
                    type="button"
                    aria-label="업로드 파일 지우기"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSttUploadClear();
                    }}
                    className={[
                      "absolute right-3 top-3 flex h-6 w-6 items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors",
                      "transition-all duration-180 ease-out will-change-transform",
                      sttFileName
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 -translate-y-1 scale-95 pointer-events-none",
                    ].join(" ")}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}

                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-background/20 text-foreground/80">
                    <IconUpload className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {sttFileName ? sttFileName : "파일 선택"}
                    </p>
                    {sttFileName ? (
                      <p className="mt-1 text-xs text-accent">
                        변환 준비 완료
                      </p>
                    ) : null}
                    <p className="text-xs text-foreground/60">
                      audio/* 지원 (UI 데모)
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <div className="w-full flex-[6] min-w-0">
              <p className="font-mono text-xs text-foreground/60">
                마이크 녹음 (선택)
              </p>
              <button
                type="button"
                onClick={onSttMicToggle}
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  isRecording
                    ? "border-red-500/40 bg-red-500/10 text-[#ef4444]"
                    : "border-white/10 bg-background/30 text-foreground/80 hover:border-accent/30",
                ].join(" ")}
              >
                <span className="inline-flex flex-wrap items-center gap-2 justify-center">
                  <IconMic className="h-5 w-5" />
                  {isRecording ? "녹음 중지" : "녹음 시작"}
                  {isRecording ? (
                    <span className="ml-3 inline-flex items-center gap-3">
                      <div
                        className="flex items-end gap-[2px] h-4 w-[56px]"
                        aria-hidden="true"
                      >
                        {sttMicBars.map((h, idx) => {
                          const mint =
                            h >
                            STT_WAVE_BAR_MIN_HEIGHT_PX +
                              (STT_WAVE_BAR_MAX_HEIGHT_PX -
                                STT_WAVE_BAR_MIN_HEIGHT_PX) *
                                0.35;
                          return (
                            <div
                              key={idx}
                              className="w-[6px] rounded-sm"
                              style={{
                                height: h,
                                backgroundColor: mint
                                  ? "#e8888a"
                                  : "rgba(239,68,68,0.65)",
                              }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-semibold text-red-300 leading-tight break-words max-w-[140px]">
                        목소리를 듣고 있습니다...
                      </span>
                    </span>
                  ) : null}
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-background/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-foreground/60">STT 옵션</p>
              <span className="rounded-lg border border-white/10 bg-background/30 px-2 py-0.5 text-[11px] font-mono text-foreground/60">
                실시간 동기화
              </span>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <p className="font-mono text-xs text-foreground/60">언어</p>
                <div ref={sttLangDropdownRootRef} className="relative">
                  <div className="relative">
                    <input
                      ref={sttLangInputRef}
                      type="text"
                      value={sttLangQuery}
                      onChange={(e) => {
                        setSttLangQuery(e.target.value);
                        setSttLangDropdownOpen(true);
                      }}
                      onFocus={() => setSttLangDropdownOpen(true)}
                      onBlur={(e) => {
                        const next = e.relatedTarget as Node | null;
                        window.setTimeout(() => {
                          const root = sttLangDropdownRootRef.current;
                          if (root && next && root.contains(next)) return;
                          setSttLangDropdownOpen(false);
                        }, 120);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (sttLangOptions.length > 0) {
                            const next = sttLangOptions[0];
                            setSttLanguage(next);
                            setSttLangQuery(getSttLanguageLabel(next));
                            setSttLangDropdownOpen(false);
                          }
                        }
                        if (e.key === "Escape") {
                          setSttLangQuery(getSttLanguageLabel(sttLanguage));
                          setSttLangDropdownOpen(false);
                        }
                      }}
                      placeholder="언어 코드/이름 검색"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-background/40 px-3 py-2 pr-3 text-sm text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                    />
                  </div>

                  {sttLangDropdownOpen ? (
                    <div
                      className="absolute left-0 right-0 z-50 mt-2 max-h-[250px] overflow-y-auto rounded-xl border border-white/10 bg-background/60 backdrop-blur-xl shadow-lg"
                      role="listbox"
                    >
                      <div className="py-1">
                        {sttLangOptions.length ? (
                          sttLangOptions.map((code) => (
                            <button
                              key={code}
                              type="button"
                              role="option"
                              aria-selected={sttLanguage === code}
                              onClick={() => {
                                setSttLanguage(code);
                                setSttLangQuery(getSttLanguageLabel(code));
                                setSttLangDropdownOpen(false);
                              }}
                              className={[
                                "w-full px-3 py-2 text-left text-sm leading-tight transition-colors",
                                "break-words whitespace-normal",
                                sttLanguage === code
                                  ? "text-accent"
                                  : "text-foreground/80 hover:bg-accent/10",
                              ].join(" ")}
                            >
                              {getSttLanguageLabel(code)}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-foreground/60">
                            검색 결과 없음
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <p className="font-mono text-xs text-foreground/60">
                    무음 필터(VAD)
                  </p>
                  <SttHelpTooltip
                    id="vad"
                    pinnedId={sttTooltipPinned}
                    setPinnedId={setSttTooltipPinned}
                    hoverId={sttTooltipHoverId}
                    setHoverId={setSttTooltipHoverId}
                    content="음성 활동 감지 기능입니다. 오디오에서 목소리가 없는 구간이나 배경 소음을 지능적으로 제외하여, 음성 인식의 정확도를 높이고 처리 속도를 단축시킵니다."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSttVadOn((v) => !v)}
                  className={[
                    "mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    sttVadOn
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-white/10 bg-background/30 text-foreground/80 hover:border-accent/30",
                  ].join(" ")}
                >
                  {sttVadOn ? "On" : "Off"}
                </button>
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <p className="font-mono text-xs text-foreground/60">
                    정밀도(Beam)
                  </p>
                  <SttHelpTooltip
                    id="beam"
                    pinnedId={sttTooltipPinned}
                    setPinnedId={setSttTooltipPinned}
                    hoverId={sttTooltipHoverId}
                    setHoverId={setSttTooltipHoverId}
                    content="문장 탐색의 폭을 조절합니다. 값이 높을수록 AI가 더 많은 문장 후보를 검토하여 정확도가 올라가지만, 변환 완료까지 시간이 조금 더 소요될 수 있습니다."
                  />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={sttBeamSize}
                    onChange={(e) =>
                      setSttBeamSize(
                        Number(e.target.value) || STT_DEFAULT_BEAM_SIZE,
                      )
                    }
                    className="w-full accent-accent"
                  />
                  <span className="font-mono text-xs text-foreground/70">
                    {sttBeamSize}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-foreground/60">
              선택한 설정으로 STT 변환을 수행합니다.
            </p>
            <button
              type="button"
              onClick={() => void onSttRun()}
              disabled={isSttLoading || isRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(232, 136, 138,0.22)] hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSttLoading ? (
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
                  <span>변환 중...</span>
                </>
              ) : (
                "변환하기"
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
