import type { Dispatch, SetStateAction } from "react";
import { renderHighlightedPython } from "../lib/codeHighlight";

type Props = {
  devCodeOpen: boolean;
  setDevCodeOpen: Dispatch<SetStateAction<boolean>>;
  devCodeCopied: boolean;
  setDevCodeCopied: Dispatch<SetStateAction<boolean>>;
  llmDevCodePython: string;
};

export function DeveloperCodeSection({
  devCodeOpen,
  setDevCodeOpen,
  devCodeCopied,
  setDevCodeCopied,
  llmDevCodePython,
}: Props) {
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setDevCodeOpen((v) => !v)}
        className={[
          "w-full rounded-xl border px-4 py-3 text-xs font-medium",
          "border-white/10 bg-transparent text-foreground/70",
          "hover:border-accent/60 hover:text-accent-bright",
          "transition-colors",
        ].join(" ")}
      >
        {`[</> Get Developer Code]`}
      </button>

      <div
        className={[
          "overflow-hidden transition-all duration-220 ease-out",
          devCodeOpen
            ? "max-h-[520px] opacity-100 mt-3"
            : "max-h-0 opacity-0 pointer-events-none mt-3",
        ].join(" ")}
      >
        <div className="relative rounded-xl border border-white/10 bg-zinc-950 p-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(llmDevCodePython);
                setDevCodeCopied(true);
                window.setTimeout(() => {
                  setDevCodeCopied(false);
                }, 1200);
              } catch {
                setDevCodeCopied(false);
              }
            }}
            className={[
              "absolute right-3 top-3 rounded-lg border px-3 py-1 text-[11px] font-mono transition-colors",
              "border-white/10 bg-background/20 text-foreground/60",
              "hover:border-accent/50 hover:text-accent-bright",
            ].join(" ")}
          >
            {devCodeCopied ? "Copied!" : "Copy"}
          </button>

          <pre className="mt-1 max-h-[320px] overflow-auto whitespace-pre rounded-lg border border-white/5 bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            <code>{renderHighlightedPython(llmDevCodePython)}</code>
          </pre>
        </div>

        <p className="mt-3 text-[11px] text-foreground/60">
          전용 인프라 기반 텍스트 엔진을 단 몇 줄의 코드로 연동할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

