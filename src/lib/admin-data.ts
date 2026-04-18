import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase-admin";

export type AdminCheck = {
  label: string;
  detail: string;
  status: "ok" | "warning" | "danger";
};

export type TableCount = {
  table: string;
  count: number;
  ok: boolean;
};

export type WebhookEventSummary = {
  id: string;
  signalId?: string;
  status: string;
  error?: string;
  receivedAt: string;
};

function envSet(key: string) {
  return Boolean(process.env[key]);
}

async function countTable(table: string): Promise<TableCount> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { table, count: 0, ok: false };
  }

  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  return { table, count: count || 0, ok: !error };
}

export async function getAdminOverview() {
  const checks: AdminCheck[] = [
    {
      label: "Supabase service role",
      detail: hasSupabaseConfig() ? "後端可讀寫資料庫" : "缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY",
      status: hasSupabaseConfig() ? "ok" : "danger",
    },
    {
      label: "Supabase Auth",
      detail: envSet("NEXT_PUBLIC_SUPABASE_URL") && envSet("NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "登入設定已提供" : "登入環境變數未完整",
      status: envSet("NEXT_PUBLIC_SUPABASE_URL") && envSet("NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "ok" : "danger",
    },
    {
      label: "TradingView webhook secret",
      detail: envSet("TRADINGVIEW_WEBHOOK_SECRET") ? "Webhook 會驗證 secret" : "未設定時任何人都可送訊號",
      status: envSet("TRADINGVIEW_WEBHOOK_SECRET") ? "ok" : "danger",
    },
    {
      label: "Telegram bot",
      detail: envSet("TELEGRAM_BOT_TOKEN") ? "Telegram token 已設定" : "尚未設定 Telegram token",
      status: envSet("TELEGRAM_BOT_TOKEN") ? "ok" : "warning",
    },
    {
      label: "LINE bot",
      detail: envSet("LINE_CHANNEL_ACCESS_TOKEN") ? "LINE token 已設定" : "未使用 LINE 可先略過",
      status: envSet("LINE_CHANNEL_ACCESS_TOKEN") ? "ok" : "warning",
    },
  ];

  const tables = await Promise.all([
    countTable("profiles"),
    countTable("strategies"),
    countTable("signals"),
    countTable("signal_events"),
    countTable("notification_channels"),
    countTable("notifications"),
    countTable("trades"),
  ]);

  const supabase = getSupabaseAdmin();
  let events: WebhookEventSummary[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("signal_events")
      .select("id, signal_id, status, error, received_at")
      .order("received_at", { ascending: false })
      .limit(8);

    events = (data || []).map((event) => ({
      id: String(event.id),
      signalId: event.signal_id || undefined,
      status: String(event.status),
      error: event.error || undefined,
      receivedAt: String(event.received_at),
    }));
  }

  return { checks, tables, events };
}
