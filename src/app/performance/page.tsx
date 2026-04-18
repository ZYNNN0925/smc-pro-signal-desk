import { AppShell } from "@/components/app-shell";
import { MetricStrip } from "@/components/metric-strip";
import { requireUser } from "@/lib/auth";
import { formatMoney, formatPercent, formatSigned } from "@/lib/format";
import { buildStrategyAnalytics, getRecentSignals, getUserTrades } from "@/lib/platform-data";
import type { StrategyMetric } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const user = await requireUser();
  const [signals, trades] = await Promise.all([getRecentSignals(500), getUserTrades(user.id, user.isDemo, 500)]);
  const analytics = buildStrategyAnalytics(signals, trades);

  const metrics: StrategyMetric[] = [
    {
      label: "交易勝率",
      value: formatPercent(analytics.winRate),
      detail: `${analytics.closedTrades} 筆已結束`,
      tone: analytics.winRate >= 50 ? "good" : analytics.closedTrades ? "warning" : "neutral",
    },
    {
      label: "累積 R",
      value: formatSigned(analytics.totalR, "R"),
      detail: `平均 ${formatSigned(analytics.averageR, "R")}`,
      tone: analytics.totalR > 0 ? "good" : analytics.totalR < 0 ? "danger" : "neutral",
    },
    {
      label: "Profit factor",
      value: analytics.profitFactor === null ? "∞" : formatMoney(analytics.profitFactor, 2),
      detail: "用 R 倍數計算",
      tone: analytics.profitFactor === null || analytics.profitFactor >= 1 ? "good" : "warning",
    },
    {
      label: "最大回撤",
      value: `${formatMoney(analytics.maxDrawdownR, 2)}R`,
      detail: "依已結束交易曲線",
      tone: analytics.maxDrawdownR > 3 ? "warning" : "neutral",
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="rounded-lg border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-accent">Strategy performance</p>
          <h1 className="mt-2 text-3xl font-semibold">策略績效分析</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            這裡用真實交易紀錄計算勝率、R 倍數、回撤與幣種表現。TradingView 回測和實際 alert 可以分開追蹤。
          </p>
        </section>

        <MetricStrip metrics={metrics} />

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-sm text-muted">Long 勝率</p>
            <p className="mt-2 text-3xl font-semibold">{formatPercent(analytics.longWinRate)}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-sm text-muted">Short 勝率</p>
            <p className="mt-2 text-3xl font-semibold">{formatPercent(analytics.shortWinRate)}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-sm text-muted">總 PnL</p>
            <p className="mt-2 text-3xl font-semibold">{formatSigned(analytics.totalPnl)}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="border-b border-line bg-background px-4 py-3">
            <h2 className="text-xl font-semibold">幣種表現</h2>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.8fr_0.8fr] border-b border-line px-4 py-3 text-xs font-semibold uppercase text-muted">
              <span>Symbol</span>
              <span>Trades</span>
              <span>Win</span>
              <span>Loss</span>
              <span>Total R</span>
              <span>Avg R</span>
            </div>
            {analytics.symbols.map((symbol) => (
              <div key={symbol.symbol} className="grid min-w-[760px] grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.8fr_0.8fr] border-b border-line px-4 py-4 last:border-b-0">
                <span className="font-semibold">{symbol.symbol}</span>
                <span className="font-mono">{symbol.trades}</span>
                <span className="font-mono text-accent">{symbol.wins}</span>
                <span className="font-mono text-danger">{symbol.losses}</span>
                <span className={symbol.totalR >= 0 ? "font-mono text-accent" : "font-mono text-danger"}>
                  {formatSigned(symbol.totalR, "R")}
                </span>
                <span className="font-mono">{formatSigned(symbol.averageR, "R")}</span>
              </div>
            ))}
            {analytics.symbols.length === 0 ? <div className="px-4 py-8 text-sm text-muted">尚未有已結束交易可分析。</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
