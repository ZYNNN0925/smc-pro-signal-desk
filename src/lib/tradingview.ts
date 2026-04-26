import { z } from "zod";
import type { StrategySignal } from "@/lib/types";

const numeric = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return value;
}, z.number().finite());

const createdAt = z.preprocess((value) => {
  if (typeof value === "number") {
    return new Date(value < 10000000000 ? value * 1000 : value).toISOString();
  }

  if (typeof value === "string" && value.trim() !== "") {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return new Date(numericValue < 10000000000 ? numericValue * 1000 : numericValue).toISOString();
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}, z.string());

export const tradingViewSignalSchema = z.object({
  secret: z.string().optional(),
  signal_id: z.string().min(6).optional(),
  strategy: z.string().default("SMC_PRO"),
  version: z.string().default("0.5.0"),
  symbol: z.string().min(2),
  timeframe: z.string().min(1),
  side: z.enum(["long", "short"]),
  entry: numeric,
  sl: numeric,
  tp: numeric,
  rr: numeric.default(2),
  reason: z.array(z.string()).default([]),
  confidence: numeric.default(70),
  created_at: createdAt.optional(),
});

export type TradingViewPayload = z.infer<typeof tradingViewSignalSchema>;

export function normalizeTradingViewPayload(payload: TradingViewPayload): StrategySignal {
  const createdAtValue = payload.created_at || new Date().toISOString();
  const safeSymbol = payload.symbol.replace(/[^A-Za-z0-9:_-]/g, "");
  const safeTimeframe = payload.timeframe.replace(/[^A-Za-z0-9_-]/g, "");
  const fallbackId = `${payload.strategy}:${safeSymbol}:${safeTimeframe}:${createdAtValue}:${payload.side}`;

  return {
    id: payload.signal_id || fallbackId,
    signalId: payload.signal_id || fallbackId,
    strategy: payload.strategy,
    version: payload.version,
    symbol: payload.symbol,
    timeframe: payload.timeframe,
    side: payload.side,
    entry: payload.entry,
    stopLoss: payload.sl,
    takeProfit: payload.tp,
    rr: payload.rr,
    status: "open",
    reasons: payload.reason,
    confidence: payload.confidence,
    createdAt: createdAtValue,
  };
}

export function signalToDatabaseRow(signal: StrategySignal) {
  return {
    signal_id: signal.signalId,
    strategy: signal.strategy,
    version: signal.version,
    symbol: signal.symbol,
    timeframe: signal.timeframe,
    side: signal.side,
    entry: signal.entry,
    stop_loss: signal.stopLoss,
    take_profit: signal.takeProfit,
    rr: signal.rr,
    status: signal.status,
    reasons: signal.reasons,
    confidence: signal.confidence,
    created_at: signal.createdAt,
  };
}
