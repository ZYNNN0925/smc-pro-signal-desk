export type SignalSide = "long" | "short";
export type SignalStatus = "open" | "won" | "lost" | "cancelled";
export type NotificationPlatform = "telegram" | "line" | "email" | "push";

export type StrategySignal = {
  id: string;
  signalId: string;
  strategy: string;
  version: string;
  symbol: string;
  timeframe: string;
  side: SignalSide;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rr: number;
  status: SignalStatus;
  reasons: string[];
  confidence: number;
  createdAt: string;
  updatedAt?: string;
};

export type TradeRecord = {
  id: string;
  signalId?: string;
  symbol: string;
  side: SignalSide;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  fee: number;
  pnl: number;
  pnlR: number;
  status: "planned" | "open" | "closed";
  emotion: string;
  mistakeTags: string[];
  notes: string;
  openedAt: string;
  closedAt?: string;
};

export type StrategyMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "good" | "warning" | "danger";
};

export type NotificationChannel = {
  id: string;
  platform: NotificationPlatform;
  label: string;
  enabled: boolean;
  lastDelivery: string;
};

export type NotificationRecord = {
  id: string;
  signalId?: string;
  platform: NotificationPlatform;
  status: "queued" | "sent" | "failed" | "skipped";
  error?: string;
  sentAt?: string;
  createdAt: string;
};

export type SymbolPerformance = {
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalR: number;
  averageR: number;
  pnl: number;
};

export type StrategyAnalytics = {
  signalCount: number;
  openSignals: number;
  closedTrades: number;
  winRate: number;
  totalPnl: number;
  totalR: number;
  averageR: number;
  profitFactor: number | null;
  maxDrawdownR: number;
  longWinRate: number;
  shortWinRate: number;
  bestSymbol?: SymbolPerformance;
  worstSymbol?: SymbolPerformance;
  symbols: SymbolPerformance[];
};
