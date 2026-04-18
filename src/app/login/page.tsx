import { AuthForm } from "@/components/auth-form";
import { hasSupabaseAuthConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm font-semibold text-accent">SMC PRO Signal Desk</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
            登入後查看訊號、策略績效與交易紀錄
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            平台會接收 TradingView alert，寫入 Supabase，推送 Telegram 或 LINE 通知，並讓你追蹤實際交易結果。
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {["TradingView Webhook", "LINE / Telegram", "交易紀錄追蹤"].map((item) => (
              <div key={item} className="rounded-lg border border-line bg-surface p-4 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </section>

        <AuthForm nextPath={next || "/"} setupMode={!hasSupabaseAuthConfig()} />
      </div>
    </main>
  );
}
