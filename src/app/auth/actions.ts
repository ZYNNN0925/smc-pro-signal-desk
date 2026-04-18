"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient, hasSupabaseAuthConfig } from "@/lib/supabase/server";

export type AuthActionState = {
  message: string;
  ok: boolean;
};

function cleanRedirect(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/";

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}

function credentials(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("display_name") || "").trim();

  return { email, password, displayName };
}

async function getRequestOrigin() {
  const fallback = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");

  if (!host) {
    return fallback;
  }

  const forwardedProto = headerStore.get("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() || (host.includes("localhost") ? "http" : "https");
  const normalizedHost = host.split(",")[0]?.trim();

  return normalizedHost ? `${protocol}://${normalizedHost}` : fallback;
}

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!hasSupabaseAuthConfig()) {
    return { ok: false, message: "請先設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY。" };
  }

  const supabase = await createSupabaseServerClient();
  const { email, password } = credentials(formData);

  if (!email || !password) {
    return { ok: false, message: "請輸入 email 與密碼。" };
  }

  const { error } = await supabase!.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect(cleanRedirect(formData.get("next")));
}

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!hasSupabaseAuthConfig()) {
    return { ok: false, message: "請先設定 Supabase Auth 環境變數。" };
  }

  const supabase = await createSupabaseServerClient();
  const { email, password, displayName } = credentials(formData);

  if (!email || password.length < 8) {
    return { ok: false, message: "請輸入 email，密碼至少 8 碼。" };
  }

  const origin = await getRequestOrigin();
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(cleanRedirect(formData.get("next")))}`,
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const admin = getSupabaseAdmin();
  if (admin && data.user) {
    await admin.from("profiles").upsert(
      {
        user_id: data.user.id,
        email,
        display_name: displayName || email.split("@")[0],
        role: "member",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  if (!data.session) {
    return { ok: true, message: "註冊完成，請到信箱確認驗證連結。" };
  }

  revalidatePath("/", "layout");
  redirect(cleanRedirect(formData.get("next")));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
