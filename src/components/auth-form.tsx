"use client";

import { useActionState, useState } from "react";
import { signInAction, signUpAction, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { ok: false, message: "" };

export function AuthForm({ nextPath, setupMode }: { nextPath: string; setupMode: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialState);
  const state = mode === "signin" ? signInState : signUpState;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-background p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "signin" ? "bg-surface-strong text-white" : "text-muted"}`}
        >
          登入
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-surface-strong text-white" : "text-muted"}`}
        >
          註冊
        </button>
      </div>

      <form action={mode === "signin" ? signInFormAction : signUpFormAction} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="next" value={nextPath} />
        {mode === "signup" ? (
          <label className="flex flex-col gap-2 text-sm font-medium">
            顯示名稱
            <input
              name="display_name"
              className="h-11 rounded-md border border-line bg-background px-3 outline-none focus:border-accent"
              placeholder="例如 Jao"
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            className="h-11 rounded-md border border-line bg-background px-3 outline-none focus:border-accent"
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          密碼
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="h-11 rounded-md border border-line bg-background px-3 outline-none focus:border-accent"
            placeholder="至少 8 碼"
          />
        </label>

        {state.message ? (
          <p className={`rounded-md border px-3 py-2 text-sm ${state.ok ? "border-accent bg-accent-soft text-accent" : "border-danger bg-danger-soft text-danger"}`}>
            {state.message}
          </p>
        ) : null}

        {setupMode ? (
          <p className="rounded-md border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
            目前尚未設定 Supabase Auth 環境變數，網站會停在設定模式。請先補 `.env.local` 或 Vercel 環境變數。
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || setupMode}
          className="h-11 rounded-md bg-surface-strong px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "處理中..." : mode === "signin" ? "登入平台" : "建立帳號"}
        </button>
      </form>
    </div>
  );
}
