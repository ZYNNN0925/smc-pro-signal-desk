import { AppShell } from "@/components/app-shell";
import { LiveRefresh } from "@/components/live-refresh";
import { SignalTable } from "@/components/signal-table";
import { getRecentSignals } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const signals = await getRecentSignals(100);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">Signal feed</p>
              <h1 className="mt-2 text-3xl font-semibold">策略訊號</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                TradingView alert 送到 webhook 後會先驗證 secret、去重、冷卻，再寫入 Supabase 並推送通知。
              </p>
            </div>
            <LiveRefresh intervalMs={30000} />
          </div>
        </section>
        <SignalTable signals={signals} />
      </div>
    </AppShell>
  );
}
