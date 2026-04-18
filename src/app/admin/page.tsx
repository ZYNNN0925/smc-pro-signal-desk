import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getAdminOverview } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const statusClass = {
  ok: "border-accent bg-accent-soft text-accent",
  warning: "border-warning bg-warning-soft text-warning",
  danger: "border-danger bg-danger-soft text-danger",
};

export default async function AdminPage() {
  await requireAdmin();
  const { checks, tables, events } = await getAdminOverview();

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-accent">Operator</p>
          <h1 className="mt-2 text-3xl font-semibold">管理後台</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            這裡會檢查環境變數、資料表可讀狀態、Webhook 最近事件與通知紀錄，方便部署後排查問題。
          </p>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">系統檢查</h2>
          <div className="mt-4 flex flex-col gap-3">
            {checks.map((item) => (
              <div key={item.label} className="flex flex-col gap-2 border-b border-line pb-3 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-muted">{item.detail}</p>
                </div>
                <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClass[item.status]}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">資料表狀態</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {tables.map((item) => (
              <div key={item.table} className="rounded-lg border border-line bg-background p-4">
                <p className="font-mono text-sm font-semibold">{item.table}</p>
                <p className="mt-2 text-2xl font-semibold">{item.ok ? item.count : "ERR"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">最近 Webhook 事件</h2>
          <div className="mt-4 flex flex-col gap-3">
            {events.map((event) => (
              <div key={event.id} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{event.status}</p>
                  <p className="text-sm text-muted">{formatDateTime(event.receivedAt)}</p>
                </div>
                <p className="mt-1 truncate text-sm text-muted">{event.signalId || "no signal id"}</p>
                {event.error ? <p className="mt-1 truncate text-sm text-danger">{event.error}</p> : null}
              </div>
            ))}
            {events.length === 0 ? <p className="text-sm text-muted">尚無 webhook 事件。</p> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
