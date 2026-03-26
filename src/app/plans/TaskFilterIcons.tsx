import type { ReactNode } from "react";

import type { PlanTask } from "./planCatalog";

function IconBase({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconSparkles(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 2l1.2 4.3L17.5 8l-4.3 1.2L12 13.5l-1.2-4.3L6.5 8l4.3-1.7L12 2z" />
      <path d="M5 14l.7 2.4L8 17l-2.3.6L5 20l-.7-2.4L2 17l2.3-.6L5 14z" />
      <path d="M19 13l.7 2.4L22 16l-2.3.6L19 19l-.7-2.4L16 16l2.3-.6L19 13z" />
    </IconBase>
  );
}

export function IconLayers(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </IconBase>
  );
}

export function IconShuffle(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M16 3h5v5" />
      <path d="M4 20l16-16" />
      <path d="M21 3l-2 2" />
      <path d="M16 21h5v-5" />
      <path d="M4 4l16 16" />
      <path d="M21 21l-2-2" />
    </IconBase>
  );
}

export function IconVolume2(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a4.5 4.5 0 010 7" />
      <path d="M18 6a8 8 0 010 12" />
    </IconBase>
  );
}

export function IconMic(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v4" />
    </IconBase>
  );
}

/** 광고 카피 / 문구 작성 */
export function IconPenLine(props: { className?: string }) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </IconBase>
  );
}

export function PlanTaskIcon({
  task,
  className = "h-4 w-4",
}: {
  task: PlanTask;
  className?: string;
}) {
  switch (task) {
    case "Text Generation":
      return <IconSparkles className={className} />;
    case "Ad Copy":
      return <IconPenLine className={className} />;
    case "Embedding":
      return <IconLayers className={className} />;
    case "Reranker":
      return <IconShuffle className={className} />;
    case "TTS":
      return <IconVolume2 className={className} />;
    case "STT":
      return <IconMic className={className} />;
    default:
      return <IconLayers className={className} />;
  }
}
