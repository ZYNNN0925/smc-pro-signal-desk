import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function isValidLineSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;

  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidLineSignature(rawBody, request.headers.get("x-line-signature"))) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const supabase = getSupabaseAdmin();

  if (supabase) {
    for (const event of body.events || []) {
      const userId = event?.source?.userId;

      if (userId) {
        await supabase.from("notification_channels").upsert(
          {
            platform: "line",
            external_user_id: userId,
            label: "LINE user",
            enabled: false,
            metadata: event,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "platform,external_user_id" },
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
