"use client";

import { useEffect, useRef, useState } from "react";

/**
 * STT 하단 추천 배너와 동일: 결과가 있을 때만 마운트하고,
 * 사라질 때는 opacity 페이드 후 짧은 딜레이로 언마운트합니다.
 */
export function useResultTriggeredBanner(hasResult: boolean) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    let cancelled = false;
    let rafId: number | null = null;

    if (hasResult) {
      // effect 본문에서 동기 setState 금지(eslint) + 페이드인을 위해 마이크로태스크로 분리
      queueMicrotask(() => {
        if (cancelled) return;
        setMounted(true);
        setVisible(false);
        rafId = window.requestAnimationFrame(() => {
          if (!cancelled) setVisible(true);
        });
      });
      return () => {
        cancelled = true;
        if (rafId != null) window.cancelAnimationFrame(rafId);
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setVisible(false);
    });
    timerRef.current = window.setTimeout(() => {
      if (!cancelled) setMounted(false);
    }, 180);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasResult]);

  return { mounted, visible };
}
