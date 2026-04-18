import { demoChannels, demoSignals, demoTrades } from "@/lib/demo-data";
import { formatDateTime, formatMoney, formatPercent, formatSigned } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  NotificationChannel,
  NotificationRecord,
  StrategyAnalytics,
  StrategyMetric,
  StrategySignal,
  SymbolPerformance,
  TradeRecord,
} from "@/lib/types";

type SignalRow = {
  id: string;
  signal_id: string;
  strategy: string;
  version: string;
  symbol: string;
  timeframe: string;
  side: "long" | "short";
  entry: number | string;
  stop_loss: number | string;
  take_profit: number | string;
  rr: number | string;
  status: StrategySignal["status"];
  reasons: string[] | null;
  confidence: number | string | null;
  created_at: string;
  updated_at: string | null;
};

type TradeRow = {
  id: string;
  signal_id: string | null;
  symbol: string;
  side: "long" | "short";
  entry_price: number | string;
  exit_price: number | string | null;
  stop_loss: number | string;
  take_profit: number | string;
  position_size: number | string;
  fee: number | string;
  pnl: number | string;
  pnl_r: number | string;
  status: "planned" | "open" | "closed";
  emotion: string | null;
  mistake_tags: string[] | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
};

type ChannelRow = {
  id: string;
  platform: NotificationChannel["platform"];
  label: string | null;
  enabled: boolean;
  updated_at: string | null;
};

type NotificationRow = {
  id: string;
  signal_id: string | null;
  platform: NotificationRecord["platform"];
  status: NotificationRecord["status"];
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

function numberValue(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapSignal(row: SignalRow): StrategySignal {
  return {
    id: row.id,
    signalId: row.signal_id,
    strategy: row.strategy,
    version: row.version,
    symbol: row.symbol,
    timeframe: row.timeframe,
    side: row.side,
    entry: numberValue(row.entry),
    stopLoss: numberValue(row.stop_loss),
    takeProfit: numberValue(row.take_profit),
    rr: numberValue(row.rr, 2),
    status: row.status,
    reasons: row.reasons || [],
    confidence: numberValue(row.confidence, 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

function mapTrade(row: TradeRow): TradeRecord {
  return {
    id: row.id,
    signalId: row.signal_id || undefined,
    symbol: row.symbol,
    side: row.side,
    entryPrice: numberValue(row.entry_price),
    exitPrice: row.exit_price === null ? undefined : numberValue(row.exit_price),
    stopLoss: numberValue(row.stop_loss),
    takeProfit: numberValue(row.take_profit),
    positionSize: numberValue(row.position_size),
    fee: numberValue(row.fee),
    pnl: numberValue(row.pnl),
    pnlR: numberValue(row.pnl_r),
    status: row.status,
    emotion: row.emotion || "",
    mistakeTags: row.mistake_tags || [],
    notes: row.notes || "",
    openedAt: row.opened_at,
    closedAt: row.closed_at || undefined,
  };
}

function mapNotification(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    signalId: row.signal_id || undefined,
    platform: row.platform,
    status: row.status,
    error: row.error || undefined,
    sentAt: row.sent_at || undefined,
    createdAt: row.created_at,
  };
}

async function fetchSignals(limit = 100) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return demoSignals;
  }

  const { data, error } = await supabase
    .from("signals")
    .select(
      "id, signal_id, strategy, version, symbol, timeframe, side, entry, stop_loss, take_profit, rr, status, reasons, confidence, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data || []).map((row) => mapSignal(row as SignalRow));
}

export async function getRecentSignals(limit = 20) {
  return fetchSignals(limit);
}

export async function getUserTrades(userId: string, isDemo = false, limit = 500) {
  const supabase = getSupabaseAdmin();

  if (!supabase || isDemo) {
    return demoTrades;
  }

  const { data, error } = await supabase
    .from("trades")
    .select(
      "id, signal_id, symbol, side, entry_price, exit_price, stop_loss, take_profit, position_size, fee, pnl, pnl_r, status, emotion, mistake_tags, notes, opened_at, closed_at",
    )
    .eq("user_id", userId)
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data || []).map((row) => mapTrade(row as TradeRow));
}

export async function getUserNotificationChannels(userId: string, isDemo = false) {
  const supabase = getSupabaseAdmin();

  if (!supabase || isDemo) {
    return demoChannels;
  }

  const { data, error } = await supabase
    .from("notification_channels")
    .select("id, platform, label, enabled, updated_at")
    .eq("user_id", userId)
    .order("platform", { ascending: true });

  if (error) {
    return [];
  }

  return (data || []).map((row) => {
    const channel = row as ChannelRow;
    return {
      id: channel.id,
      platform: channel.platform,
      label: channel.label || channel.platform,
      enabled: channel.enabled,
      lastDelivery: channel.updated_at ? `更新於 ${formatDateTime(channel.updated_at)}` : "尚未綁定",
    };
  });
}

export async function getRecentNotifications(userId?: string, limit = 20) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] as NotificationRecord[];
  }

  let query = supabase
    .from("notifications")
    .select("id, signal_id, platform, status, error, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return (data || []).map((row) => mapNotification(row as NotificationRow));
}

function closedTrades(trades: TradeRecord[]) {
  return trades.filter((trade) => trade.status === "closed" || typeof trade.exitPrice === "number");
}

function winRate(trades: TradeRecord[]) {
  if (!trades.length) {
    return 0;
  }

  return (trades.filter((trade) => trade.pnlR > 0).length / trades.length) * 100;
}

function maxDrawdownR(trades: TradeRecord[]) {
  const ordered = [...trades].sort((a, b) => {
    const aTime = new Date(a.closedAt || a.openedAt).getTime();
    const bTime = new Date(b.closedAt || b.openedAt).getTime();
    return aTime - bTime;
  });

  let equity = 0;
  let peak = 0;
  let drawdown = 0;

  for (const trade of ordered) {
    equity += trade.pnlR;
    peak = Math.max(peak, equity);
    drawdown = Math.max(drawdown, peak - equity);
  }

  return drawdown;
}

function sideWinRate(trades: TradeRecord[], side: "long" | "short") {
  return winRate(trades.filter((trade) => trade.side === side));
}

function symbolPerformance(trades: TradeRecord[]) {
  const grouped = new Map<string, TradeRecord[]>();

  for (const trade of trades) {
    const symbol = trade.symbol.toUpperCase();
    grouped.set(symbol, [...(grouped.get(symbol) || []), trade]);
  }

  return [...grouped.entries()]
    .map(([symbol, rows]): SymbolPerformance => {
      const wins = rows.filter((trade) => trade.pnlR > 0).length;
      const losses = rows.filter((trade) => trade.pnlR < 0).length;
      const totalR = rows.reduce((total, trade) => total + trade.pnlR, 0);
      const pnl = rows.reduce((total, trade) => total + trade.pnl, 0);

      return {
        symbol,
        trades: rows.length,
        wins,
        losses,
        winRate: rows.length ? (wins / rows.length) * 100 : 0,
        totalR,
        averageR: rows.length ? totalR / rows.length : 0,
        pnl,
      };
    })
    .sort((a, b) => b.totalR - a.totalR);
}

export function buildStrategyAnalytics(signals: StrategySignal[], trades: TradeRecord[]): StrategyAnalytics {
  const closed = closedTrades(trades);
  const wins = closed.filter((trade) => trade.pnlR > 0);
  const losses = closed.filter((trade) => trade.pnlR < 0);
  const grossWinR = wins.reduce((total, trade) => total + trade.pnlR, 0);
  const grossLossR = Math.abs(losses.reduce((total, trade) => total + trade.pnlR, 0));
  const totalR = closed.reduce((total, trade) => total + trade.pnlR, 0);
  const symbols = symbolPerformance(closed);

  return {
    signalCount: signals.length,
    openSignals: signals.filter((signal) => signal.status === "open").length,
    closedTrades: closed.length,
    winRate: winRate(closed),
    totalPnl: closed.reduce((total, trade) => total + trade.pnl, 0),
    totalR,
    averageR: closed.length ? totalR / closed.length : 0,
    profitFactor: grossLossR > 0 ? grossWinR / grossLossR : wins.length ? null : 0,
    maxDrawdownR: maxDrawdownR(closed),
    longWinRate: sideWinRate(closed, "long"),
    shortWinRate: sideWinRate(closed, "short"),
    bestSymbol: symbols[0],
    worstSymbol: symbols.length > 1 ? symbols[symbols.length - 1] : undefined,
    symbols,
  };
}

function buildDashboardMetrics(
  signals: StrategySignal[],
  trades: TradeRecord[],
  notifications: NotificationRecord[],
): StrategyMetric[] {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysSignals = signals.filter((signal) => new Date(signal.createdAt) >= startOfDay);
  const closed = closedTrades(trades);
  const analytics = buildStrategyAnalytics(signals, trades);
  const failedNotifications = notifications.filter((item) => item.status === "failed");

  return [
    {
      label: "今日訊號",
      value: String(todaysSignals.length),
      detail: `${analytics.openSignals} 筆仍在追蹤`,
      tone: todaysSignals.length ? "good" : "neutral",
    },
    {
      label: "交易勝率",
      value: formatPercent(analytics.winRate),
      detail: `${closed.length} 筆已結束交易`,
      tone: analytics.winRate >= 50 ? "good" : closed.length ? "warning" : "neutral",
    },
    {
      label: "累積 R 倍數",
      value: formatSigned(analytics.totalR, "R"),
      detail: `平均 ${formatSigned(analytics.averageR, "R")}`,
      tone: analytics.totalR > 0 ? "good" : analytics.totalR < 0 ? "danger" : "neutral",
    },
    {
      label: "通知狀態",
      value: failedNotifications.length ? `${failedNotifications.length} 失敗` : "正常",
      detail: notifications.length ? `${notifications.length} 筆最近紀錄` : "尚無發送紀錄",
      tone: failedNotifications.length ? "warning" : "neutral",
    },
  ];
}

export async function getDashboardData(userId: string, isDemo = false) {
  const [signals, signalHistory, trades, channels, notifications] = await Promise.all([
    getRecentSignals(20),
    fetchSignals(500),
    getUserTrades(userId, isDemo, 500),
    getUserNotificationChannels(userId, isDemo),
    getRecentNotifications(userId, 50),
  ]);

  const analytics = buildStrategyAnalytics(signalHistory, trades);

  return {
    signals,
    trades,
    channels,
    notifications,
    analytics,
    metrics: isDemo ? buildDashboardMetrics(demoSignals, demoTrades, []) : buildDashboardMetrics(signalHistory, trades, notifications),
    pnlLabel: formatSigned(analytics.totalR, "R"),
    pnlDetail: `${formatMoney(analytics.totalPnl)} USDT / ${analytics.closedTrades} 筆已結束`,
  };
}
