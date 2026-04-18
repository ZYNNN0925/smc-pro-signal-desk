import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LiveRefresh } from "@/components/live-refresh";
import { MetricStrip } from "@/components/metric-strip";
import { SignalChart } from "@/components/signal-chart";
import { SignalTable } from "@/components/signal-table";
import { requireUser } from "@/lib/auth";
import { formatMoney, formatPercent, formatSigned } from "@/lib/format";
import { getDashboardData } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const { signals, channels, analytics, metrics, pnlLabel, pnlDetail, notifications } = await getDashboardData(
    user.id,
    user.isDemo,
  );
  const failedNotifications = notifications.filter((item) => item.status === "failed");

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <section className="grid gap-5 md:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-accent">Crypto workspace</p>
                  <LiveRefresh intervalMs={30000} />
                </div>
                <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
                  會員訊號平台與策略績效儀表板
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                  Binance 現貨行情已接入圖表，TradingView webhook 會寫入訊號、去重、冷卻並推送通知。
                </p>
              </div>
              <div className="rounded-lg border border-line bg-background p-4">
                <p className="text-sm text-muted">Open signals</p>
                <p className="mt-2 text-4xl font-semibold">{analytics.openSignals}</p>
                <p className="mt-1 text-xs text-muted">{analytics.signalCount} 筆訊號樣本</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface-strong p-5 text-white">
            <p className="text-sm text-white/70">Personal journal</p>
            <p className="mt-3 text-4xl font-semibold">{pnlLabel}</p>
            <p className="mt-4 text-sm leading-6 text-white/70">{pnlDetail}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60">勝率</p>
                <p className="mt-1 font-semibold">{formatPercent(analytics.winRate)}</p>
              </div>
              <div>
                <p className="text-white/60">最大回撤</p>
                <p className="mt-1 font-semibold">{formatMoney(analytics.maxDrawdownR, 2)}R</p>
              </div>
            </div>
          </div>
        </section>

        <MetricStrip metrics={metrics} />

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Crypto 即時圖表</h2>
                <p className="mt-1 text-sm text-muted">行情來源為 Binance Spot，API 端已加短快取降低延遲與請求壓力。</p>
              </div>
            </div>
            <SignalChart />
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">通知管道</h2>
                <p className="mt-1 text-sm text-muted">TradingView 訊號會推送到已啟用的 Telegram 或 LINE 管道。</p>
              </div>
              <Link href="/settings" className="rounded-md border border-line-strong px-3 py-2 text-sm font-semibold text-muted">
                設定
              </Link>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold">{channel.label}</p>
                    <p className="mt-1 text-sm text-muted">{channel.lastDelivery}</p>
                  </div>
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      channel.enabled
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line-strong bg-background text-muted"
                    }`}
                  >
                    {channel.enabled ? "啟用" : "停用"}
                  </span>
                </div>
              ))}
              {channels.length === 0 ? <p className="text-sm text-muted">尚未綁定通知管道。</p> : null}
            </div>
            <div className="mt-5 rounded-lg border border-line bg-background p-4">
              <p className="text-sm font-semibold">最近通知</p>
              <p className={`mt-2 text-sm ${failedNotifications.length ? "text-warning" : "text-muted"}`}>
                {failedNotifications.length ? `${failedNotifications.length} 筆發送失敗，請到設定頁檢查 token 或 chat id。` : "目前沒有失敗通知。"}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">最新訊號</h2>
              <p className="mt-1 text-sm text-muted">Webhook 接收後會先去重與冷卻，再寫入這張列表。</p>
            </div>
            <Link href="/signals" className="text-sm font-semibold text-accent">
              查看全部
            </Link>
          </div>
          <SignalTable signals={signals.slice(0, 6)} />
        </section>

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
            <p className="text-sm text-muted">最佳幣種</p>
            <p className="mt-2 text-3xl font-semibold">{analytics.bestSymbol?.symbol || "-"}</p>
            <p className="mt-1 text-sm text-muted">
              {analytics.bestSymbol ? formatSigned(analytics.bestSymbol.totalR, "R") : "等待交易紀錄"}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
