import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function isHttpUrl(value?: string) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabaseAuthUrl() {
  if (isHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  }

  if (isHttpUrl(process.env.SUPABASE_URL)) {
    return process.env.SUPABASE_URL || "";
  }

  return "";
}

export function hasSupabaseAuthConfig() {
  return Boolean(getSupabaseAuthUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function createSupabaseServerClient() {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseAuthUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies. Route handlers, actions, and proxy can.
          }
        },
      },
    },
  );
}
