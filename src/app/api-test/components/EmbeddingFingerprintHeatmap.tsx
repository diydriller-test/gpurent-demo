"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const GRID = 64;
const TOTAL = GRID * GRID;
const MINT = "16, 185, 129";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampDim(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(-1, Math.min(1, v));
}

function cellBackground(
  mode: "scan" | "data",
  value: number,
  index: number,
  scanTick: number,
): string {
  if (mode === "scan") {
    const rnd = mulberry32(index * 2654435761 + scanTick * 1103515245)();
    const flicker = 0.12 + rnd * 0.55;
    return `rgba(${MINT}, ${flicker})`;
  }
  const v = clampDim(value);
  const mag = Math.abs(v);
  const alpha = 0.06 + mag * 0.94;
  return `rgba(${MINT}, ${alpha})`;
}

type Props = {
  vector: number[] | null;
  isLoading: boolean;
  /** 새 임베딩이 생성될 때마다 바뀌면 DNA 스태거 애니메이션을 다시 실행합니다 */
  animationKey: string | null;
};

export function EmbeddingFingerprintHeatmap({
  vector,
  isLoading,
  animationKey,
}: Props) {
  const [scanTick, setScanTick] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [hover, setHover] = useState<{
    index: number;
    value: number;
    left: number;
    top: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    const id = window.setInterval(() => {
      setScanTick((n) => (n + 1) % 10_000);
    }, 90);
    return () => window.clearInterval(id);
  }, [isLoading]);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (isLoading || !vector?.length) {
      queueMicrotask(() => setRevealed(0));
      return;
    }

    const start = performance.now();
    const duration = 2400;

    queueMicrotask(() => setRevealed(0));

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setRevealed(Math.min(TOTAL, Math.floor(eased * TOTAL)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setRevealed(TOTAL);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [vector, isLoading, animationKey]);

  const padded = useMemo(() => {
    const out = new Float32Array(TOTAL);
    if (!vector?.length) return out;
    for (let i = 0; i < TOTAL; i++) {
      out[i] = clampDim(
        i < vector.length ? (vector[i] as number) : 0,
      );
    }
    return out;
  }, [vector]);

  const mode: "scan" | "data" = isLoading ? "scan" : vector ? "data" : "scan";

  const onCellPointer = useCallback(
    (e: PointerEvent<HTMLDivElement>, index: number) => {
      if (mode !== "data" || !vector) {
        setHover(null);
        return;
      }
      const raw =
        index < vector.length ? (vector[index] as number) : Number.NaN;
      const v = Number.isFinite(raw) ? raw : 0;
      setHover({
        index,
        value: v,
        left: e.clientX,
        top: e.clientY,
      });
    },
    [mode, vector],
  );

  return (
    <div className="relative w-full">
      <div
        className="relative mx-auto aspect-square w-full max-w-[min(100%,360px)] overflow-hidden rounded-xl border border-[#10b981]/20 bg-zinc-950/80 shadow-[0_0_48px_rgba(16,185,129,0.08)]"
        role="img"
        aria-label="4096차원 임베딩 히트맵, 64×64 그리드"
      >
        <div
          className="grid h-full w-full gap-0"
          style={{
            gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: TOTAL }, (_, i) => {
            const value = padded[i] ?? 0;
            const isRevealed = mode === "data" && i < revealed;
            const bg =
              mode === "scan"
                ? cellBackground("scan", 0, i, scanTick)
                : cellBackground("data", value, i, 0);

            return (
              <div
                key={i}
                className={[
                  "min-h-0 min-w-0 transition-[opacity,background-color] duration-75",
                  mode === "data" && isRevealed
                    ? "opacity-100"
                    : mode === "data"
                      ? "opacity-0"
                      : "opacity-100",
                ].join(" ")}
                style={{ backgroundColor: bg }}
                onPointerEnter={(e) => onCellPointer(e, i)}
                onPointerMove={(e) => onCellPointer(e, i)}
                onPointerLeave={() => setHover(null)}
              />
            );
          })}
        </div>
      </div>

      {hover && mode === "data" ? (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-[#10b981]/40 bg-zinc-950/95 px-3 py-2 text-[11px] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur"
          style={{
            left: hover.left + 12,
            top: hover.top + 12,
            transform: "translate(0, 0)",
          }}
        >
          <div className="font-mono text-[#a7f3d0]/90">dim #{hover.index}</div>
          <div className="mt-0.5 font-mono tabular-nums text-foreground/90">
            {Number.isFinite(hover.value)
              ? hover.value.toFixed(6)
              : String(hover.value)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
