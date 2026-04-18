import type { SignalStatus } from "@/lib/types";

const statusClass: Record<SignalStatus, string> = {
  open: "border-accent bg-accent-soft text-accent",
  won: "border-accent bg-accent-soft text-accent",
  lost: "border-danger bg-danger-soft text-danger",
  cancelled: "border-line-strong bg-surface text-muted",
};

const statusLabel: Record<SignalStatus, string> = {
  open: "追蹤中",
  won: "已達標",
  lost: "已停損",
  cancelled: "已取消",
};

export function StatusPill({ status }: { status: SignalStatus }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-semibold ${statusClass[status]}`}>
      {statusLabel[status]}
    </span>
  );
}
