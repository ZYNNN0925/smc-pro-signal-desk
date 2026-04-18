import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/auth/actions";
import { isAdminUser, requireUser } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/signals", label: "Signals" },
  { href: "/performance", label: "Performance" },
  { href: "/trades", label: "Trades" },
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const items = isAdminUser(user) ? navItems : navItems.filter((item) => item.href !== "/admin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-strong font-mono text-sm font-bold text-white">
              SP
            </span>
            <span>
              <span className="block text-base font-semibold">SMC PRO Signal Desk</span>
              <span className="block text-sm text-muted">Crypto 訊號、策略績效、通知與交易紀錄</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted transition hover:border-line-strong hover:bg-background hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button className="rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-muted transition hover:bg-background hover:text-foreground">
                登出
              </button>
            </form>
          </nav>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-1 border-t border-line px-5 py-3 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <span>{user.isDemo ? "Demo mode" : user.email}</span>
          <span>{isAdminUser(user) ? "Admin" : "Member"}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-6 md:py-8">{children}</main>
    </div>
  );
}
