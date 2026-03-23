import type React from "react";

import type { ApiId } from "../lib/types";

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

  // Embedding input
  handleEmbeddingRun: () => void;
  embeddingText: string;
  setEmbeddingText: React.Dispatch<React.SetStateAction<string>>;
  isEmbeddingLoading: boolean;

  // TTS input
  handleTtsRun: () => void;
  ttsText: string;
  setTtsText: React.Dispatch<React.SetStateAction<string>>;
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
    setPinnedId: React.Dispatch<
      React.SetStateAction<SttHelpTooltipId | null>
    >;
    hoverId: SttHelpTooltipId | null;
    setHoverId: React.Dispatch<
      React.SetStateAction<SttHelpTooltipId | null>
    >;
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

  handleEmbeddingRun,
  embeddingText,
  setEmbeddingText,
  isEmbeddingLoading,

  handleTtsRun,
  ttsText,
  setTtsText,
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
  return (
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
                  setLlmTemperature(Number(e.target.value) || 0.1)
                }
                className="mt-2 w-full accent-[#10b981]"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-foreground/45">
                <span className="text-foreground/55">Temperature</span>는 답이
                얼마나 “정해진 느낌”으로 나올지를 조절해요.{" "}
                <span className="text-foreground/60">낮으면</span> 같은 질문에
                비슷하고 안정적인 문장을,{" "}
                <span className="text-foreground/60">높으면</span> 표현이 더
                다양해지고 때로는 예측하기 어려울 수 있어요. 요약·보고서처럼
                톤을 맞추고 싶을 땐 낮게, 아이디어나 문장을 넓게 펼치고 싶을
                땐 높게 써보세요.
              </p>
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
                버튼 클릭 시 실제 임베딩을 생성합니다.
              </p>
              <button
                type="submit"
                disabled={isEmbeddingLoading || !embeddingText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(16,185,129,0.22)] hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
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
                Mock 합성 후 blob 오디오 재생 · 콘솔에 더미 응답이 표시됩니다.
              </p>
              <button
                type="submit"
                disabled={isTtsSynthesizing || !ttsText.trim()}
                className={[
                  "inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(16,185,129,0.22)] transition-opacity",
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
                    ? "border-[#10b981]/40 bg-[#10b981]/5"
                    : "border-white/10 bg-background/30 hover:border-[#10b981]/30",
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
                      <p className="mt-1 text-xs text-[#10b981]">
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
                    : "border-white/10 bg-background/30 text-foreground/80 hover:border-[#10b981]/30",
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
                                  ? "#10b981"
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
                      className="mt-2 w-full rounded-xl border border-white/10 bg-background/40 px-3 py-2 pr-3 text-sm text-foreground outline-none transition-colors focus:border-[#10b981]/60 focus:ring-2 focus:ring-[#10b981]/30"
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
                                  ? "text-[#10b981]"
                                  : "text-foreground/80 hover:bg-[#10b981]/10",
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
                      ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]"
                      : "border-white/10 bg-background/30 text-foreground/80 hover:border-[#10b981]/30",
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
                    className="w-full accent-[#10b981]"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-background font-medium shadow-[0_0_40px_rgba(16,185,129,0.22)] hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
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

