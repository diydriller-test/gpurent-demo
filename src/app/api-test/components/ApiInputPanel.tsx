import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type CustomSelectOption = {
  value: string;
  label: string;
};

function CustomSelect({
  value,
  onChange,
  options,
  className,
  triggerClassName,
  optionClassName,
  panelClassName,
  openDirection = "down",
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly CustomSelectOption[];
  className?: string;
  triggerClassName?: string;
  optionClassName?: string;
  panelClassName?: string;
  openDirection?: "down" | "up";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);
  const listboxId = useId();
  const selected =
    options.find((option) => option.value === value) ?? options[0] ?? null;
  const selectedLabel = selected?.label ?? value;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => {
        const label = option.label.toLowerCase();
        const optionValue = option.value.toLowerCase();
        return (
          label.includes(normalizedQuery) || optionValue.includes(normalizedQuery)
        );
      })
    : options;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function updatePanelPosition() {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const panelMaxHeight = 256;
      const gap = 8;
      const top =
        openDirection === "up"
          ? Math.max(8, rect.top - panelMaxHeight - gap)
          : rect.bottom + gap;

      setPanelStyle({
        position: "fixed",
        left: rect.left,
        top,
        width: rect.width,
        maxHeight: panelMaxHeight,
        zIndex: 2000,
      });
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, openDirection]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const root = rootRef.current;
      const panel = panelRef.current;
      const target = event.target as Node;
      if (!root) return;
      if (root.contains(target) || (panel && panel.contains(target))) return;
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery(selectedLabel);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, selectedLabel]);

  return (
    <div ref={rootRef} className={["relative", className ?? ""].join(" ")}>
      <div
        className={[
          "relative h-full w-full rounded-xl text-left outline-none transition-colors",
          triggerClassName ?? "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={open ? query : selectedLabel}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onClick={() => {
            if (!open) setQuery("");
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
            if (e.key === "Enter") {
              if (!open) {
                setOpen(true);
                return;
              }
              const first = filteredOptions[0];
              if (first) {
                onChange(first.value);
                setQuery(first.label);
                setOpen(false);
              }
            }
            if (e.key === "Escape") {
              setOpen(false);
              setQuery(selectedLabel);
            }
          }}
          className="h-full w-full bg-transparent px-3 py-2 pr-10 text-[13px] leading-normal text-foreground outline-none placeholder:text-foreground/35"
          placeholder={selectedLabel || "입력 또는 선택"}
        />
        <button
          type="button"
          aria-label={open ? "옵션 닫기" : "옵션 열기"}
          onClick={() => {
            if (!open) setQuery("");
            setOpen((prev) => !prev);
          }}
          className="absolute inset-y-0 right-3 flex items-center justify-center text-foreground/70"
        >
          <ChevronDownIcon
            className={[
              "h-4 w-4 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>

      {open && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              id={listboxId}
              role="listbox"
              style={panelStyle}
              className={[
                "overflow-y-auto rounded-xl backdrop-blur-xl",
                panelClassName ??
                  "border border-accent/18 bg-[rgba(18,14,14,0.95)] shadow-[0_20px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(232,136,138,0.08)]",
              ].join(" ")}
            >
              <div className="py-1.5">
                {filteredOptions.length ? (
                  filteredOptions.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={() => {
                          onChange(option.value);
                          setQuery(option.label);
                          setOpen(false);
                          inputRef.current?.blur();
                        }}
                        className={[
                          "w-full px-3 py-2.5 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-accent/12 text-accent"
                            : "text-foreground/80 hover:bg-white/5 hover:text-foreground",
                          optionClassName ?? "",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2.5 text-sm text-foreground/50">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

type SttHelpTooltipId = "vad" | "beam";

type Props = {
  selectedApi: ApiId;

  // LLM input
  onSend: React.FormEventHandler<HTMLFormElement>;
  prompt: string;
  llmSystemPrompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  setLlmSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
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
  textToSqlDdl: string;
  setTextToSqlDdl: React.Dispatch<React.SetStateAction<string>>;
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

  // Voice Clone input
  handleVcRun: () => void;
  vcText: string;
  setVcText: React.Dispatch<React.SetStateAction<string>>;
  vcLanguage: string;
  setVcLanguage: React.Dispatch<React.SetStateAction<string>>;
  vcLanguageOptions: Array<{ value: string; label: string }>;
  vcXVectorOnly: boolean;
  setVcXVectorOnly: React.Dispatch<React.SetStateAction<boolean>>;
  vcRefText: string;
  setVcRefText: React.Dispatch<React.SetStateAction<string>>;
  vcRefAudioFileInputRef: React.RefObject<HTMLInputElement | null>;
  vcRefFileName: string | null;
  onVcRefAudioChange: (file: File | null) => void;
  onVcRefAudioClear: () => void;
  isVcSynthesizing: boolean;

  // Image2Text input
  handleImage2TextRun: () => void;
  image2textPrompt: string;
  setImage2TextPrompt: React.Dispatch<React.SetStateAction<string>>;
  image2textFileInputRef: React.RefObject<HTMLInputElement | null>;
  image2textFileName: string | null;
  onImage2TextFileChange: (file: File | null) => void;
  onImage2TextFileClear: () => void;
  image2textIsLoading: boolean;
};

export function ApiInputPanel({
  selectedApi,

  onSend,
  prompt,
  llmSystemPrompt,
  setPrompt,
  setLlmSystemPrompt,
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
  textToSqlDdl,
  setTextToSqlDdl,
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

  handleVcRun,
  vcText,
  setVcText,
  vcLanguage,
  setVcLanguage,
  vcLanguageOptions,
  vcXVectorOnly,
  setVcXVectorOnly,
  vcRefText,
  setVcRefText,
  vcRefAudioFileInputRef,
  vcRefFileName,
  onVcRefAudioChange,
  onVcRefAudioClear,
  isVcSynthesizing,

  handleImage2TextRun,
  image2textPrompt,
  setImage2TextPrompt,
  image2textFileInputRef,
  image2textFileName,
  onImage2TextFileChange,
  onImage2TextFileClear,
  image2textIsLoading,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [llmAdvancedOpen, setLlmAdvancedOpen] = useState(false);
  const [sttLangPanelStyle, setSttLangPanelStyle] =
    useState<React.CSSProperties | null>(null);
  const sttLangPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedApi !== "llm") return;
    if (llmSystemPrompt.trim()) {
      setLlmAdvancedOpen(true);
    }
  }, [selectedApi, llmSystemPrompt]);

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

  const selectShellClassName =
    "relative mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(232,136,138,0.04)] transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25";

  useEffect(() => {
    if (!sttLangDropdownOpen) return;

    function updateSttLangPanelPosition() {
      const root = sttLangDropdownRootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      setSttLangPanelStyle({
        position: "fixed",
        left: rect.left,
        top: rect.bottom + 8,
        width: rect.width,
        maxHeight: 250,
        zIndex: 2000,
      });
    }

    updateSttLangPanelPosition();
    window.addEventListener("resize", updateSttLangPanelPosition);
    window.addEventListener("scroll", updateSttLangPanelPosition, true);
    return () => {
      window.removeEventListener("resize", updateSttLangPanelPosition);
      window.removeEventListener("scroll", updateSttLangPanelPosition, true);
    };
  }, [sttLangDropdownOpen, sttLangDropdownRootRef]);

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
                <p className="mt-2 pl-1 text-[11px] leading-relaxed text-foreground/45">
                  질문을 먼저 바로 보내고, 필요할 때만 아래 고급 설정에서
                  응답 스타일을 세밀하게 조정하세요.
                </p>
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

            <div className="rounded-xl border border-white/8 bg-background/15">
              <button
                type="button"
                onClick={() => setLlmAdvancedOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:text-accent-bright"
                aria-expanded={llmAdvancedOpen}
                aria-controls="llm-advanced-settings"
              >
                <div>
                  <p className="font-mono text-xs text-foreground/70">
                    고급 설정
                  </p>
                  <p className="mt-1 text-[11px] text-foreground/40">
                    System Prompt, Temperature
                  </p>
                </div>
                <span
                  className={[
                    "text-sm text-foreground/55 transition-transform",
                    llmAdvancedOpen ? "rotate-180" : "",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </button>

              <div
                id="llm-advanced-settings"
                className={[
                  "grid transition-all duration-200 ease-out",
                  llmAdvancedOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                ].join(" ")}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-white/6 px-4 pb-4 pt-3">
                    <div>
                      <label
                        className="font-mono text-xs text-foreground/60"
                        htmlFor="llm-system-prompt"
                      >
                        System Prompt (선택)
                      </label>
                      <textarea
                        id="llm-system-prompt"
                        value={llmSystemPrompt}
                        onChange={(e) => setLlmSystemPrompt(e.target.value)}
                        rows={3}
                        placeholder="예: 너는 AI 제품 기획 문서만 작성하는 한국어 전문가야."
                        className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                      />
                      <p className="mt-2 text-[11px] leading-relaxed text-foreground/40">
                        답변의 역할, 문체, 형식을 지정할 때만 사용하세요.
                      </p>
                    </div>

                    <div className="mt-4">
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
                          setLlmTemperature(
                            parseTemperatureRange(e.target.value, 0.1),
                          )
                        }
                        className="mt-2 w-full accent-accent"
                      />
                      <p className="mt-2 text-[11px] leading-relaxed text-foreground/45">
                        낮으면 더 안정적으로, 높으면 더 다양하게 답합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className={`${selectShellClassName} h-10 overflow-visible`}>
                  <CustomSelect
                    value={adCopyLanguage}
                    onChange={setAdCopyLanguage}
                    options={AD_COPY_LANGUAGE_OPTIONS}
                    triggerClassName="h-full text-sm text-foreground"
                  />
                </div>
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
                    "group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
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
                  <div className="flex items-center gap-2">
                    {isAdCopyLoading ? (
                      <span className="text-[11px] text-foreground/50">
                        생성 중…
                      </span>
                    ) : adCopyResult ? (
                      <span className="text-[11px] text-foreground/50">완료</span>
                    ) : null}
                    {!isAdCopyLoading && adCopyResult
                      ? renderCopyButton("adCopy", () =>
                          void copyText("adCopy", adCopyResult),
                        )
                      : null}
                  </div>
                </div>
                <div className="mt-2.5 min-h-[120px] max-h-[min(38vh,280px)] overflow-y-auto rounded-xl border border-white/5 bg-background/40 p-3 lg:min-h-[200px] lg:max-h-none lg:flex-1">
                  {isAdCopyLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      카피를 생성하는 중입니다…
                    </p>
                  ) : adCopyResult ? (
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <ChatMarkdown content={adCopyResult} />
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
                      "group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
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
                  <div className="flex items-center gap-2">
                    {isSummarizeLoading ? (
                      <span className="text-[11px] text-foreground/50">
                        생성 중…
                      </span>
                    ) : summarizeResult ? (
                      <span className="text-[11px] text-foreground/50">완료</span>
                    ) : null}
                    {!isSummarizeLoading && summarizeResult
                      ? renderCopyButton("summarize", () =>
                          void copyText("summarize", summarizeResult),
                        )
                      : null}
                  </div>
                </div>
                <div className="mt-2.5 min-h-[120px] max-h-[min(38vh,280px)] flex-1 overflow-y-auto rounded-xl border border-white/5 bg-background/40 p-3 lg:min-h-[200px] lg:max-h-none">
                  {isSummarizeLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      요약을 생성하는 중입니다…
                    </p>
                  ) : summarizeResult ? (
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <ChatMarkdown content={summarizeResult} />
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
                      "group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
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
                  ) : sentimentError ? (
                    <span className="text-[11px] text-red-400">오류</span>
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
                <p className="mt-1 text-[11px] leading-snug text-foreground/45">
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
                  <p className="mt-1 text-[11px] leading-snug text-foreground/45">
                    낮을수록 태그·라벨이 안정적이고, 높을수록 변동이 커질 수
                    있어요.
                  </p>
                </div>
                <div className="flex shrink-0 justify-end sm:pb-0.5">
                  <button
                    type="submit"
                    disabled={isNerLoading || !nerText.trim()}
                    className={[
                      "group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all lg:min-w-[140px] lg:justify-center",
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
                  ) : nerError ? (
                    <span className="text-[11px] text-red-400">오류</span>
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
          <div className="flex flex-col gap-2 lg:grid lg:min-h-0 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch lg:gap-3">
            <div className="flex min-h-0 flex-col gap-1.5 lg:order-1">
              <div className="flex min-h-0 flex-col">
                <p className="font-mono text-xs text-foreground/60">
                  자연어 질문 (필수)
                </p>
                <textarea
                  value={textToSqlText}
                  onChange={(e) => setTextToSqlText(e.target.value)}
                  rows={3}
                  placeholder="예: 지난달 서울 지역 매출 상위 상품 5개를 보여줘"
                  className="mt-1 min-h-[96px] max-h-[124px] w-full resize-y rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 lg:min-h-[132px] lg:max-h-[168px]"
                />
              </div>

              <div className="flex min-h-0 flex-col">
                <p className="font-mono text-xs text-foreground/60">
                  DDL 스키마 (선택)
                </p>
                <textarea
                  value={textToSqlDdl}
                  onChange={(e) => setTextToSqlDdl(e.target.value)}
                  rows={2}
                  placeholder={"예:\nCREATE TABLE users (\n  id BIGINT PRIMARY KEY,\n  name VARCHAR(255)\n);"}
                  className="mt-1 min-h-[74px] max-h-[98px] w-full resize-y rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 lg:min-h-[90px] lg:max-h-[110px]"
                />
                <p className="mt-1 text-[10px] leading-snug text-foreground/40">
                  테이블/컬럼 정의를 프롬프트에 함께 포함합니다.
                </p>
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
                    className="mt-1 w-full accent-accent"
                  />
                  <p className="mt-1 text-[10px] leading-snug text-foreground/40">
                    낮을수록 SQL 문법이 안정적이고, 높을수록 표현이 달라질 수
                    있어요.
                  </p>
                </div>
                <div className="flex shrink-0 justify-end sm:pb-0.5">
                  <button
                    type="submit"
                    disabled={isTextToSqlLoading || !textToSqlText.trim()}
                    className={[
                      "group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-all",
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
              <div className="flex min-h-0 flex-col rounded-2xl border border-accent/25 bg-background/35 p-3 shadow-[inset_0_1px_0_0_rgba(232, 136, 138,0.08)] lg:flex-1 lg:overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium text-accent">
                    생성된 SQL
                  </p>
                  <div className="flex items-center gap-2">
                    {isTextToSqlLoading ? (
                      <span className="text-[11px] text-foreground/50">
                        생성 중…
                      </span>
                    ) : textToSqlError ? (
                      <span className="text-[11px] text-red-400">오류</span>
                    ) : textToSqlResult ? (
                      <span className="text-[11px] text-foreground/50">완료</span>
                    ) : null}
                    {!isTextToSqlLoading && textToSqlResult
                      ? renderCopyButton("textToSql", () =>
                          void copyText("textToSql", textToSqlResult.sql),
                        )
                      : null}
                  </div>
                </div>
                <div className="mt-2 min-h-[210px] max-h-[min(38vh,320px)] flex-1 overflow-y-auto rounded-xl border border-white/5 bg-background/40 p-3 lg:min-h-[300px] lg:max-h-none">
                  {isTextToSqlLoading ? (
                    <p className="text-sm leading-relaxed text-foreground/55">
                      SQL을 생성하는 중입니다…
                    </p>
                  ) : textToSqlError ? (
                    <p className="text-sm leading-relaxed text-red-300">
                      {textToSqlError}
                    </p>
                  ) : textToSqlResult ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground/90">
                      {textToSqlResult.sql}
                    </pre>
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
                placeholder="예: 오늘 날씨가 참 맑고 화창하네요."
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
                className="group inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-background shadow-[0_0_40px_rgba(232, 136, 138,0.22)] hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
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
                  <>
                    <span>임베딩 생성</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
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
                <div className="relative mt-1 h-9 overflow-visible rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(232,136,138,0.04)] transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25">
                  <CustomSelect
                    value={ttsLanguage}
                    onChange={setTtsLanguage}
                    options={ttsLanguageOptions}
                    triggerClassName="h-full text-[13px] text-foreground"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-foreground/60">Speaker</p>
                <div className="relative mt-1 h-9 overflow-visible rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(232,136,138,0.04)] transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25">
                  <CustomSelect
                    value={ttsSpeaker}
                    onChange={setTtsSpeaker}
                    options={ttsSpeakerOptions}
                    triggerClassName="h-full text-[13px] text-foreground"
                    panelClassName="border border-accent/22 bg-[rgba(18,14,14,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(232,136,138,0.12),0_0_30px_rgba(232,136,138,0.12)]"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="font-mono text-xs text-foreground/60">
                스타일 지시 (선택)
              </p>
              <input
                value={ttsStyleInstruction}
                onChange={(e) => setTtsStyleInstruction(e.target.value)}
                placeholder="예: 밝고 활기찬 톤으로 말해줘"
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
                placeholder="예: 안녕하세요, 오늘도 좋은 하루 되세요."
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-[13px] leading-snug text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
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
                  <span>음성 합성</span>
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
                      onFocus={() => {
                        setSttLangQuery("");
                        setSttLangDropdownOpen(true);
                      }}
                      onClick={() => {
                        if (!sttLangDropdownOpen) setSttLangQuery("");
                        setSttLangDropdownOpen(true);
                      }}
                      onBlur={(e) => {
                        const next = e.relatedTarget as Node | null;
                        window.setTimeout(() => {
                          const root = sttLangDropdownRootRef.current;
                          const panel = sttLangPanelRef.current;
                          if (
                            (root && next && root.contains(next)) ||
                            (panel && next && panel.contains(next))
                          ) {
                            return;
                          }
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
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-3 py-2 pr-10 text-sm text-foreground outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(232,136,138,0.04)] transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 mt-2 flex w-10 items-center justify-center text-foreground/55">
                      <ChevronDownIcon
                        className={[
                          "h-4 w-4 transition-transform",
                          sttLangDropdownOpen ? "rotate-180 text-accent" : "",
                        ].join(" ")}
                      />
                    </div>
                  </div>

                  {sttLangDropdownOpen && sttLangPanelStyle
                    ? createPortal(
                        <div
                          ref={sttLangPanelRef}
                          style={sttLangPanelStyle}
                          className="overflow-y-auto rounded-xl border border-accent/18 bg-[rgba(18,14,14,0.95)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(232,136,138,0.08)]"
                          role="listbox"
                        >
                          <div className="py-1.5">
                            {sttLangOptions.length ? (
                              sttLangOptions.map((code) => (
                                <button
                                  key={code}
                                  type="button"
                                  role="option"
                                  aria-selected={sttLanguage === code}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                  }}
                                  onClick={() => {
                                    setSttLanguage(code);
                                    setSttLangQuery(getSttLanguageLabel(code));
                                    setSttLangDropdownOpen(false);
                                  }}
                                  className={[
                                    "w-full px-3 py-2.5 text-left text-sm leading-tight transition-colors",
                                    "break-words whitespace-normal",
                                    sttLanguage === code
                                      ? "bg-accent/12 text-accent"
                                      : "text-foreground/80 hover:bg-white/5 hover:text-foreground",
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
                        </div>,
                        document.body,
                      )
                    : null}
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

      {selectedApi === "voiceClone" ? (
        <VoiceCloneSection
          vcRefFileName={vcRefFileName}
          vcRefAudioFileInputRef={vcRefAudioFileInputRef}
          onVcRefAudioChange={onVcRefAudioChange}
          onVcRefAudioClear={onVcRefAudioClear}
          vcLanguage={vcLanguage}
          setVcLanguage={setVcLanguage}
          vcLanguageOptions={vcLanguageOptions}
          vcXVectorOnly={vcXVectorOnly}
          setVcXVectorOnly={setVcXVectorOnly}
          vcRefText={vcRefText}
          setVcRefText={setVcRefText}
          vcText={vcText}
          setVcText={setVcText}
          isVcSynthesizing={isVcSynthesizing}
          handleVcRun={handleVcRun}
          IconUpload={IconUpload}
          IconMic={IconMic}
        />
      ) : null}

      {selectedApi === "image2text" ? (
        <Image2TextSection
          image2textFileInputRef={image2textFileInputRef}
          image2textFileName={image2textFileName}
          onImage2TextFileChange={onImage2TextFileChange}
          onImage2TextFileClear={onImage2TextFileClear}
          image2textPrompt={image2textPrompt}
          setImage2TextPrompt={setImage2TextPrompt}
          image2textIsLoading={image2textIsLoading}
          handleImage2TextRun={handleImage2TextRun}
          IconUpload={IconUpload}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VoiceCloneSection — 파일 업로드 + 마이크 녹음 통합 UI
// ---------------------------------------------------------------------------

type VoiceCloneSectionProps = {
  vcRefFileName: string | null;
  vcRefAudioFileInputRef: React.RefObject<HTMLInputElement | null>;
  onVcRefAudioChange: (file: File | null) => void;
  onVcRefAudioClear: () => void;
  vcLanguage: string;
  setVcLanguage: React.Dispatch<React.SetStateAction<string>>;
  vcLanguageOptions: Array<{ value: string; label: string }>;
  vcXVectorOnly: boolean;
  setVcXVectorOnly: React.Dispatch<React.SetStateAction<boolean>>;
  vcRefText: string;
  setVcRefText: React.Dispatch<React.SetStateAction<string>>;
  vcText: string;
  setVcText: React.Dispatch<React.SetStateAction<string>>;
  isVcSynthesizing: boolean;
  handleVcRun: () => void;
  IconUpload: React.ComponentType<{ className?: string }>;
  IconMic: React.ComponentType<{ className?: string }>;
};

function VoiceCloneSection({
  vcRefFileName,
  vcRefAudioFileInputRef,
  onVcRefAudioChange,
  onVcRefAudioClear,
  vcLanguage,
  setVcLanguage,
  vcLanguageOptions,
  vcXVectorOnly,
  setVcXVectorOnly,
  vcRefText,
  setVcRefText,
  vcText,
  setVcText,
  isVcSynthesizing,
  handleVcRun,
  IconUpload,
  IconMic,
}: VoiceCloneSectionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopTimer();
    setIsRecording(false);
  }, [stopTimer]);

  // 최대 60초 자동 중지
  useEffect(() => {
    if (isRecording && recordingSecs >= 60) {
      stopRecording();
    }
  }, [isRecording, recordingSecs, stopRecording]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopTimer]);

  async function startRecording() {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        const ext = mr.mimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `recording.${ext}`, {
          type: blob.type,
        });
        onVcRefAudioChange(file);
      };

      mr.start(100);
      setRecordingSecs(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSecs((s) => s + 1);
      }, 1000);
    } catch {
      setRecordingError("마이크 접근 권한이 필요합니다.");
    }
  }

  const fmtSecs = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleVcRun();
      }}
    >
      <div className="flex flex-col gap-3">
        {/* 참조 음성 */}
        <div>
          <p className="font-mono text-xs text-foreground/60">참조 음성</p>
          <p className="mt-0.5 text-[11px] text-foreground/40">WAV · MP3 · OGG · WebM · M4A</p>
          <div className="mt-1 flex items-center gap-2">
            {/* 파일 업로드 */}
            <input
              ref={vcRefAudioFileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                onVcRefAudioChange(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={isRecording}
              onClick={() => vcRefAudioFileInputRef.current?.click()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-[13px] text-foreground/80 transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconUpload className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {!isRecording && vcRefFileName ? vcRefFileName : "파일 선택"}
              </span>
            </button>

            {/* 녹음 버튼 */}
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span>{fmtSecs(recordingSecs)}</span>
                <span>중지</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-[13px] text-foreground/80 transition-colors hover:border-accent/50 hover:text-accent"
              >
                <IconMic className="h-4 w-4 shrink-0" />
                <span>녹음</span>
              </button>
            )}

            {/* 초기화 */}
            {vcRefFileName && !isRecording ? (
              <button
                type="button"
                onClick={onVcRefAudioClear}
                className="shrink-0 rounded-lg border border-white/10 bg-background/30 px-2 py-1.5 text-[11px] text-foreground/60 transition-colors hover:border-accent/40 hover:text-accent"
              >
                ✕
              </button>
            ) : null}
          </div>

          {recordingError ? (
            <p className="mt-1 text-[11px] text-red-400">{recordingError}</p>
          ) : isRecording ? (
            <p className="mt-1 text-[11px] text-red-400/80">
              녹음 중… 중지를 누르면 자동으로 설정됩니다. (최대 60초)
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-foreground/45">
              클론할 목소리 샘플 (WAV 권장, 5~30초) — 파일 업로드 또는 직접 녹음
            </p>
          )}
        </div>

        {/* 언어 + x_vector only */}
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-foreground/60">언어</p>
            <div className="relative mt-1 h-9 overflow-visible rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(232,136,138,0.04)] transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25">
              <CustomSelect
                value={vcLanguage}
                onChange={setVcLanguage}
                options={vcLanguageOptions}
                triggerClassName="h-full text-[13px] text-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={vcXVectorOnly}
                onChange={(e) => setVcXVectorOnly(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-[13px] text-foreground/80">x_vector only</span>
            </label>
            <div className="group relative flex items-center">
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-white/8 text-[10px] text-foreground/50 transition-colors hover:border-accent/50 hover:text-accent"
                aria-label="x_vector only 설명"
              >
                ?
              </button>
              <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-white/10 bg-[rgba(18,14,14,0.97)] px-3 py-2.5 text-[12px] leading-relaxed text-foreground/80 opacity-0 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-opacity duration-150 group-hover:opacity-100">
                <p className="font-semibold text-foreground">x_vector only 란?</p>
                <p className="mt-1">
                  <span className="font-medium text-accent">켜짐 (기본)</span>: 참조 음성에서
                  화자 특성(음색·음질)만 추출해 적용합니다. 빠르고 간단하며 별도 텍스트 입력이
                  필요 없습니다.
                </p>
                <p className="mt-1.5">
                  <span className="font-medium text-accent">꺼짐</span>: 음색에 더해
                  참조 음성의 운율·억양·말하기 스타일까지 클론합니다. 아래에 참조 음성에서 말하는
                  내용(ref_text)을 함께 입력해야 합니다.
                </p>
                <div className="absolute right-2 top-full border-4 border-transparent border-t-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* ref_text (x_vector only 꺼짐 시) */}
        {!vcXVectorOnly ? (
          <div>
            <p className="font-mono text-xs text-foreground/60">참조 텍스트 (ref_text)</p>
            <textarea
              value={vcRefText}
              onChange={(e) => setVcRefText(e.target.value)}
              rows={2}
              placeholder="참조 음성에서 말하는 내용을 입력하세요"
              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-[13px] leading-snug text-foreground outline-none placeholder:text-foreground/40 transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
            />
          </div>
        ) : null}

        {/* 읽어줄 텍스트 */}
        <div>
          <p className="font-mono text-xs text-foreground/60">읽어줄 텍스트</p>
          <textarea
            value={vcText}
            onChange={(e) => setVcText(e.target.value)}
            rows={2}
            placeholder="클론된 목소리로 읽어줄 내용을 입력하세요"
            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-[13px] leading-snug text-foreground outline-none placeholder:text-foreground/40 transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-foreground/55">
            참조 음성을 업로드하면 해당 목소리로 텍스트를 합성합니다.
          </p>
          <button
            type="submit"
            disabled={isVcSynthesizing || !vcText.trim() || !vcRefFileName}
            className={[
              "inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background shadow-[0_0_40px_rgba(232,136,138,0.22)] transition-opacity",
              isVcSynthesizing || !vcText.trim() || !vcRefFileName
                ? "cursor-not-allowed opacity-50"
                : "hover:opacity-90",
            ].join(" ")}
          >
            {isVcSynthesizing ? (
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
              <span>클론 합성</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Image2TextSection — 이미지 업로드 + 프롬프트 입력 UI
// ---------------------------------------------------------------------------

type Image2TextSectionProps = {
  image2textFileInputRef: React.RefObject<HTMLInputElement | null>;
  image2textFileName: string | null;
  onImage2TextFileChange: (file: File | null) => void;
  onImage2TextFileClear: () => void;
  image2textPrompt: string;
  setImage2TextPrompt: React.Dispatch<React.SetStateAction<string>>;
  image2textIsLoading: boolean;
  handleImage2TextRun: () => void;
  IconUpload: React.ComponentType<{ className?: string }>;
};

function Image2TextSection({
  image2textFileInputRef,
  image2textFileName,
  onImage2TextFileChange,
  onImage2TextFileClear,
  image2textPrompt,
  setImage2TextPrompt,
  image2textIsLoading,
  handleImage2TextRun,
  IconUpload,
}: Image2TextSectionProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleImage2TextRun();
      }}
    >
      <div className="flex flex-col gap-3">
        {/* 이미지 파일 */}
        <div>
          <p className="font-mono text-xs text-foreground/60">이미지 파일</p>
          <div className="mt-1 flex items-center gap-2">
            <input
              ref={image2textFileInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                onImage2TextFileChange(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => image2textFileInputRef.current?.click()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-[13px] text-foreground/80 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <IconUpload className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {image2textFileName ?? "이미지 선택"}
              </span>
            </button>
            {image2textFileName ? (
              <button
                type="button"
                onClick={onImage2TextFileClear}
                className="shrink-0 rounded-lg border border-white/10 bg-background/30 px-2 py-1.5 text-[11px] text-foreground/60 transition-colors hover:border-accent/40 hover:text-accent"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {/* 프롬프트 */}
        <div>
          <p className="font-mono text-xs text-foreground/60">
            분석 지시 (선택)
          </p>
          <textarea
            value={image2textPrompt}
            onChange={(e) => setImage2TextPrompt(e.target.value)}
            placeholder="이 이미지 내용을 한국어로 설명하고, 이미지 안의 글자를 줄바꿈 유지해서 그대로 추출해줘."
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* 실행 버튼 */}
        <button
          type="submit"
          disabled={image2textIsLoading || !image2textFileName}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-background shadow-[0_0_40px_rgba(232,136,138,0.22)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {image2textIsLoading ? (
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
              <span>분석 중...</span>
            </>
          ) : (
            "이미지 분석"
          )}
        </button>
      </div>
    </form>
  );
}
