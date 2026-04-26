import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqualText } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
const MAX_LINE_BODY_BYTES = 32000;

type LineWebhookBody = {
  events?: Array<{
    source?: {
      userId?: string;
    };
  }>;
};

function isValidLineSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;

  if (!secret) {
    return true;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return timingSafeEqualText(signature, digest);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_LINE_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
  }

  if (!isValidLineSignature(rawBody, request.headers.get("x-line-signature"))) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let body: LineWebhookBody;

  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
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
