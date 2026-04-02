import { NextResponse } from "next/server";
import { fetchBackend, pickAuthHeader } from "../_lib/backend";

export async function GET(req: Request) {
  const auth = pickAuthHeader(req);

  const upstreamRes = await fetchBackend("/auth/me", {
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

