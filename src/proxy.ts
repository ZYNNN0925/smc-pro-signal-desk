import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/", "/signals", "/trades", "/settings", "/admin"];

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

function supabaseAuthUrl() {
  if (isHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  }

  if (isHttpUrl(process.env.SUPABASE_URL)) {
    return process.env.SUPABASE_URL || "";
  }

  return "";
}

function hasAuthConfig() {
  return Boolean(supabaseAuthUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasAuthConfig()) {
    return response;
  }

  const supabase = createServerClient(
    supabaseAuthUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
