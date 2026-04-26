import { NextRequest, NextResponse } from "next/server";
import { marketQuerySchema } from "@/lib/binance-market";
import { fetchBinanceMarketJson } from "@/lib/binance-market-server";

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
  const result = await fetchBinanceMarketJson<{ symbol: string; price: string }>(
    "/api/v3/ticker/price",
    { symbol },
    { cacheSeconds: MARKET_CACHE_SECONDS, timeoutMs: BINANCE_TIMEOUT_MS },
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "binance ticker request failed", status: result.status, source: result.source },
      { status: 502 },
    );
  }

  const data = result.data;

  return NextResponse.json(
    {
      ok: true,
      ticker: {
        symbol: data.symbol,
        price: Number(data.price),
        source: result.source,
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
