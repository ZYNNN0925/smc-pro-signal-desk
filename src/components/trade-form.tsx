"use client";

import { useActionState } from "react";
import { createTradeAction, type TradeActionState } from "@/app/trades/actions";

const initialState: TradeActionState = { ok: false, message: "" };

export function TradeForm() {
  const [state, formAction, pending] = useActionState(createTradeAction, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold">新增交易紀錄</h2>
      <p className="mt-2 text-sm text-muted">用實際進出場紀錄回頭檢查訊號品質，不只看回測數字。</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium">
          幣種
          <input name="symbol" required placeholder="BINANCE:BTCUSDT" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          方向
          <select name="side" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent">
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          狀態
          <select name="status" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent">
            <option value="planned">planned</option>
            <option value="open">open</option>
            <option value="closed">closed</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          進場價
          <input name="entry_price" required inputMode="decimal" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          出場價
          <input name="exit_price" inputMode="decimal" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          倉位數量
          <input name="position_size" required inputMode="decimal" defaultValue="1" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          停損
          <input name="stop_loss" required inputMode="decimal" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          止盈
          <input name="take_profit" required inputMode="decimal" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          手續費
          <input name="fee" inputMode="decimal" defaultValue="0" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-3">
          情緒 / 失誤標籤 / 備註
          <div className="grid gap-3 md:grid-cols-3">
            <input name="emotion" placeholder="平穩、太急、猶豫" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
            <input name="mistake_tags" placeholder="追價, 過早出場" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
            <input name="notes" placeholder="本次交易觀察" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
          </div>
        </label>
      </div>

      {state.message ? (
        <p className={`mt-4 rounded-md border px-3 py-2 text-sm ${state.ok ? "border-accent bg-accent-soft text-accent" : "border-danger bg-danger-soft text-danger"}`}>
          {state.message}
        </p>
      ) : null}

      <button disabled={pending} className="mt-4 h-10 rounded-md bg-surface-strong px-4 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "儲存中..." : "新增交易"}
      </button>
    </form>
  );
}
