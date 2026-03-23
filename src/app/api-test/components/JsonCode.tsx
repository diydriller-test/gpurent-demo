import type { ReactNode } from "react";
import { renderHighlightedJson } from "../lib/codeHighlight";

export function JsonCode({ text }: { text: string }) {
  const safeText = text || "";
  return (
    <pre className="max-h-[50vh] overflow-auto rounded-xl border border-white/5 bg-background/20 p-3 font-mono text-[12px] leading-relaxed">
      <code className="whitespace-pre">
        {safeText.length ? (renderHighlightedJson(safeText) as ReactNode) : "—"}
      </code>
    </pre>
  );
}

