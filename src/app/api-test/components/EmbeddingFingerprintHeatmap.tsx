"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const GRID = 64;
const TOTAL = GRID * GRID;
const ROSE_LOW: [number, number, number] = [29, 18, 27];
const ROSE_MID: [number, number, number] = [104, 43, 77];
const ROSE_HIGH: [number, number, number] = [232, 136, 138];

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

function toRgba(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function mix(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(from[0] + (to[0] - from[0]) * k),
    Math.round(from[1] + (to[1] - from[1]) * k),
    Math.round(from[2] + (to[2] - from[2]) * k),
  ];
}

function cellBackground(
  mode: "scan" | "data",
  value: number,
  index: number,
  scanTick: number,
): string {
  if (mode === "scan") {
    const rnd = mulberry32(index * 2654435761 + scanTick * 1103515245)();
    const flicker = 0.24 + rnd * 0.46;
    const rgb = mix(ROSE_MID, ROSE_HIGH, rnd);
    return toRgba(rgb, flicker);
  }
  const v = clampDim(value);
  const mag = Math.abs(v);
  const alpha = 0.28 + mag * 0.72;
  const rgb = mag < 0.5 ? mix(ROSE_LOW, ROSE_MID, mag * 2) : mix(ROSE_MID, ROSE_HIGH, (mag - 0.5) * 2);
  return toRgba(rgb, alpha);
}

type Props = {
  vector: number[] | null;
  isLoading: boolean;
  /** 새 임베딩이 생성될 때마다 바뀌면 DNA 스태거 애니메이션을 다시 실행합니다 */
  animationKey: string | null;
};

const HeatmapGrid = memo(function HeatmapGrid({
  mode,
  padded,
  revealed,
  scanTick,
  onCellPointer,
  onCellPointerLeave,
}: {
  mode: "scan" | "data";
  padded: Float32Array;
  revealed: number;
  scanTick: number;
  onCellPointer: (e: PointerEvent<HTMLDivElement>, index: number) => void;
  onCellPointerLeave: () => void;
}) {
  return (
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
            onPointerLeave={onCellPointerLeave}
          />
        );
      })}
    </div>
  );
});

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

  const tooltipPos = useMemo(() => {
    if (!hover) return null;

    const pad = 8;
    const tipW = 170;
    const tipH = 72;

    // 기본: 커서 바로 위/오른쪽
    let left = hover.left + 8;
    let top = hover.top - 8;
    let tx = "0%";
    let ty = "-100%";

    if (typeof window !== "undefined") {
      // 오른쪽 경계에 가까우면 커서 왼쪽으로
      if (left + tipW > window.innerWidth - pad) {
        left = hover.left - 8;
        tx = "-100%";
      }
      // 상단 경계에 가까우면 커서 아래로
      if (top - tipH < pad) {
        top = hover.top + 8;
        ty = "0%";
      }
    }

    return { left, top, transform: `translate(${tx}, ${ty})` };
  }, [hover]);

  const handleCellPointerLeave = useCallback(() => {
    setHover(null);
  }, []);

  return (
    <div className="relative w-full">
      <div
        className="relative mx-auto aspect-square w-full max-w-[min(100%,300px)] overflow-hidden rounded-xl border border-accent/20 bg-zinc-950/80 shadow-[0_0_48px_rgba(232, 136, 138,0.08)]"
        role="img"
        aria-label="4096차원 임베딩 히트맵, 64×64 그리드"
      >
        <HeatmapGrid
          mode={mode}
          padded={padded}
          revealed={revealed}
          scanTick={scanTick}
          onCellPointer={onCellPointer}
          onCellPointerLeave={handleCellPointerLeave}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: `calc(100% / ${GRID}) calc(100% / ${GRID})`,
          }}
        />
      </div>

      {hover && mode === "data" && tooltipPos ? (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-accent/40 bg-zinc-950/95 px-3 py-2 text-[11px] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur"
          style={{
            left: tooltipPos.left,
            top: tooltipPos.top,
            transform: tooltipPos.transform,
          }}
        >
          <div className="font-mono text-accent-bright/90">dim #{hover.index}</div>
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
