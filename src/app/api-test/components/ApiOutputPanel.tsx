import type React from "react";

import type { ApiId, ChatMessage, RerankResult } from "../lib/types";
import { ChatMarkdown } from "./ChatMarkdown";
import { EmbeddingFingerprintHeatmap } from "./EmbeddingFingerprintHeatmap";

type Props = {
  selectedApi: ApiId;
  messages: ChatMessage[];
  endRef: React.RefObject<HTMLDivElement | null>;
  formatTime: (ts: number) => string;
  liveNowText: string;

  // Ad Copy
  adCopyResult: string | null;
  isAdCopyLoading: boolean;

  // Embedding
  embeddingVector: number[] | null;
  embeddingError: string | null;
  isEmbeddingLoading: boolean;
  embeddingAnimationKey: string;

  // Reranker
  rerankQuestion: string;
  rerankDocsText: string;
  setRerankQuestion: React.Dispatch<React.SetStateAction<string>>;
  setRerankDocsText: React.Dispatch<React.SetStateAction<string>>;
  handleRerankRun: () => void;
  isRerankLoading: boolean;
  rerankResults: RerankResult[] | null;
  rerankError: string | null;
  displayedQuery: string;

  // TTS
  handleTtsPlayPause: () => void;
  ttsPlaying: boolean;
  ttsDurationMs: number;
  ttsProgress: number;
  ttsWave: number[];
  ttsAudioRef: React.RefObject<HTMLAudioElement | null>;
  ttsAudioUrl: string | null;
  ttsIsSynthesizing: boolean;
  ttsMockResponse: Record<string, unknown> | null;
  handleTtsSave: () => void;
  IconPlay: React.ComponentType<{ className?: string }>;
  IconPause: React.ComponentType<{ className?: string }>;

  // STT
  sttTranscript: string | null;
  isSttLoading: boolean;
  sttError: string | null;
  sttFileName: string | null;
  isRecording: boolean;
};

export function ApiOutputPanel({
  selectedApi,
  messages,
  endRef,
  formatTime,
  liveNowText,
  adCopyResult,
  isAdCopyLoading,
  embeddingVector,
  embeddingError,
  isEmbeddingLoading,
  embeddingAnimationKey,
  rerankQuestion,
  rerankDocsText,
  setRerankQuestion,
  setRerankDocsText,
  handleRerankRun,
  isRerankLoading,
  rerankResults,
  rerankError,
  displayedQuery,
  handleTtsPlayPause,
  ttsPlaying,
  ttsDurationMs,
  ttsProgress,
  ttsWave,
  ttsAudioRef,
  ttsAudioUrl,
  ttsIsSynthesizing,
  ttsMockResponse,
  handleTtsSave,
  IconPlay,
  IconPause,
  sttTranscript,
  isSttLoading,
  sttError,
  sttFileName,
  isRecording,
}: Props) {
  return (
    <>
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
                          <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-xl border border-accent/25 bg-accent/5 px-2.5 py-1 text-[11px] font-mono text-accent">
                              LIVE
                            </span>
                          </div>

                          <div className="mt-2 text-sm leading-relaxed text-foreground/90">
                            <span className="font-semibold">
                              ✨{" "}
                              <span className="text-accent">
                                AI API 오마카세
                              </span>{" "}
                              텍스트 코스와{" "}
                              <span className="text-accent font-bold">
                                실시간
                              </span>
                              으로 연결되었습니다.
                            </span>
                            <br />
                            <span>
                              <span className="font-bold text-wood">
                                고성능 언어 추론
                              </span>
                              으로 질문을 분석할 준비를 마쳤습니다.
                            </span>
                            <br />
                            하단 입력창에 비즈니스 분석이나 텍스트 생성을
                            요청해보세요.
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-end gap-2">
                        <span className="font-mono text-[11px] text-foreground/40">
                          {liveNowText}
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
                        {isUser ? (
                          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {m.content}
                          </pre>
                        ) : (
                          <ChatMarkdown
                            content={m.content}
                            className="min-w-0 break-words text-sm"
                          />
                        )}
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

          case "summarize":
            return null;

          case "sentiment":
            return null;

          case "ner":
            return null;

          case "textToSql":
            return null;

          case "adCopy":
            return (
              <div className="flex h-full min-h-[min(45vh,380px)] flex-col">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-accent/20 bg-background/40">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-accent/90">
                        생성 결과
                      </p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {isAdCopyLoading ? "생성 중..." : "미리보기"}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-foreground/45">
                        카피 생성 후 이 영역에 문구가 표시됩니다.
                      </p>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {isAdCopyLoading ? (
                      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-foreground/60">
                        카피를 생성하는 중입니다…
                      </div>
                    ) : adCopyResult ? (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <ChatMarkdown content={adCopyResult} />
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-foreground/60">
                        위에서 브리프를 입력한 뒤{" "}
                        <span className="text-foreground/80">카피 생성</span>을
                        누르면 여기에 결과가 나옵니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );

          case "embedding":
            return (
              <div className="space-y-2">
                <div className="rounded-2xl border border-accent/25 bg-accent/5 p-3">
                  {embeddingError && !isEmbeddingLoading && !embeddingVector ? (
                    <div className="mt-3 rounded-xl border border-white/5 bg-background/20 p-3">
                      <p className="text-sm font-semibold text-foreground">
                        {embeddingError}
                      </p>
                    </div>
                  ) : isEmbeddingLoading || embeddingVector ? (
                    <div className="mt-2 space-y-2">
                      <div className="rounded-xl border border-accent/15 bg-zinc-950/40 px-3 py-3">
                        <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-bright/95">
                          의미적 지문 (Semantic Fingerprint)
                        </p>
                        <p className="mt-1 text-center text-[10px] text-foreground/45">
                          4,096차원을 64×64 히트맵으로 시각화합니다. 셀에
                          마우스를 올리면 차원 인덱스와 값을 확인할 수 있습니다.
                        </p>

                        <div className="mt-2.5">
                          <EmbeddingFingerprintHeatmap
                            vector={embeddingVector}
                            isLoading={isEmbeddingLoading}
                            animationKey={embeddingAnimationKey}
                          />
                        </div>
                      </div>

                      {embeddingVector && !isEmbeddingLoading ? (
                        <p className="text-[11px] text-foreground/60">
                          이 지문 패턴이 비슷할수록 문장의 의미가 가깝다는
                          뜻입니다.
                        </p>
                      ) : null}
                    </div>
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
                            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
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
                            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
                          />
                        </div>
                        <p className="mt-3 text-xs text-foreground/60">
                          입력된 Query와 Documents로 Reranker API를 호출합니다.
                        </p>
                        <button
                          type="button"
                          onClick={handleRerankRun}
                          disabled={isRerankLoading}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-background shadow-[0_0_40px_rgba(232, 136, 138,0.22)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

                    <div className="min-h-0 w-full rounded-2xl border border-accent/25 bg-accent/5 p-4 lg:w-7/12 lg:flex lg:flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-accent">
                            Qwen3 Reranker Output
                          </p>
                          <p className="mt-0.5 text-xs text-foreground/60">
                            단어가 겹치지 않아도 문맥을 정확히 읽어내는 Qwen3의
                            성능을 확인해보세요.
                          </p>
                          {displayedQuery && rerankResults ? (
                            <p className="mt-1 text-xs text-foreground/60">
                              Query: {displayedQuery}
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-xl border border-accent/20 bg-background/30 px-3 py-1 text-[11px] text-accent">
                          Live API
                        </span>
                      </div>

                      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                        {isRerankLoading ? (
                          <div className="rounded-xl border border-accent/20 bg-background/30 p-3">
                            <div className="inline-flex items-center gap-2 text-xs text-accent">
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
                                    ? "border-2 border-accent bg-accent/10 shadow-[0_0_40px_rgba(232, 136, 138,0.28)]"
                                    : "border-white/10",
                                ].join(" ")}
                              >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span
                                    className={[
                                      "font-mono text-[11px]",
                                      r.rank === 1
                                        ? "text-accent"
                                        : "text-foreground/55",
                                    ].join(" ")}
                                  >
                                    Rank {r.rank}
                                  </span>
                                  <span className="rounded-lg border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">
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
              <div className="min-w-0 space-y-3">
                <audio
                  ref={ttsAudioRef}
                  src={ttsAudioUrl ?? undefined}
                  preload="auto"
                  className="hidden"
                />
                <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-accent">Audio Player</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        합성 후 실제 오디오 재생 · 진행률은 재생 시간에 따라
                        갱신됩니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTtsSave}
                      disabled={!ttsAudioUrl}
                      title="합성 음성 파일 저장"
                      aria-label="합성 음성 파일 저장"
                      className={[
                        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                        ttsAudioUrl
                          ? "border-accent/45 bg-background/35 text-accent hover:border-accent/70 hover:bg-accent/10"
                          : "cursor-not-allowed border-white/10 bg-background/20 text-foreground/35",
                      ].join(" ")}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <path d="M7 10l5 5 5-5" />
                        <path d="M12 15V3" />
                      </svg>
                    </button>
                  </div>

                  <div
                    className={[
                      "mt-4 transition-opacity duration-300",
                      ttsAudioUrl
                        ? "opacity-100"
                        : "pointer-events-none opacity-50",
                    ].join(" ")}
                  >
                    {!ttsAudioUrl ? (
                      <p className="mb-3 text-xs text-foreground/55">
                        합성 후 이용 가능합니다. 하단에서 &quot;합성&quot;을
                        눌러 음성을 생성해 주세요.
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        disabled={!ttsAudioUrl}
                        onClick={handleTtsPlayPause}
                        className={[
                          "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-background shadow-[0_0_40px_rgba(232, 136, 138,0.22)] transition-opacity",
                          ttsAudioUrl
                            ? "hover:opacity-90"
                            : "cursor-not-allowed opacity-40",
                        ].join(" ")}
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
                            className="h-2 rounded-full bg-accent transition-[width] duration-100 ease-linear"
                            style={{
                              width: `${Math.round(ttsProgress * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-foreground/50">
                          <span>
                            {((ttsDurationMs * ttsProgress) / 1000).toFixed(1)}s
                          </span>
                          <span>{(ttsDurationMs / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {ttsMockResponse ? null : null}

                  <div className="relative mt-4 overflow-hidden rounded-xl border border-accent/15 bg-zinc-950/40 px-2 py-3">
                    <div className="flex h-14 items-end justify-center gap-[3px]">
                      {(ttsIsSynthesizing
                        ? Array.from(
                            { length: 32 },
                            (_, i) => 0.35 + (i % 5) * 0.1,
                          )
                        : ttsWave?.length
                          ? ttsWave
                          : Array.from({ length: 32 }, () => 0.12)
                      )
                        .slice(0, 32)
                        .map((v, idx) => {
                          const h = Math.max(8, Math.round(v * 44));
                          return (
                            <div
                              key={`tts-w-${idx}-${ttsIsSynthesizing ? "s" : "d"}`}
                              className={[
                                "w-[5px] origin-bottom rounded-sm bg-white/10",
                                ttsPlaying ? "bg-accent" : "bg-white/15",
                              ].join(" ")}
                              style={{
                                height: h,
                                ...(ttsIsSynthesizing
                                  ? {
                                      animation:
                                        "ttsWv 1.15s ease-in-out infinite",
                                      animationDelay: `${idx * 32}ms`,
                                    }
                                  : {}),
                              }}
                            />
                          );
                        })}
                    </div>
                    {ttsIsSynthesizing ? (
                      <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-[11px] font-medium text-accent/90">
                        음성 합성 중…
                      </p>
                    ) : null}
                  </div>
                  <style>{`
                    @keyframes ttsWv {
                      0%, 100% { transform: scaleY(0.38); opacity: 0.55; }
                      50% { transform: scaleY(1); opacity: 1; }
                    }
                  `}</style>
                </div>
              </div>
            );

          case "stt":
            return (
              <div className="space-y-3">
                <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
                  <p className="font-mono text-xs text-accent">
                    Transcript Output
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    최첨단 Whisper 알고리즘 기반의 Qwen3 STT 엔진이 소리를
                    텍스트로 정교하게 추출합니다.
                  </p>

                  {sttTranscript ? (
                    <div className="mt-3 rounded-xl border border-white/5 bg-background/30 p-3">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/80">
                        {sttTranscript}
                      </pre>
                    </div>
                  ) : isSttLoading ? (
                    <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
                      <div className="inline-flex items-center gap-2 text-xs text-accent">
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
                        <span>변환 중...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-white/5 bg-background/20 p-3">
                      <p className="text-sm font-semibold text-foreground">
                        아직 변환 결과가 없습니다.
                      </p>
                      <p className="mt-1 text-xs text-foreground/60">
                        하단에서 파일 업로드 또는 마이크 UI 후 “변환하기”를
                        눌러보세요.
                      </p>
                    </div>
                  )}

                  {sttError ? (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                      {sttError}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-white/10 bg-background/30 px-3 py-1 text-[11px] text-foreground/60">
                      Source:{" "}
                      {sttFileName ??
                        (isRecording ? "Microphone(녹음 중)" : "Upload/Mic")}
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
    </>
  );
}
