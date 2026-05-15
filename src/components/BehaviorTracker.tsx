"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  attachElementClickTracking,
  enqueuePageView,
  flushBehaviorQueue,
} from "@/lib/behavior";

function BehaviorTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    enqueuePageView(pathname, searchKey);
  }, [pathname, searchKey]);

  useEffect(() => {
    const detach = attachElementClickTracking();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushBehaviorQueue();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPageHide = () => {
      void flushBehaviorQueue();
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      detach();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      void flushBehaviorQueue();
    };
  }, []);

  return null;
}

/**
 * 루트 레이아웃에 한 번만 두면 페이지 뷰·요소 클릭 수집이 전역 적용됩니다.
 */
export function BehaviorTracker() {
  return (
    <Suspense fallback={null}>
      <BehaviorTrackerInner />
    </Suspense>
  );
}
