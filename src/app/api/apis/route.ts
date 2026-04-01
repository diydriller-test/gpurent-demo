import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "../_lib/backend";

export async function GET() {
  const backend = getBackendBaseUrl();
  const upstreamRes = await fetch(`${backend}/apis`, {
    method: "GET",
    headers: { Accept: "application/json" },
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

