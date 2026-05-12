import type { Dispatch, SetStateAction } from "react";
import { renderHighlightedPython } from "../lib/codeHighlight";

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

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
          "border-foreground/12 bg-transparent text-foreground/70",
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
        <div className="relative rounded-xl border border-foreground/10 bg-surface p-3">
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
            aria-label={devCodeCopied ? "코드 복사 완료" : "코드 복사"}
            title={devCodeCopied ? "복사됨" : "복사"}
            className={[
              "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
              devCodeCopied
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-foreground/12 bg-background/40 text-foreground/60 hover:border-accent/50 hover:text-accent-bright",
            ].join(" ")}
          >
            {devCodeCopied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </button>

          <pre className="mt-1 max-h-[320px] overflow-auto whitespace-pre rounded-lg border border-foreground/8 bg-background/60 p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
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

