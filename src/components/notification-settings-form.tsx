"use client";

import { useActionState } from "react";
import { saveNotificationChannelAction, type SettingsActionState } from "@/app/settings/actions";

const initialState: SettingsActionState = { ok: false, message: "" };

export function NotificationSettingsForm() {
  const [state, formAction, pending] = useActionState(saveNotificationChannelAction, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold">通知管道</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Telegram 請填 chat id，LINE 請填 user id。TradingView 訊號進來後，系統會推送給已啟用的管道。
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[0.6fr_1fr_1fr]">
        <label className="flex flex-col gap-2 text-sm font-medium">
          平台
          <select name="platform" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent">
            <option value="telegram">Telegram</option>
            <option value="line">LINE</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          外部使用者 ID
          <input name="external_user_id" required className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          顯示名稱
          <input name="label" placeholder="我的 Telegram" className="h-10 rounded-md border border-line bg-background px-3 outline-none focus:border-accent" />
        </label>
      </div>

      {state.message ? (
        <p className={`mt-4 rounded-md border px-3 py-2 text-sm ${state.ok ? "border-accent bg-accent-soft text-accent" : "border-danger bg-danger-soft text-danger"}`}>
          {state.message}
        </p>
      ) : null}

      <button disabled={pending} className="mt-4 h-10 rounded-md bg-surface-strong px-4 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "儲存中..." : "儲存通知管道"}
      </button>
    </form>
  );
}
