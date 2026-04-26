import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendSignalNotifications } from "@/lib/notifications";
import { normalizeTradingViewPayload, signalToDatabaseRow, tradingViewSignalSchema } from "@/lib/tradingview";
import { anySecretMatches } from "@/lib/security";
import type { StrategySignal } from "@/lib/types";

export const dynamic = "force-dynamic";
const MAX_WEBHOOK_BODY_BYTES = 16000;

function cooldownMinutes() {
  const value = Number(process.env.TRADINGVIEW_WEBHOOK_COOLDOWN_MINUTES || 10);
  return Number.isFinite(value) && value >= 0 ? value : 10;
}

function sanitizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const rest = { ...(payload as Record<string, unknown>) };
  delete rest.secret;
  return rest;
}

async function logSignalEvent(input: {
  signalId?: string | null;
  source?: string;
  payload: unknown;
  status: "accepted" | "duplicate" | "cooldown" | "failed" | "unauthorized";
  error?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase.from("signal_events").insert({
    signal_id: input.signalId || null,
    source: input.source || "tradingview",
    payload: sanitizePayload(input.payload) || {},
    received_at: new Date().toISOString(),
    status: input.status,
    error: input.error || null,
  });
}

async function findRecentSimilarSignal(signal: StrategySignal) {
  const supabase = getSupabaseAdmin();

  if (!supabase || cooldownMinutes() === 0) {
    return null;
  }

  const since = new Date(Date.now() - cooldownMinutes() * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("signals")
    .select("signal_id, created_at")
    .eq("strategy", signal.strategy)
    .eq("symbol", signal.symbol)
    .eq("timeframe", signal.timeframe)
    .eq("side", signal.side)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as { signal_id: string; created_at: string } | null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let body: unknown;

  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BODY_BYTES) {
    await logSignalEvent({
      payload: { size: Buffer.byteLength(rawBody, "utf8") },
      status: "failed",
      error: "payload too large",
    });
    return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
  }

  try {
    body = JSON.parse(rawBody);
  } catch {
    await logSignalEvent({ payload: { rawBody: rawBody.slice(0, 1000) }, status: "failed", error: "invalid json" });
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = tradingViewSignalSchema.safeParse(body);

  if (!parsed.success) {
    await logSignalEvent({ payload: body, status: "failed", error: "invalid payload" });
    return NextResponse.json(
      { ok: false, error: "invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const expectedSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET;
  const headerSecret = request.headers.get("x-webhook-secret");
  const payloadSecret = parsed.data.secret;

  if (!anySecretMatches(expectedSecret, [headerSecret, payloadSecret])) {
    await logSignalEvent({
      signalId: parsed.data.signal_id,
      payload: body,
      status: "unauthorized",
      error: "webhook secret mismatch",
    });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const signal = normalizeTradingViewPayload(parsed.data);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const notifications = await sendSignalNotifications(signal);
    return NextResponse.json({
      ok: true,
      accepted: true,
      persisted: false,
      signalId: signal.signalId,
      notifications,
    });
  }

  const { data: existing } = await supabase
    .from("signals")
    .select("signal_id")
    .eq("signal_id", signal.signalId)
    .maybeSingle();

  if (existing) {
    await logSignalEvent({ signalId: signal.signalId, payload: body, status: "duplicate" });
    return NextResponse.json({
      ok: true,
      accepted: false,
      duplicate: true,
      persisted: true,
      signalId: signal.signalId,
      notifications: [],
    });
  }

  const recentSimilar = await findRecentSimilarSignal(signal);

  if (recentSimilar && recentSimilar.signal_id !== signal.signalId) {
    await logSignalEvent({
      signalId: signal.signalId,
      payload: body,
      status: "cooldown",
      error: `recent similar signal ${recentSimilar.signal_id}`,
    });
    return NextResponse.json({
      ok: true,
      accepted: false,
      cooldown: true,
      cooldownMinutes: cooldownMinutes(),
      signalId: signal.signalId,
      duplicateOf: recentSimilar.signal_id,
      notifications: [],
    });
  }

  const { error } = await supabase.from("signals").insert(signalToDatabaseRow(signal));

  if (error) {
    const isDuplicate = error.code === "23505";
    await logSignalEvent({
      signalId: signal.signalId,
      payload: body,
      status: isDuplicate ? "duplicate" : "failed",
      error: error.message,
    });

    return NextResponse.json(
      {
        ok: isDuplicate,
        accepted: false,
        duplicate: isDuplicate,
        persisted: false,
        persistenceError: error.message,
        signalId: signal.signalId,
        notifications: [],
      },
      { status: isDuplicate ? 200 : 500 },
    );
  }

  await logSignalEvent({ signalId: signal.signalId, payload: body, status: "accepted" });
  const notifications = await sendSignalNotifications(signal);

  return NextResponse.json({
    ok: true,
    accepted: true,
    persisted: true,
    signalId: signal.signalId,
    notifications,
  });
}
