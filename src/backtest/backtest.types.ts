export interface BacktestOptions {
  startDate: Date;
  endDate: Date;
  interval: string; // CCXT timeframe: '1m', '5m', '1h', '1d', etc.
  startBalance: number;
  quoteCurrency: string;
  exchangeId?: string;
  rules?: string[]; // Rule UIDs to test (if empty, tests all active rules)
}

export interface BacktestResult {
  startDate: Date;
  endDate: Date;
  startBalance: number;
  endBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  trades: BacktestTrade[];
  positions: BacktestPosition[];
  equityCurve: EquityPoint[];
}

export interface BacktestTrade {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPercent: number;
  ruleUid?: string;
}

export interface BacktestPosition {
  pair: string;
  side: 'buy' | 'sell';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openedAt: number;
}

export interface EquityPoint {
  timestamp: number;
  balance: number;
  equity: number; // balance + unrealized PnL
}

export interface HistoricalCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
