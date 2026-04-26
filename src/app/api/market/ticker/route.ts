import { NextRequest, NextResponse } from "next/server";
import { BINANCE_SPOT_BASE_URL, marketQuerySchema } from "@/lib/binance-market";

export const dynamic = "force-dynamic";
const MARKET_CACHE_SECONDS = 10;
const BINANCE_TIMEOUT_MS = 8000;

export async function GET(request: NextRequest) {
  const parsed = marketQuerySchema.pick({ symbol: true }).safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid ticker query", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { symbol } = parsed.data;
  const url = new URL("/api/v3/ticker/price", BINANCE_SPOT_BASE_URL);
  url.searchParams.set("symbol", symbol);

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: MARKET_CACHE_SECONDS },
    signal: AbortSignal.timeout(BINANCE_TIMEOUT_MS),
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json(
      { ok: false, error: "binance ticker request failed", status: response?.status || 504 },
      { status: 502 },
    );
  }

  const data = (await response.json()) as { symbol: string; price: string };

  return NextResponse.json(
    {
      ok: true,
      ticker: {
        symbol: data.symbol,
        price: Number(data.price),
        source: "binance_spot",
        updatedAt: new Date().toISOString(),
      },
      cacheSeconds: MARKET_CACHE_SECONDS,
    },
    {
      headers: {
        "cache-control": `s-maxage=${MARKET_CACHE_SECONDS}, stale-while-revalidate=20`,
      },
    },
  );
}
