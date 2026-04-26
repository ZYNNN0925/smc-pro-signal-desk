import type { BinanceMarketSource } from "@/lib/binance-market";

const BINANCE_MARKET_ENDPOINTS: Array<{ source: BinanceMarketSource; baseUrl: string }> = [
  { source: "binance_spot", baseUrl: "https://api.binance.com" },
  { source: "binance_market_data", baseUrl: "https://data-api.binance.vision" },
];

type FetchBinanceOptions = {
  cacheSeconds: number;
  timeoutMs: number;
};

type FetchBinanceResult<T> =
  | { ok: true; data: T; source: BinanceMarketSource }
  | { ok: false; status: number; source: BinanceMarketSource };

export async function fetchBinanceMarketJson<T>(
  pathname: string,
  searchParams: Record<string, string>,
  options: FetchBinanceOptions,
): Promise<FetchBinanceResult<T>> {
  let lastFailure: FetchBinanceResult<T> = {
    ok: false,
    status: 504,
    source: BINANCE_MARKET_ENDPOINTS[0].source,
  };

  for (const endpoint of BINANCE_MARKET_ENDPOINTS) {
    const url = new URL(pathname, endpoint.baseUrl);

    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: options.cacheSeconds },
      signal: AbortSignal.timeout(options.timeoutMs),
    }).catch(() => null);

    if (!response?.ok) {
      lastFailure = { ok: false, status: response?.status || 504, source: endpoint.source };
      continue;
    }

    try {
      return { ok: true, data: (await response.json()) as T, source: endpoint.source };
    } catch {
      lastFailure = { ok: false, status: 502, source: endpoint.source };
    }
  }

  return lastFailure;
}
