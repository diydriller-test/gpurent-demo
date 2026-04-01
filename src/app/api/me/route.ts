import { NextResponse } from "next/server";
import { getBackendBaseUrl, pickAuthHeader } from "../_lib/backend";

export async function GET(req: Request) {
  const backend = getBackendBaseUrl();
  const auth = pickAuthHeader(req);

  const upstreamRes = await fetch(`${backend}/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const text = await upstreamRes.text().catch(() => "");
  return new NextResponse(text, {
    status: upstreamRes.status,
    headers: {
      "Content-Type":
        upstreamRes.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

