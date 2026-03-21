import type { ReactNode } from "react";

export function renderHighlightedJson(text: string) {
  const regex =
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*")(?=\s*:)|("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*")|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b|[{}\[\]:,]/g;

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const keyStr = match[1];
    const valueStr = match[2];

    let className = "text-foreground/50";
    if (keyStr !== undefined) className = "text-[#10b981]";
    else if (valueStr !== undefined) className = "text-[#a7f3d0]";
    else if (token === "true" || token === "false")
      className = "text-[#fbbf24]";
    else if (token === "null") className = "text-[#f87171]";
    else if (token.startsWith('"')) className = "text-[#a7f3d0]";
    else if (/^-?\d/.test(token)) className = "text-[#93c5fd]";
    else if (/[{}\[\]:,]/.test(token)) className = "text-foreground/50";

    parts.push(
      <span key={`${start}-${token}`} className={className}>
        {token}
      </span>,
    );

    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function renderHighlightedPython(code: string) {
  // 완전한 파이썬 파서가 아닌, UI 가독성을 위한 간단 토크나이징 하이라이트
  const regex =
    /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|\b(import|requests|url|headers|data|model|messages|temperature|role|content|response|json|print|post|Bearer)\b/gm;

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(regex)) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      parts.push(code.slice(lastIndex, start));
    }

    const comment = match[1];
    const str = match[2];
    const num = match[3];
    const keyword = match[4];

    let className = "text-foreground/60";
    if (comment) className = "text-[#f87171]";
    else if (str) className = "text-[#a7f3d0]";
    else if (num) className = "text-[#93c5fd]";
    else if (keyword) className = "text-[#10b981]";

    parts.push(
      <span key={`${start}-${token}`} className={className}>
        {token}
      </span>,
    );

    lastIndex = start + token.length;
  }

  if (lastIndex < code.length) {
    parts.push(code.slice(lastIndex));
  }

  return parts;
}

