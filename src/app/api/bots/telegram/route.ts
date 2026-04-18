import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function reply(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: NextRequest) {
  const update = await request.json().catch(() => null);
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
