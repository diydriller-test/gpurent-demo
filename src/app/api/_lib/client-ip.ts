/**
 * 프록시/로드밸런서 뒤에서의 클라이언트 IP (익명 사용자 식별 보조).
 */
export function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();
  return null;
}

/** 게이트웨이 upstream fetch 시 원본 클라이언트 IP 전달 */
export function getClientIpForwardingHeaders(req: Request): Record<string, string> {
  const clientIp = getClientIp(req);
  if (!clientIp) return {};
  return {
    "X-Forwarded-For": clientIp,
    "X-Real-IP": clientIp,
  };
}
