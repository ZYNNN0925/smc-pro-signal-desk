import { NextRequest, NextResponse } from "next/server";
import { BINANCE_SPOT_BASE_URL, marketQuerySchema, parseBinanceKline } from "@/lib/binance-market";

export const dynamic = "force-dynamic";
const MARKET_CACHE_SECONDS = 15;
const BINANCE_TIMEOUT_MS = 8000;

export async function GET(request: NextRequest) {
  const parsed = marketQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid market query", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { symbol, interval, limit } = parsed.data;
  const url = new URL("/api/v3/klines", BINANCE_SPOT_BASE_URL);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: MARKET_CACHE_SECONDS },
    signal: AbortSignal.timeout(BINANCE_TIMEOUT_MS),
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json(
      { ok: false, error: "binance candles request failed", status: response?.status || 504 },
      { status: 502 },
    );
  }

  const raw = (await response.json()) as unknown[][];
  const candles = raw.map(parseBinanceKline);

  return NextResponse.json(
    {
      ok: true,
      source: "binance_spot",
      symbol,
      interval,
      candles,
      cacheSeconds: MARKET_CACHE_SECONDS,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": `s-maxage=${MARKET_CACHE_SECONDS}, stale-while-revalidate=30`,
      },
    },
  );
}
