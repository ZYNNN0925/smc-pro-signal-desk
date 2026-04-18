import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { StrategySignal } from "@/lib/types";

type DeliveryResult = {
  platform: "telegram" | "line";
  ok: boolean;
  status: "sent" | "failed" | "skipped";
  detail: string;
  attempts: number;
  channelId?: string;
};

type StoredNotificationChannel = {
  id: string;
  user_id: string | null;
  platform: "telegram" | "line";
  external_user_id: string | null;
  enabled: boolean;
};

function priceLine(label: string, value: number) {
  return `${label}: ${Number.isFinite(value) ? value : "-"}`;
}

function signalMessage(signal: StrategySignal) {
  const direction = signal.side === "long" ? "Long" : "Short";
  const reasons = signal.reasons.length ? signal.reasons.join(", ") : "策略條件已成立";

  return [
    `SMC PRO ${direction} 訊號`,
    "",
    `幣種: ${signal.symbol}`,
    `週期: ${signal.timeframe}`,
    priceLine("進場", signal.entry),
    priceLine("停損", signal.stopLoss),
    priceLine("止盈", signal.takeProfit),
    `RR: ${signal.rr}`,
    `信心分數: ${signal.confidence}`,
    `原因: ${reasons}`,
    "",
    "請依自己的風控判斷，這不是財務建議。",
  ].join("\n");
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 1) {
  let lastResponse: Response | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);
      lastResponse = response;

      if (response.ok || response.status < 500) {
        return { response, attempts: attempt + 1 };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    return { response: lastResponse, attempts: retries + 1 };
  }

  throw lastError instanceof Error ? lastError : new Error("delivery failed");
}

async function sendTelegramTo(signal: StrategySignal, chatId: string, channelId?: string): Promise<DeliveryResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !chatId) {
    return { platform: "telegram", ok: false, status: "skipped", detail: "telegram env or chat id not configured", attempts: 0, channelId };
  }

  try {
    const { response, attempts } = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: signalMessage(signal),
        disable_web_page_preview: true,
      }),
    });

    return {
      platform: "telegram",
      ok: response.ok,
      status: response.ok ? "sent" : "failed",
      detail: response.ok ? "sent" : await response.text(),
      attempts,
      channelId,
    };
  } catch (error) {
    return {
      platform: "telegram",
      ok: false,
      status: "failed",
      detail: error instanceof Error ? error.message : "telegram delivery failed",
      attempts: 2,
      channelId,
    };
  }
}

async function sendLineTo(signal: StrategySignal, userId: string, channelId?: string): Promise<DeliveryResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token || !userId) {
    return { platform: "line", ok: false, status: "skipped", detail: "line env or user id not configured", attempts: 0, channelId };
  }

  try {
    const { response, attempts } = await fetchWithRetry("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: signalMessage(signal) }],
      }),
    });

    return {
      platform: "line",
      ok: response.ok,
      status: response.ok ? "sent" : "failed",
      detail: response.ok ? "sent" : await response.text(),
      attempts,
      channelId,
    };
  } catch (error) {
    return {
      platform: "line",
      ok: false,
      status: "failed",
      detail: error instanceof Error ? error.message : "line delivery failed",
      attempts: 2,
      channelId,
    };
  }
}

async function logNotification(signal: StrategySignal, result: DeliveryResult, userId?: string | null) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase.from("notifications").insert({
    signal_id: signal.signalId,
    user_id: userId || null,
    channel_id: result.channelId || null,
    platform: result.platform,
    status: result.status,
    error: result.ok ? null : `attempts=${result.attempts}; ${result.detail}`.slice(0, 1000),
    sent_at: result.ok ? new Date().toISOString() : null,
  });
}

async function sendFallbackAdminNotifications(signal: StrategySignal) {
  const results = await Promise.all([
    process.env.TELEGRAM_ADMIN_CHAT_ID
      ? sendTelegramTo(signal, process.env.TELEGRAM_ADMIN_CHAT_ID)
      : Promise.resolve({ platform: "telegram" as const, ok: false, status: "skipped" as const, detail: "telegram admin chat id not configured", attempts: 0 }),
    process.env.LINE_ADMIN_USER_ID
      ? sendLineTo(signal, process.env.LINE_ADMIN_USER_ID)
      : Promise.resolve({ platform: "line" as const, ok: false, status: "skipped" as const, detail: "line admin user id not configured", attempts: 0 }),
  ]);

  await Promise.all(results.map((result) => logNotification(signal, result, null)));
  return results;
}

export async function sendSignalNotifications(signal: StrategySignal) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return sendFallbackAdminNotifications(signal);
  }

  const { data, error } = await supabase
    .from("notification_channels")
    .select("id, user_id, platform, external_user_id, enabled")
    .in("platform", ["telegram", "line"])
    .eq("enabled", true);

  if (error || !data?.length) {
    return sendFallbackAdminNotifications(signal);
  }

  const deliveries = (data as StoredNotificationChannel[]).map(async (channel) => {
    const result =
      channel.platform === "telegram"
        ? await sendTelegramTo(signal, channel.external_user_id || "", channel.id)
        : await sendLineTo(signal, channel.external_user_id || "", channel.id);

    await logNotification(signal, result, channel.user_id);
    return result;
  });

  const results = await Promise.allSettled(deliveries);

  return results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { platform: "telegram" as const, ok: false, status: "failed" as const, detail: result.reason?.message || "delivery failed", attempts: 1 },
  );
}
