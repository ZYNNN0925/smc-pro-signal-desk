import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqualText } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
const MAX_TELEGRAM_BODY_BYTES = 16000;

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number;
      username?: string;
      first_name?: string;
    };
    text?: string;
  };
};

async function reply(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
}

function hasValidTelegramSecret(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expected) {
    return true;
  }

  return timingSafeEqualText(request.headers.get("x-telegram-bot-api-secret-token"), expected);
}

export async function POST(request: NextRequest) {
  if (!hasValidTelegramSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_TELEGRAM_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
  }

  let update: TelegramUpdate | null;

  try {
    update = JSON.parse(rawBody || "null");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text = message?.text || "";

  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseAdmin();

  if (supabase) {
    await supabase.from("notification_channels").upsert(
      {
        platform: "telegram",
        external_user_id: String(chatId),
        label: message?.chat?.username || message?.chat?.first_name || "Telegram user",
        enabled: false,
        metadata: update,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform,external_user_id" },
    );
  }

  if (text.startsWith("/start")) {
    await reply(chatId, `SMC PRO 已收到你的 Telegram。請到網站 /settings 填入這個 chat id：${chatId}`);
  }

  return NextResponse.json({ ok: true });
}
