import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-4 first:mt-0 text-lg font-bold text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 first:mt-0 text-base font-bold text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 first:mt-0 text-sm font-semibold text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-2.5 first:mt-0 last:mb-0 leading-relaxed text-foreground/90">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 text-foreground/90">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-foreground/90">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-accent/50 bg-white/[0.03] py-1 pl-4 text-foreground/85">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-bright"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-white/10" />,
  table: ({ children }) => (
    <div className="my-3 w-full overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[280px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.06] text-foreground/95">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-white/10 last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="border-r border-white/10 px-3 py-2 font-semibold last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-r border-white/10 px-3 py-2 align-top text-foreground/85 last:border-r-0">
      {children}
    </td>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-black/45 p-3 text-xs leading-relaxed text-[#e4e4e7]">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === "string" && className.includes("language-");
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.9em] text-accent-bright"
        {...props}
      >
        {children}
      </code>
    );
  },
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
};

type Props = {
  content: string;
  className?: string;
};

/**
 * LLM 답변용 마크다운 (GFM 표·취소선 등 + 제한적 HTML은 sanitize)
 */
export function ChatMarkdown({ content, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
