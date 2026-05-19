import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ApiId } from "../lib/types";

/** range 슬라이더 값 파싱 — `0`은 falsy라 `|| 기본값` 패턴으로는 0을 쓸 수 없음 */
function parseTemperatureRange(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
                  "border border-foreground/10 bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.10)]",
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
                            : "text-foreground/80 hover:bg-foreground/6 hover:text-foreground",
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

type SttTask = "transcribe" | "translate";
type SttHelpTooltipId = "vad" | "beam" | "task";

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

  sttTask: SttTask;
  setSttTask: React.Dispatch<React.SetStateAction<SttTask>>;

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
  image2textTemperature: number;
  setImage2TextTemperature: React.Dispatch<React.SetStateAction<number>>;
  image2textFileInputRef: React.RefObject<HTMLInputElement | null>;
  image2textFileName: string | null;
  onImage2TextFileChange: (file: File | null) => void;
  onImage2TextFileClear: () => void;
  image2textIsLoading: boolean;

  // Text-to-Music input
  handleT2mRun: () => void;
  t2mPrompt: string;
  setT2mPrompt: React.Dispatch<React.SetStateAction<string>>;
  t2mLyrics: string;
  setT2mLyrics: React.Dispatch<React.SetStateAction<string>>;
  t2mInstrumental: boolean;
  setT2mInstrumental: React.Dispatch<React.SetStateAction<boolean>>;
  t2mDuration: number;
  setT2mDuration: React.Dispatch<React.SetStateAction<number>>;
  t2mSeed: string;
  setT2mSeed: React.Dispatch<React.SetStateAction<string>>;
  t2mIsLoading: boolean;

  // Text-to-Image input
  handleT2iRun: () => void;
  t2iPrompt: string;
  setT2iPrompt: React.Dispatch<React.SetStateAction<string>>;
  t2iNegativePrompt: string;
  setT2iNegativePrompt: React.Dispatch<React.SetStateAction<string>>;
  t2iWidth: number;
  setT2iWidth: React.Dispatch<React.SetStateAction<number>>;
  t2iHeight: number;
  setT2iHeight: React.Dispatch<React.SetStateAction<number>>;
  t2iSeed: string;
  setT2iSeed: React.Dispatch<React.SetStateAction<string>>;
  t2iIsLoading: boolean;
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

  sttTask,
  setSttTask,

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
  image2textTemperature,
  setImage2TextTemperature,
  image2textFileInputRef,
  image2textFileName,
  onImage2TextFileChange,
  onImage2TextFileClear,
  image2textIsLoading,

  handleT2mRun,
  t2mPrompt,
  setT2mPrompt,
  t2mLyrics,
  setT2mLyrics,
  t2mInstrumental,
  setT2mInstrumental,
  t2mDuration,
  setT2mDuration,
  t2mSeed,
  setT2mSeed,
  t2mIsLoading,

  handleT2iRun,
  t2iPrompt,
  setT2iPrompt,
  t2iNegativePrompt,
  setT2iNegativePrompt,
  t2iWidth,
  setT2iWidth,
  t2iHeight,
  setT2iHeight,
  t2iSeed,
  setT2iSeed,
  t2iIsLoading,
}: Props) {
  const [llmAdvancedOpen, setLlmAdvancedOpen] = useState(false);
  const [sttLangPanelStyle, setSttLangPanelStyle] =
    useState<React.CSSProperties | null>(null);
  const sttLangPanelRef = useRef<HTMLDivElement | null>(null);

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
              selectedApi === "llm" || selectedApi === "stt"
                ? "border-b border-white/5"
                : "border-t border-white/5",
            ].join(" ")
      }
    >
      {selectedApi === "llm" ? (
        <form onSubmit={onSend}>
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
            <div className="rounded-xl border border-black/[0.08] bg-white p-3 shadow-[0_18px_70px_rgba(8,9,13,0.08)]">
              <div className="flex items-center justify-between gap-3 px-2 pb-2.5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                    request input
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-foreground sm:break-words">
                    LLM API 입력을 작성하세요.
                  </p>
                </div>
                <span className="hidden rounded-full border border-accent/25 bg-accent/5 px-3 py-1 font-mono text-[11px] text-accent sm:inline-flex">
                  /api/chat
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <label className="sr-only" htmlFor="prompt">
                  메시지 입력
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  className="min-h-[86px] w-full resize-y rounded-xl border border-black/[0.08] bg-background px-4 py-3 text-base leading-7 text-foreground placeholder:text-black/36 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
                />

                <div className="flex flex-col gap-3 border-t border-black/[0.06] px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="hidden flex-wrap gap-2 text-[11px] 2xl:flex">
                    <span className="rounded-full border border-black/[0.08] bg-background px-2.5 py-1 font-mono text-black/48">
                      text input
                    </span>
                    <span className="rounded-full border border-black/[0.08] bg-background px-2.5 py-1 font-mono text-black/48">
                      system prompt
                    </span>
                    <span className="rounded-full border border-black/[0.08] bg-background px-2.5 py-1 font-mono text-black/48">
                      temperature
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!prompt.trim() || isChatLoading}
                    className={[
                      "group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-all sm:w-auto",
                      "whitespace-nowrap sm:min-w-[112px]",
                      "bg-[#08090d] shadow-[0_12px_34px_rgba(8,9,13,0.18)] hover:bg-black disabled:cursor-not-allowed disabled:bg-black/32 disabled:shadow-none",
                    ].join(" ")}
                  >
                    {isChatLoading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span>실행 중...</span>
                      </>
                    ) : (
                      <>
                        <span>실행하기</span>
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-black/[0.08] bg-white">
              <button
                type="button"
                onClick={() => setLlmAdvancedOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:text-accent"
                aria-expanded={llmAdvancedOpen}
                aria-controls="llm-advanced-settings"
              >
                <div>
                  <p className="font-mono text-xs text-foreground/60">
                    advanced controls
                  </p>
                  <p className="mt-1 text-[11px] text-foreground/40">
                    Optional system prompt and sampling temperature
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
                  <div className="border-t border-black/[0.06] px-4 pb-4 pt-3">
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
                        className="mt-1.5 w-full resize-none rounded-xl border border-black/[0.08] bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
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

      {selectedApi === "embedding" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEmbeddingRun();
          }}
        >
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-foreground/60">
                  입력 (짧은 문장)
                </p>
                <span className={`text-[11px] ${embeddingText.length >= 500 ? "text-red-400" : "text-foreground/40"}`}>
                  {embeddingText.length}/500
                </span>
              </div>
              <textarea
                value={embeddingText}
                onChange={(e) => setEmbeddingText(e.target.value)}
                maxLength={500}
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
                <div className="relative mt-1 h-9 overflow-visible rounded-xl border border-foreground/12 bg-background/60 transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25">
                  <CustomSelect
                    value={ttsLanguage}
                    onChange={setTtsLanguage}
                    options={ttsLanguageOptions}
                    triggerClassName="h-full text-[13px] text-foreground"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-foreground/60">화자</p>
                <div className="relative mt-1 h-9 overflow-visible rounded-xl border border-foreground/12 bg-background/60 transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25">
                  <CustomSelect
                    value={ttsSpeaker}
                    onChange={setTtsSpeaker}
                    options={ttsSpeakerOptions}
                    triggerClassName="h-full text-[13px] text-foreground"
                    panelClassName="border border-foreground/10 bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-foreground/60">
                  스타일 지시 (선택)
                </p>
                <span className={`text-[11px] ${ttsStyleInstruction.length >= 50 ? "text-red-400" : "text-foreground/40"}`}>
                  {ttsStyleInstruction.length}/50
                </span>
              </div>
              <input
                value={ttsStyleInstruction}
                onChange={(e) => setTtsStyleInstruction(e.target.value)}
                maxLength={50}
                placeholder="예: 밝고 활기찬 톤으로 말해줘"
                className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-background/40 px-4 text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-foreground/60">
                  읽어줄 텍스트
                </p>
                <span className={`text-[11px] ${ttsText.length >= 300 ? "text-red-400" : "text-foreground/40"}`}>
                  {ttsText.length}/300
                </span>
              </div>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                maxLength={300}
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
              <p className="mt-0.5 text-[11px] text-foreground/40">WAV · MP3 · OGG · WebM · M4A · 최대 20MB</p>
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
                  accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a"
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
                  </div>
                </div>
              </label>
            </div>

            <div className="w-full flex-[6] min-w-0">
              <p className="font-mono text-xs text-foreground/60">
                마이크 녹음 (선택)
              </p>
              <p className="mt-0.5 text-[11px] invisible" aria-hidden="true">placeholder</p>
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

          <div className="rounded-xl border border-white/5 bg-background/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-foreground/60">STT 옵션</p>
              <span className="rounded-lg border border-white/10 bg-background/30 px-2 py-0.5 text-[11px] font-mono text-foreground/60">
                실시간 동기화
              </span>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
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
                      className="mt-2 w-full rounded-xl border border-foreground/12 bg-background/60 px-3 py-2 pr-10 text-sm text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
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
                          className="overflow-y-auto rounded-xl border border-foreground/10 bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
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
                                      : "text-foreground/80 hover:bg-foreground/6 hover:text-foreground",
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
                  <p className="font-mono text-xs text-foreground/60">변환 방식</p>
                  <SttHelpTooltip
                    id="task"
                    pinnedId={sttTooltipPinned}
                    setPinnedId={setSttTooltipPinned}
                    hoverId={sttTooltipHoverId}
                    setHoverId={setSttTooltipHoverId}
                    content="Transcribe는 원본 언어 그대로 텍스트로 변환합니다. Translate는 음성을 영어로 번역하면서 텍스트로 변환합니다."
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {(["transcribe", "translate"] as SttTask[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSttTask(t)}
                      className={[
                        "flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                        sttTask === t
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-white/10 bg-background/30 text-foreground/80 hover:border-accent/30",
                      ].join(" ")}
                    >
                      {t === "transcribe" ? "Transcribe" : "Translate"}
                    </button>
                  ))}
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
          image2textTemperature={image2textTemperature}
          setImage2TextTemperature={setImage2TextTemperature}
          image2textIsLoading={image2textIsLoading}
          handleImage2TextRun={handleImage2TextRun}
          IconUpload={IconUpload}
        />
      ) : null}

      {selectedApi === "t2m" ? (
        <T2mSection
          t2mPrompt={t2mPrompt}
          setT2mPrompt={setT2mPrompt}
          t2mLyrics={t2mLyrics}
          setT2mLyrics={setT2mLyrics}
          t2mInstrumental={t2mInstrumental}
          setT2mInstrumental={setT2mInstrumental}
          t2mDuration={t2mDuration}
          setT2mDuration={setT2mDuration}
          t2mSeed={t2mSeed}
          setT2mSeed={setT2mSeed}
          t2mIsLoading={t2mIsLoading}
          handleT2mRun={handleT2mRun}
        />
      ) : null}

      {selectedApi === "t2i" ? (
        <T2iSection
          t2iPrompt={t2iPrompt}
          setT2iPrompt={setT2iPrompt}
          t2iNegativePrompt={t2iNegativePrompt}
          setT2iNegativePrompt={setT2iNegativePrompt}
          t2iWidth={t2iWidth}
          setT2iWidth={setT2iWidth}
          t2iHeight={t2iHeight}
          setT2iHeight={setT2iHeight}
          t2iSeed={t2iSeed}
          setT2iSeed={setT2iSeed}
          t2iIsLoading={t2iIsLoading}
          handleT2iRun={handleT2iRun}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VoiceCloneSection — 파일 업로드 + 마이크 녹음 통합 UI
// ---------------------------------------------------------------------------

const VC_MIN_RECORDING_MS = 900;
const VC_MIN_RECORDING_BYTES = 1024;

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function audioBufferToMonoWavBlob(audioBuffer: AudioBuffer): Blob {
  const { length, numberOfChannels, sampleRate } = audioBuffer;
  const output = new ArrayBuffer(44 + length * 2);
  const view = new DataView(output);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    let sample = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      sample += audioBuffer.getChannelData(channel)[i] ?? 0;
    }
    sample = Math.max(-1, Math.min(1, sample / Math.max(1, numberOfChannels)));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([output], { type: "audio/wav" });
}

async function recordedBlobToWav(blob: Blob): Promise<Blob> {
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return blob;

  const audioContext = new AudioContextCtor();
  try {
    const buffer = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(buffer.slice(0));
    return audioBufferToMonoWavBlob(decoded);
  } finally {
    void audioContext.close().catch(() => null);
  }
}

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
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartAtRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    stopTimer();
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      recordingStartAtRef.current = null;
    }
  }, [stopTimer]);

  // 최대 60초 자동 중지
  useEffect(() => {
    if (!isRecording || recordingSecs < 60) return;
    const timer = window.setTimeout(() => stopRecording(), 0);
    return () => window.clearTimeout(timer);
  }, [isRecording, recordingSecs, stopRecording]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      streamRef.current = null;
      recordingStartAtRef.current = null;
    };
  }, [stopTimer]);

  async function startRecording() {
    setRecordingError(null);
    onVcRefAudioChange(null);
    chunksRef.current = [];
    recordingStartAtRef.current = null;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("MEDIA_UNAVAILABLE");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      recordingStartAtRef.current = Date.now();

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
        const startedAt = recordingStartAtRef.current;
        const durationMs =
          typeof startedAt === "number" ? Date.now() - startedAt : 0;
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        recordingStartAtRef.current = null;
        stopTimer();
        setIsRecording(false);

        if (
          durationMs < VC_MIN_RECORDING_MS ||
          blob.size < VC_MIN_RECORDING_BYTES
        ) {
          chunksRef.current = [];
          onVcRefAudioChange(null);
          setRecordingError("녹음이 너무 짧습니다. 조금 더 길게 말해 주세요.");
          return;
        }

        void recordedBlobToWav(blob)
          .then((wavBlob) => {
            const file = new File([wavBlob], "voice-clone-reference.wav", {
              type: "audio/wav",
            });
            chunksRef.current = [];
            setRecordingError(null);
            onVcRefAudioChange(file);
          })
          .catch(() => {
            chunksRef.current = [];
            onVcRefAudioChange(null);
            setRecordingError(
              "녹음 파일 변환에 실패했습니다. 다시 녹음해 주세요.",
            );
          });
      };

      mr.start(100);
      setRecordingSecs(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSecs((s) => s + 1);
      }, 1000);
    } catch (err: unknown) {
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.message.includes("Permission"));

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      recordingStartAtRef.current = null;
      chunksRef.current = [];
      stopTimer();
      setIsRecording(false);
      onVcRefAudioChange(null);
      setRecordingError(
        isDenied
          ? "마이크 접근 권한이 필요합니다."
          : "마이크 사용에 실패했습니다.",
      );
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="flex-[4] min-w-0">
              <p className="font-mono text-xs text-foreground/60">참조 음성</p>
              <p className="mt-0.5 text-[11px] text-foreground/40">
                WAV · MP3 · OGG · WebM · M4A · 최대 20MB
              </p>
            <label
              className={[
                "relative mt-2 block rounded-xl border border-dashed px-3 py-3 transition-colors",
                isRecording
                  ? "cursor-not-allowed border-white/10 bg-background/20 opacity-50"
                  : vcRefFileName
                    ? "cursor-pointer border-accent/40 bg-accent/5"
                    : "cursor-pointer border-white/10 bg-background/30 hover:border-accent/30",
              ].join(" ")}
            >
              <input
                ref={vcRefAudioFileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a"
                className="hidden"
                disabled={isRecording}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  onVcRefAudioChange(file);
                  e.target.value = "";
                }}
              />

              {vcRefFileName && !isRecording ? (
                <button
                  type="button"
                  aria-label="참조 음성 지우기"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onVcRefAudioClear();
                  }}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center text-muted-foreground/40 transition-colors hover:text-foreground"
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

              <div className="flex items-center gap-2 pr-8">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-background/20 text-foreground/80">
                  <IconUpload className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {!isRecording && vcRefFileName ? vcRefFileName : "파일 선택"}
                  </p>
                  {vcRefFileName && !isRecording ? (
                    <p className="mt-1 text-xs text-accent">
                      합성 준비 완료
                    </p>
                  ) : null}
                </div>
              </div>
            </label>
            </div>

            <div className="w-full flex-[6] min-w-0">
            <p className="font-mono text-xs text-foreground/60">
              마이크 녹음 (선택)
            </p>
            <p className="mt-0.5 text-[11px] invisible" aria-hidden="true">
              placeholder
            </p>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={[
                "mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                isRecording
                  ? "border-red-500/40 bg-red-500/10 text-[#ef4444]"
                  : "border-white/10 bg-background/30 text-foreground/80 hover:border-accent/30",
              ].join(" ")}
            >
              <span className="inline-flex flex-wrap items-center justify-center gap-2">
                <IconMic className="h-5 w-5" />
                {isRecording ? "녹음 중지" : "녹음 시작"}
                {isRecording ? (
                  <span className="ml-3 inline-flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <span>{fmtSecs(recordingSecs)}</span>
                  </span>
                ) : null}
              </span>
            </button>
            </div>
          </div>

          {recordingError ? (
            <p className="mt-1 text-[11px] text-red-400">
              {recordingError}
            </p>
          ) : isRecording ? (
            <p className="mt-1 text-[11px] text-red-400/80">
              녹음 중... 중지를 누르면 자동으로 설정됩니다. (최대 60초)
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-foreground/45">
              클론할 목소리 샘플 (WAV 권장, 5~30초) - 파일 업로드 또는 직접 녹음
            </p>
          )}
        </div>

        {/* 언어 + x_vector only */}
        <div className="grid grid-cols-2 items-end gap-4">
          <div>
            <p className="font-mono text-xs text-foreground/60">언어</p>
            <div className="relative mt-1 h-9 overflow-visible rounded-xl border border-foreground/12 bg-background/60 transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25">
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
              <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-foreground/10 bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-foreground/80 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-opacity duration-150 group-hover:opacity-100">
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
                <div className="absolute right-2 top-full border-4 border-transparent border-t-foreground/10" />
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
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-foreground/60">읽어줄 텍스트</p>
            <span className={`text-[11px] ${vcText.length >= 300 ? "text-red-400" : "text-foreground/40"}`}>
              {vcText.length}/300
            </span>
          </div>
          <textarea
            value={vcText}
            onChange={(e) => setVcText(e.target.value)}
            maxLength={300}
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
  image2textTemperature: number;
  setImage2TextTemperature: React.Dispatch<React.SetStateAction<number>>;
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
  image2textTemperature,
  setImage2TextTemperature,
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
          <p className="mt-0.5 text-[11px] text-foreground/40">JPG · PNG · GIF · WebP · BMP · 최대 20MB</p>
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
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-foreground/60">분석 지시 (선택)</p>
            <span className={`font-mono text-xs ${image2textPrompt.length >= 200 ? "text-red-400" : "text-foreground/40"}`}>
              {image2textPrompt.length}/200
            </span>
          </div>
          <textarea
            value={image2textPrompt}
            onChange={(e) => setImage2TextPrompt(e.target.value)}
            maxLength={200}
            placeholder="이 이미지 내용을 한국어로 설명하고, 이미지 안의 글자를 줄바꿈 유지해서 그대로 추출해줘."
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-foreground/60">temperature</p>
            <span className="font-mono text-xs text-foreground/80">{image2textTemperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={image2textTemperature}
            onChange={(e) => setImage2TextTemperature(Number(e.target.value))}
            className="mt-1 w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-foreground/40">
            <span>0.0 안정적</span>
            <span>1.0 창의적</span>
          </div>
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

// ---------------------------------------------------------------------------
// T2mSection — 텍스트 프롬프트 + 길이 슬라이더 UI
// ---------------------------------------------------------------------------

type T2mSectionProps = {
  t2mPrompt: string;
  setT2mPrompt: React.Dispatch<React.SetStateAction<string>>;
  t2mLyrics: string;
  setT2mLyrics: React.Dispatch<React.SetStateAction<string>>;
  t2mInstrumental: boolean;
  setT2mInstrumental: React.Dispatch<React.SetStateAction<boolean>>;
  t2mDuration: number;
  setT2mDuration: React.Dispatch<React.SetStateAction<number>>;
  t2mSeed: string;
  setT2mSeed: React.Dispatch<React.SetStateAction<string>>;
  t2mIsLoading: boolean;
  handleT2mRun: () => void;
};

function T2mSection({
  t2mPrompt,
  setT2mPrompt,
  t2mLyrics,
  setT2mLyrics,
  t2mInstrumental,
  setT2mInstrumental,
  t2mDuration,
  setT2mDuration,
  t2mSeed,
  setT2mSeed,
  t2mIsLoading,
  handleT2mRun,
}: T2mSectionProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleT2mRun();
      }}
    >
      <div className="flex flex-col gap-3">
        {/* 프롬프트 */}
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-foreground/60">음악 프롬프트</p>
            <span className={`font-mono text-xs ${t2mPrompt.length >= 300 ? "text-red-400" : "text-foreground/40"}`}>
              {t2mPrompt.length}/300
            </span>
          </div>
          <textarea
            value={t2mPrompt}
            onChange={(e) => setT2mPrompt(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="예: 잔잔한 피아노 멜로디에 가벼운 재즈 드럼이 어우러진 카페 BGM"
            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* instrumental + 가사 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={t2mInstrumental}
                onChange={(e) => setT2mInstrumental(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-[13px] text-foreground/80">instrumental</span>
            </label>
            <div className="group relative flex items-center">
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-white/8 text-[10px] text-foreground/50 transition-colors hover:border-accent/50 hover:text-accent"
                aria-label="instrumental 설명"
              >
                ?
              </button>
              <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-60 rounded-xl border border-foreground/10 bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-foreground/80 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-opacity duration-150 group-hover:opacity-100">
                <p className="font-semibold text-foreground">instrumental 이란?</p>
                <p className="mt-1">체크하면 보컬 없는 순수 연주곡으로 생성합니다. 가사 입력란이 비활성화되며, 프롬프트만으로 음악 스타일을 지정합니다.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className={`font-mono text-xs ${t2mInstrumental ? "text-foreground/30" : "text-foreground/60"}`}>
                가사{" "}
                <span className="text-foreground/40">(선택)</span>
              </p>
              <span className={`font-mono text-xs ${t2mLyrics.length >= 500 ? "text-red-400" : "text-foreground/40"}`}>
                {t2mInstrumental ? "" : `${t2mLyrics.length}/500`}
              </span>
            </div>
            <textarea
              value={t2mInstrumental ? "" : t2mLyrics}
              onChange={(e) => setT2mLyrics(e.target.value)}
              disabled={t2mInstrumental}
              maxLength={500}
              rows={4}
              placeholder={"예:\n[Verse]\nWalking through the morning light\nEverything feels warm and right"}
              className={`mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30 ${t2mInstrumental ? "cursor-not-allowed opacity-40" : ""}`}
            />
          </div>
        </div>

        {/* 길이 슬라이더 */}
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-foreground/60">길이</p>
            <span className="font-mono text-xs text-foreground/60">
              {t2mDuration}초
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={t2mDuration}
            onChange={(e) => setT2mDuration(Number(e.target.value))}
            className="mt-1.5 w-full accent-accent"
          />
          <div className="mt-0.5 flex justify-between font-mono text-[10px] text-foreground/40">
            <span>5초</span>
            <span>60초</span>
          </div>
        </div>

        {/* Seed */}
        <div>
          <p className="font-mono text-xs text-foreground/60">
            Seed <span className="text-foreground/40">(선택)</span>
          </p>
          <input
            type="number"
            min={0}
            max={4294967295}
            value={t2mSeed}
            onChange={(e) => setT2mSeed(e.target.value)}
            placeholder="랜덤 (미입력 시)"
            className="mt-1 w-full rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 font-mono text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* 실행 버튼 */}
        <button
          type="submit"
          disabled={t2mIsLoading || (!t2mPrompt.trim() && !t2mLyrics.trim())}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-background shadow-[0_0_40px_rgba(232,136,138,0.22)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t2mIsLoading ? (
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
              <span>생성 중...</span>
            </>
          ) : (
            "음악 생성"
          )}
        </button>
      </div>
    </form>
  );
}

// T2iSection — 텍스트 프롬프트 + 크기/스텝 설정 UI
// ---------------------------------------------------------------------------

type T2iSectionProps = {
  t2iPrompt: string;
  setT2iPrompt: React.Dispatch<React.SetStateAction<string>>;
  t2iNegativePrompt: string;
  setT2iNegativePrompt: React.Dispatch<React.SetStateAction<string>>;
  t2iWidth: number;
  setT2iWidth: React.Dispatch<React.SetStateAction<number>>;
  t2iHeight: number;
  setT2iHeight: React.Dispatch<React.SetStateAction<number>>;
  t2iSeed: string;
  setT2iSeed: React.Dispatch<React.SetStateAction<string>>;
  t2iIsLoading: boolean;
  handleT2iRun: () => void;
};

const T2I_SIZE_PRESETS = [
  { label: "1:1", width: 1024, height: 1024 },
  { label: "16:9", width: 1360, height: 768 },
  { label: "9:16", width: 768, height: 1360 },
  { label: "4:3", width: 1024, height: 768 },
];

function T2iSection({
  t2iPrompt,
  setT2iPrompt,
  t2iNegativePrompt,
  setT2iNegativePrompt,
  t2iWidth,
  setT2iWidth,
  t2iHeight,
  setT2iHeight,
  t2iSeed,
  setT2iSeed,
  t2iIsLoading,
  handleT2iRun,
}: T2iSectionProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleT2iRun();
      }}
    >
      <div className="flex flex-col gap-3">
        {/* 프롬프트 */}
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-foreground/60">이미지 프롬프트</p>
            <span className={`font-mono text-xs ${t2iPrompt.length >= 500 ? "text-red-400" : "text-foreground/40"}`}>
              {t2iPrompt.length}/500
            </span>
          </div>
          <textarea
            value={t2iPrompt}
            onChange={(e) => setT2iPrompt(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="예: A serene mountain landscape at sunset, photorealistic, 8k"
            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* 네거티브 프롬프트 */}
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-foreground/60">네거티브 프롬프트 <span className="text-foreground/40">(선택)</span></p>
            <span className={`font-mono text-xs ${t2iNegativePrompt.length >= 300 ? "text-red-400" : "text-foreground/40"}`}>
              {t2iNegativePrompt.length}/300
            </span>
          </div>
          <input
            type="text"
            value={t2iNegativePrompt}
            onChange={(e) => setT2iNegativePrompt(e.target.value)}
            maxLength={300}
            placeholder="예: blurry, low quality, distorted"
            className="mt-1 w-full rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* 크기 프리셋 */}
        <div>
          <p className="font-mono text-xs text-foreground/60">크기</p>
          <div className="mt-1.5 flex gap-2">
            {T2I_SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setT2iWidth(p.width); setT2iHeight(p.height); }}
                className={[
                  "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-colors",
                  t2iWidth === p.width && t2iHeight === p.height
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/10 bg-background/30 text-foreground/60 hover:border-white/25",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-right font-mono text-[10px] text-foreground/40">
            {t2iWidth} × {t2iHeight}
          </p>
        </div>

        {/* Seed */}
        <div>
          <p className="font-mono text-xs text-foreground/60">
            Seed <span className="text-foreground/40">(선택)</span>
          </p>
          <input
            type="number"
            min={0}
            max={4294967295}
            value={t2iSeed}
            onChange={(e) => setT2iSeed(e.target.value)}
            placeholder="랜덤 (미입력 시)"
            className="mt-1 w-full rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 font-mono text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* 실행 버튼 */}
        <button
          type="submit"
          disabled={t2iIsLoading || !t2iPrompt.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-background shadow-[0_0_40px_rgba(232,136,138,0.22)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t2iIsLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>생성 중...</span>
            </>
          ) : (
            "이미지 생성"
          )}
        </button>
      </div>
    </form>
  );
}
