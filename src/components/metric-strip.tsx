import type { StrategyMetric } from "@/lib/types";

const toneClass: Record<StrategyMetric["tone"], string> = {
  neutral: "border-line bg-surface",
  good: "border-accent bg-accent-soft",
  warning: "border-warning bg-warning-soft",
  danger: "border-danger bg-danger-soft",
};

export function MetricStrip({ metrics }: { metrics: StrategyMetric[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className={`rounded-lg border p-4 ${toneClass[metric.tone]}`}>
          <p className="text-sm font-medium text-muted">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
          <p className="mt-1 text-sm text-muted">{metric.detail}</p>
        </div>
      ))}
    </section>
  );
}
