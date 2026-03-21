import type React from "react";

import type { ApiId, ChatMessage, RerankResult } from "../lib/types";

type Props = {
  selectedApi: ApiId;
  messages: ChatMessage[];
  endRef: React.RefObject<HTMLDivElement | null>;
  formatTime: (ts: number) => string;
  liveNowText: string;

  // Embedding
  embeddingVector: number[] | null;
  embeddingInputLabel: string | null;
  embeddingError: string | null;
  EmbeddingUniverseViz: React.ComponentType<{
    vector: number[];
    seedText: string | null;
  }>;

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
  embeddingVector,
  embeddingInputLabel,
  embeddingError,
  EmbeddingUniverseViz,
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
                              가 당신의 질문을 분석할 준비를 마쳤습니다.
                            </span>
                            <br />
                            하단 입력창에 비즈니스 분석이나 텍스트 생성을 요청해보세요.
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
                      className={["flex", isUser ? "justify-end" : "justify-start"].join(
                        " ",
                      )}
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
                        고차원 의미 공간 (4,096-Dimensional Space)
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm font-semibold text-foreground transition-opacity duration-200",
                          embeddingVector ? "opacity-100" : "opacity-80",
                        ].join(" ")}
                      >
                        {embeddingVector
                          ? "입력하신 문장이 AI가 학습한 거대한 의미의 우주 속에서 단 하나의 고유한 좌표(Vector)로 변환되었습니다."
                          : "문장을 AI가 학습한 거대한 의미의 우주 속 좌표로 변환해보세요."}
                      </p>
                      <p
                        className={[
                          "mt-1 text-xs text-foreground/60 transition-opacity duration-200",
                          embeddingVector ? "opacity-100" : "opacity-80",
                        ].join(" ")}
                      >
                        {embeddingVector
                          ? "4,096차원의 의미 공간에서 이 문장이 가진 고유한 위치를 확인해보세요."
                          : "입력하신 문장의 의미를 분석하여 고차원 공간상의 수치로 시각화합니다."}
                      </p>
                    </div>
                  </div>

                  {embeddingVector ? (
                    <>
                      {embeddingInputLabel ? (
                        <p className="mt-2 text-xs text-foreground/60">
                          Input: {embeddingInputLabel}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-foreground/60">
                        총 4096 차원의 고밀도 벡터가 생성되었습니다.
                      </p>

                      <div className="mt-3">
                        <EmbeddingUniverseViz
                          vector={embeddingVector}
                          seedText={embeddingInputLabel}
                        />
                      </div>

                      <p className="mt-2 text-xs text-foreground/60">
                        이 점의 위치가 비슷할수록 문장의 의미가 가깝다는 뜻입니다.
                      </p>
                    </>
                  ) : (
                    <div className="mt-3 rounded-xl border border-white/5 bg-background/20 p-3">
                      <p className="text-sm font-semibold text-foreground">
                        {embeddingError ?? "아직 생성 결과가 없습니다."}
                      </p>
                      {!embeddingError ? (
                        <p className="mt-1 text-xs text-foreground/60">
                          하단 입력 후 “임베딩 생성”을 눌러보세요.
                        </p>
                      ) : null}
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
                            단어가 겹치지 않아도 문맥을 정확히 읽어내는 Qwen3의 성능을 확인해보세요.
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
                              Query와 Documents를 입력한 뒤 “재정렬 실행”을 눌러보세요.
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
                  <p className="font-mono text-xs text-[#10b981]">Audio Player (UI Demo)</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    재생/일시정지는 오디오가 아니라 UI 애니메이션으로 동작합니다.
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
                          style={{ width: `${Math.round(ttsProgress * 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-foreground/50">
                        <span>
                          {Math.round((ttsDurationMs * ttsProgress) / 1000)}s
                        </span>
                        <span>{Math.round(ttsDurationMs / 1000)}s</span>
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
                              ttsPlaying ? "bg-[#10b981]" : "bg-white/10",
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
                  <p className="font-mono text-xs text-[#10b981]">Transcript Output</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    최첨단 Whisper 알고리즘 기반의 Qwen3 STT 엔진이 소리를 텍스트로 정교하게 추출합니다.
                  </p>

                  {sttTranscript ? (
                    <div className="mt-3 rounded-xl border border-white/5 bg-background/30 p-3">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/80">
                        {sttTranscript}
                      </pre>
                    </div>
                  ) : isSttLoading ? (
                    <div className="mt-3 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-3">
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
                        <span>변환 중...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-white/5 bg-background/20 p-3">
                      <p className="text-sm font-semibold text-foreground">
                        아직 변환 결과가 없습니다.
                      </p>
                      <p className="mt-1 text-xs text-foreground/60">
                        하단에서 파일 업로드 또는 마이크 UI 후 “변환하기”를 눌러보세요.
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
                      {sttFileName ?? (isRecording ? "Microphone(녹음 중)" : "Upload/Mic")}
                    </span>
                  </div>
                </div>
              </div>
            );

          default:
            return (
              <div className="rounded-2xl border border-white/5 bg-background/20 p-4">
                <p className="text-sm font-semibold text-foreground">지원 준비 중입니다.</p>
              </div>
            );
        }
      })()}
    </>
  );
}

