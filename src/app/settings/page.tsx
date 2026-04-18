import { AppShell } from "@/components/app-shell";
import { NotificationSettingsForm } from "@/components/notification-settings-form";
import { requireUser } from "@/lib/auth";
import { getRecentNotifications, getUserNotificationChannels } from "@/lib/platform-data";
import { hasSupabaseConfig } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const envItems = [
  ["NEXT_PUBLIC_APP_URL", "網站網址與登入 callback 使用"],
  ["ADMIN_EMAILS", "管理員 email，多個用逗號分隔"],
  ["NEXT_PUBLIC_SUPABASE_URL", "Supabase 專案 URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase Auth 登入使用"],
  ["SUPABASE_URL", "Supabase service client URL"],
  ["SUPABASE_SERVICE_ROLE_KEY", "後端寫入資料庫使用"],
  ["TRADINGVIEW_WEBHOOK_SECRET", "TradingView webhook 驗證"],
  ["TELEGRAM_BOT_TOKEN", "Telegram 訊號通知"],
  ["LINE_CHANNEL_ACCESS_TOKEN", "LINE 訊號通知，未使用 LINE 可留空"],
];

export default async function SettingsPage() {
  const user = await requireUser();
  const [channels, notifications] = await Promise.all([
    getUserNotificationChannels(user.id, user.isDemo),
    getRecentNotifications(user.id, 10),
  ]);

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-accent">Runtime</p>
          <h1 className="mt-2 text-3xl font-semibold">系統設定</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            這裡用來確認 Supabase、TradingView webhook 和通知機器人的環境設定。LINE 沒啟用也不影響 Telegram。
          </p>
          <div className="mt-5 rounded-lg border border-line bg-background p-4">
            <p className="text-sm text-muted">Supabase</p>
            <p className="mt-2 text-2xl font-semibold">{hasSupabaseConfig() ? "已連線" : "Demo mode"}</p>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">環境變數清單</h2>
          <div className="mt-4 flex flex-col gap-3">
            {envItems.map(([key, detail]) => (
              <div key={key} className="flex flex-col gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                <code className="font-mono text-sm font-semibold">{key}</code>
                <span className="text-sm text-muted">{detail}</span>
              </div>
            ))}
          </div>
        </section>

        <NotificationSettingsForm />

        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">已綁定管道</h2>
          <div className="mt-4 flex flex-col gap-3">
            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between border-b border-line pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-semibold">{channel.label}</p>
                  <p className="mt-1 text-sm text-muted">{channel.platform}</p>
                </div>
                <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${channel.enabled ? "border-accent bg-accent-soft text-accent" : "border-line-strong bg-background text-muted"}`}>
                  {channel.enabled ? "啟用" : "停用"}
                </span>
              </div>
            ))}
            {channels.length === 0 ? <p className="text-sm text-muted">尚未綁定通知管道。</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="text-xl font-semibold">TradingView Webhook URL</h2>
          <p className="mt-2 text-sm text-muted">部署後把這個路徑貼到 TradingView Alert Webhook URL。</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-background p-4 text-sm">
            <code>https://2026-04-18-app-version-5-strategy-s.vercel.app/api/webhooks/tradingview</code>
          </pre>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="text-xl font-semibold">最近通知紀錄</h2>
          <div className="mt-4 flex flex-col gap-3">
            {notifications.map((item) => (
              <div key={item.id} className="flex flex-col gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{item.platform} / {item.status}</p>
                  <p className="mt-1 text-sm text-muted">{item.signalId || "system"}</p>
                </div>
                <p className="max-w-xl truncate text-sm text-muted">{item.error || item.sentAt || item.createdAt}</p>
              </div>
            ))}
            {notifications.length === 0 ? <p className="text-sm text-muted">尚無通知紀錄。</p> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
