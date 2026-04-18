"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LiveRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastRefresh(new Date());
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  return (
    <span className="text-xs text-muted">
      自動更新 {Math.round(intervalMs / 1000)} 秒
      {lastRefresh ? ` / ${lastRefresh.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}` : ""}
    </span>
  );
}
