import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient, hasSupabaseAuthConfig } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  email: string;
  role: "member" | "admin";
  isDemo: boolean;
};

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(user: AppUser) {
  return user.role === "admin" || adminEmails().has(user.email.toLowerCase());
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!hasSupabaseAuthConfig()) {
    return {
      id: "demo-user",
      email: "demo@smc-pro.local",
      role: "admin",
      isDemo: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase!.auth.getUser();

  if (error || !data.user?.email) {
    return null;
  }

  let role: AppUser["role"] = adminEmails().has(data.user.email.toLowerCase()) ? "admin" : "member";
  const admin = getSupabaseAdmin();

  if (admin) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profile?.role === "admin" || profile?.role === "member") {
      role = profile.role;
    }
  }

  return {
    id: data.user.id,
    email: data.user.email,
    role,
    isDemo: false,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!isAdminUser(user)) {
    redirect("/");
  }

  return user;
}
