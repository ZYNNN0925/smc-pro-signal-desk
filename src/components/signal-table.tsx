import { formatDateTime, formatMoney, sideLabel } from "@/lib/format";
import type { StrategySignal } from "@/lib/types";
import { StatusPill } from "@/components/status-pill";

export function SignalTable({ signals }: { signals: StrategySignal[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid min-w-[980px] grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr_0.9fr_0.9fr_0.6fr_0.8fr_0.9fr] border-b border-line bg-background px-4 py-3 text-xs font-semibold uppercase text-muted">
        <span>Symbol</span>
        <span>Side</span>
        <span>TF</span>
        <span>Entry</span>
        <span>SL</span>
        <span>TP</span>
        <span>RR</span>
        <span>Score</span>
        <span>Status</span>
      </div>
      <div className="overflow-x-auto">
        {signals.map((signal) => (
          <div
            key={signal.signalId}
            className="grid min-w-[980px] grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr_0.9fr_0.9fr_0.6fr_0.8fr_0.9fr] items-center border-b border-line px-4 py-4 last:border-b-0"
          >
            <div>
              <p className="font-semibold">{signal.symbol}</p>
              <p className="mt-1 text-xs text-muted">{formatDateTime(signal.createdAt)}</p>
            </div>
            <span className={signal.side === "long" ? "font-semibold text-accent" : "font-semibold text-danger"}>
              {sideLabel(signal.side)}
            </span>
            <span className="font-mono text-sm">{signal.timeframe}</span>
            <span className="font-mono">{formatMoney(signal.entry)}</span>
            <span className="font-mono">{formatMoney(signal.stopLoss)}</span>
            <span className="font-mono">{formatMoney(signal.takeProfit)}</span>
            <span className="font-mono">{signal.rr.toFixed(1)}</span>
            <span className="font-mono">{signal.confidence.toFixed(0)}</span>
            <StatusPill status={signal.status} />
          </div>
        ))}
        {signals.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted">尚未收到訊號。把 TradingView Alert webhook 指到網站後，訊號會出現在這裡。</div>
        ) : null}
      </div>
    </div>
  );
}
