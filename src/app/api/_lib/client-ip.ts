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
  return null;
}
