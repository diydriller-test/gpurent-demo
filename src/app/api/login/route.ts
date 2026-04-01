import { NextResponse } from "next/server";
import { getBackendBaseUrl, pickAuthHeader } from "../_lib/backend";

export async function POST(req: Request) {
  const backend = getBackendBaseUrl();
  const auth = pickAuthHeader(req);
  const body = await req.text().catch(() => "");

  const upstreamRes = await fetch(`${backend}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
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

