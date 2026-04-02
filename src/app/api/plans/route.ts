import { NextResponse } from "next/server";
import { fetchBackend } from "../_lib/backend";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : "";

  const upstreamRes = await fetchBackend(`/plans${qs}`, {
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

