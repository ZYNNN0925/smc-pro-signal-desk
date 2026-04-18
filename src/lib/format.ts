export function formatMoney(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: value % 1 === 0 ? 0 : decimals,
  }).format(value);
}

export function formatSigned(value: number, suffix = "") {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatMoney(value)}${suffix}`;
}

export function formatPercent(value: number, decimals = 1) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${formatMoney(value, decimals)}%`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function sideLabel(side: "long" | "short") {
  return side === "long" ? "Long" : "Short";
}
