import { z } from "zod";

export const supportedCryptoSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"] as const;
export const supportedCryptoIntervals = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type BinanceMarketSource = "binance_spot" | "binance_market_data";

export const marketQuerySchema = z.object({
  symbol: z
    .string()
    .default("BTCUSDT")
    .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .refine((value) => supportedCryptoSymbols.includes(value as (typeof supportedCryptoSymbols)[number]), {
      message: "Unsupported symbol",
    }),
  interval: z
    .string()
    .default("5m")
    .refine((value) => supportedCryptoIntervals.includes(value as (typeof supportedCryptoIntervals)[number]), {
      message: "Unsupported interval",
    }),
  limit: z.coerce.number().int().min(20).max(500).default(160),
});

export type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketTicker = {
  symbol: string;
  price: number;
  source: BinanceMarketSource;
  updatedAt: string;
};

export function parseBinanceKline(row: unknown[]): MarketCandle {
  return {
    time: Math.floor(Number(row[0]) / 1000),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  };
}
