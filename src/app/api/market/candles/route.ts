import { NextRequest, NextResponse } from "next/server";
import { marketQuerySchema, parseBinanceKline } from "@/lib/binance-market";
import { fetchBinanceMarketJson } from "@/lib/binance-market-server";

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
  const result = await fetchBinanceMarketJson<unknown[][]>(
    "/api/v3/klines",
    { symbol, interval, limit: String(limit) },
    { cacheSeconds: MARKET_CACHE_SECONDS, timeoutMs: BINANCE_TIMEOUT_MS },
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "binance candles request failed", status: result.status, source: result.source },
      { status: 502 },
    );
  }

  const candles = result.data.map(parseBinanceKline);

  return NextResponse.json(
    {
      ok: true,
      source: result.source,
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
