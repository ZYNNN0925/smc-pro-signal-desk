import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TradeForm } from "@/components/trade-form";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney, formatSigned, sideLabel } from "@/lib/format";
import { getUserTrades } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const user = await requireUser();
  const trades = await getUserTrades(user.id, user.isDemo);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">Trading journal</p>
              <h1 className="mt-2 text-3xl font-semibold">交易紀錄追蹤</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                記錄實際進出場、R 倍數、情緒和失誤標籤，策略績效頁會用這些資料計算勝率與回撤。
              </p>
            </div>
            <Link href="/performance" className="rounded-md border border-line-strong px-3 py-2 text-sm font-semibold text-muted">
              查看績效
            </Link>
          </div>
        </section>

        <TradeForm />

        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="grid min-w-[940px] grid-cols-[1fr_0.7fr_0.9fr_0.9fr_0.9fr_0.8fr_0.8fr_1fr] border-b border-line bg-background px-4 py-3 text-xs font-semibold uppercase text-muted">
            <span>Symbol</span>
            <span>Side</span>
            <span>Entry</span>
            <span>Exit</span>
            <span>PNL</span>
            <span>R</span>
            <span>Status</span>
            <span>Notes</span>
          </div>
          <div className="overflow-x-auto">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="grid min-w-[940px] grid-cols-[1fr_0.7fr_0.9fr_0.9fr_0.9fr_0.8fr_0.8fr_1fr] items-center border-b border-line px-4 py-4 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{trade.symbol}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(trade.openedAt)}</p>
                </div>
                <span className={trade.side === "long" ? "font-semibold text-accent" : "font-semibold text-danger"}>
                  {sideLabel(trade.side)}
                </span>
                <span className="font-mono">{formatMoney(trade.entryPrice)}</span>
                <span className="font-mono">{trade.exitPrice ? formatMoney(trade.exitPrice) : "-"}</span>
                <span className={trade.pnl > 0 ? "font-mono text-accent" : trade.pnl < 0 ? "font-mono text-danger" : "font-mono"}>
                  {formatSigned(trade.pnl)}
                </span>
                <span className={trade.pnlR > 0 ? "font-mono text-accent" : trade.pnlR < 0 ? "font-mono text-danger" : "font-mono"}>
                  {formatSigned(trade.pnlR, "R")}
                </span>
                <span className="text-sm font-semibold">{trade.status}</span>
                <span className="truncate text-sm text-muted">{trade.notes || "-"}</span>
              </div>
            ))}
            {trades.length === 0 ? <div className="px-4 py-8 text-sm text-muted">尚未建立交易紀錄。</div> : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
