"use client";

import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { supportedCryptoIntervals, supportedCryptoSymbols, type MarketTicker } from "@/lib/binance-market";
import { formatMoney } from "@/lib/format";

type CandleResponse = {
  ok: boolean;
  source: string;
  symbol: string;
  interval: string;
  candles: Array<{ time: number; open: number; high: number; low: number; close: number }>;
  updatedAt: string;
  error?: string;
};

type TickerResponse = {
  ok: boolean;
  ticker: MarketTicker;
  error?: string;
};

export function SignalChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [symbol, setSymbol] = useState<(typeof supportedCryptoSymbols)[number]>("BTCUSDT");
  const [interval, setInterval] = useState<(typeof supportedCryptoIntervals)[number]>("5m");
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [status, setStatus] = useState("載入 Binance 行情");

  const query = useMemo(() => {
    const params = new URLSearchParams({ symbol, interval, limit: "180" });
    return params.toString();
  }, [symbol, interval]);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let activeController: AbortController | null = null;

    async function loadMarketData() {
      if (inFlight) {
        return;
      }

      inFlight = true;
      setStatus("載入 Binance 行情");
      const controller = new AbortController();
      activeController = controller;

      try {
        const [candleResponse, tickerResponse] = await Promise.all([
          fetch(`/api/market/candles?${query}`, { cache: "no-store", signal: controller.signal }),
          fetch(`/api/market/ticker?symbol=${symbol}`, { cache: "no-store", signal: controller.signal }),
        ]);

        const candleData = (await candleResponse.json()) as CandleResponse;
        const tickerData = (await tickerResponse.json()) as TickerResponse;

        if (cancelled) {
          return;
        }

        if (!candleResponse.ok || !candleData.ok) {
          setStatus(candleData.error || "無法載入 Binance K 線");
          return;
        }

        setCandles(
          candleData.candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          })),
        );

        if (tickerResponse.ok && tickerData.ok) {
          setTicker(tickerData.ticker);
        }

        setStatus(`Binance Spot ${symbol} ${interval}`);
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof DOMException && error.name === "AbortError" ? "行情更新已取消" : "無法連線到 Binance 行情");
        }
      } finally {
        inFlight = false;
        if (activeController === controller) {
          activeController = null;
        }
      }
    }

    loadMarketData();
    const timer = window.setInterval(loadMarketData, 15000);

    return () => {
      cancelled = true;
      activeController?.abort();
      window.clearInterval(timer);
    };
  }, [query, symbol, interval]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      height: 340,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#151614",
      },
      grid: {
        vertLines: { color: "#eeeeea" },
        horzLines: { color: "#eeeeea" },
      },
      rightPriceScale: {
        borderColor: "#d9dbd4",
      },
      timeScale: {
        borderColor: "#d9dbd4",
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#148a63",
      downColor: "#cf4d3f",
      borderVisible: false,
      wickUpColor: "#148a63",
      wickDownColor: "#cf4d3f",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || candles.length === 0) {
      return;
    }

    seriesRef.current.setData(candles);
    chartRef.current.timeScale().fitContent();
  }, [candles]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">{status}</p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {ticker ? formatMoney(ticker.price, ticker.price > 100 ? 2 : 4) : "-"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Symbol
            <select
              value={symbol}
              onChange={(event) => setSymbol(event.target.value as (typeof supportedCryptoSymbols)[number])}
              className="h-10 rounded-md border border-line bg-background px-3 text-sm text-foreground outline-none"
            >
              {supportedCryptoSymbols.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Interval
            <select
              value={interval}
              onChange={(event) => setInterval(event.target.value as (typeof supportedCryptoIntervals)[number])}
              className="h-10 rounded-md border border-line bg-background px-3 text-sm text-foreground outline-none"
            >
              {supportedCryptoIntervals.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div ref={containerRef} className="h-[340px] w-full" aria-label="Binance spot candlestick chart" />
    </div>
  );
}
