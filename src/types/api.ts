export type AuthResponse = {
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
};

export type StoredUser = {
  id: string;
  email: string;
};

export type DemoAccount = {
  id: string;
  initialBalance: string;
  cashBalance: string;
  resetCount: number;
  lastResetAt: string | null;
  positions: Array<{
    id: string;
    symbol: string;
    quantity: string;
    averageEntryPrice: string;
    stopLoss: string | null;
    takeProfit: string | null;
    status: 'OPEN' | 'CLOSED';
    openedAt: string;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  orders: Array<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET';
    quantity: string;
    executionPrice: string | null;
    status: 'FILLED' | 'REJECTED';
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  trades: Array<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: string;
    price: string;
    realizedPnl: string | null;
    executedAt: string;
  }>;
};

export type PlaceMarketOrderInput = {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  stopLoss?: string;
  takeProfit?: string;
};

export type PositionBase = {
  id: string;
  symbol: string;
  quantity: string;
  averageEntryPrice: string;
  stopLoss: string | null;
  takeProfit: string | null;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpenPositionItem = PositionBase & {
  currentPrice: string | null;
  currentValue: string | null;
  investedValue: string;
  unrealizedPnl: string | null;
  pnlPercent: string | null;
};

export type ClosedPositionItem = PositionBase;

export type OpenPositionsResponse = {
  count: number;
  positions: OpenPositionItem[];
};

export type ClosedPositionsResponse = {
  count: number;
  positions: ClosedPositionItem[];
};

export type PositionTradeItem = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;
  realizedPnl: string | null;
  executedAt: string;
};

export type PositionDetailsResponse = PositionBase & {
  currentPrice: string | null;
  currentValue: string | null;
  investedValue: string;
  unrealizedPnl: string | null;
  pnlPercent: string | null;
  trades: PositionTradeItem[];
};

export type OrdersHistoryResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Array<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET';
    quantity: string;
    executionPrice: string | null;
    status: 'FILLED' | 'REJECTED';
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type TradesHistoryResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Array<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: string;
    price: string;
    realizedPnl: string | null;
    executedAt: string;
  }>;
};

export type TradingSummary = {
  totalTrades: number;
  totalBuyTrades: number;
  totalSellTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalRealizedPnl: string;
  winRate: string;
  averageWin: string;
  averageLoss: string;
};

export type AnalysisRunResult = {
  id: string;
  createdAt: string;
  symbol: string;
  interval: string;
  generatedAt: string;
  snapshot: Record<string, unknown>;
  analysis: {
    provider: 'gemini' | 'fallback';
    summary: string;
    bias: 'bullish' | 'bearish' | 'neutral';
    confidence: 'low' | 'medium' | 'high';
    keySignals: string[];
    risks: string[];
    actionPlan: string[];
    rawText?: string | null;
  };
};