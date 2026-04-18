"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type TradeActionState = {
  ok: boolean;
  message: string;
};

const numeric = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return value;
}, z.number().finite());

const optionalNumeric = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return undefined;
}, z.number().finite().optional());

const tradeSchema = z.object({
  signal_id: z.string().optional(),
  symbol: z.string().min(2),
  side: z.enum(["long", "short"]),
  entry_price: numeric,
  exit_price: optionalNumeric,
  stop_loss: numeric,
  take_profit: numeric,
  position_size: numeric,
  fee: numeric.default(0),
  status: z.enum(["planned", "open", "closed"]),
  emotion: z.string().optional(),
  mistake_tags: z.string().optional(),
  notes: z.string().optional(),
});

function calculateTrade(values: z.infer<typeof tradeSchema>) {
  if (!values.exit_price) {
    return { pnl: 0, pnlR: 0, closedAt: null };
  }

  const gross =
    values.side === "long"
      ? (values.exit_price - values.entry_price) * values.position_size
      : (values.entry_price - values.exit_price) * values.position_size;
  const riskPerUnit =
    values.side === "long" ? values.entry_price - values.stop_loss : values.stop_loss - values.entry_price;
  const pnl = gross - values.fee;
  const pnlR = riskPerUnit > 0 ? gross / (riskPerUnit * values.position_size) : 0;

  return {
    pnl,
    pnlR,
    closedAt: values.status === "closed" ? new Date().toISOString() : null,
  };
}

export async function createTradeAction(_state: TradeActionState, formData: FormData): Promise<TradeActionState> {
  const user = await requireUser();
  const supabase = getSupabaseAdmin();

  if (!supabase || user.isDemo) {
    return { ok: false, message: "請先設定 Supabase service role key，才能寫入交易紀錄。" };
  }

  const parsed = tradeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "交易資料格式不完整，請檢查價格、停損與倉位。" };
  }

  const values = parsed.data;
  const calculated = calculateTrade(values);
  const mistakeTags = (values.mistake_tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const { error } = await supabase.from("trades").insert({
    user_id: user.id,
    signal_id: values.signal_id || null,
    symbol: values.symbol,
    side: values.side,
    entry_price: values.entry_price,
    exit_price: values.exit_price || null,
    stop_loss: values.stop_loss,
    take_profit: values.take_profit,
    position_size: values.position_size,
    fee: values.fee,
    pnl: calculated.pnl,
    pnl_r: calculated.pnlR,
    status: values.status,
    emotion: values.emotion || null,
    mistake_tags: mistakeTags,
    notes: values.notes || null,
    opened_at: new Date().toISOString(),
    closed_at: calculated.closedAt,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/trades");
  revalidatePath("/performance");
  revalidatePath("/");

  return { ok: true, message: "交易紀錄已新增。" };
}
