export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface KlineEvent {
  wsSymbol: string;
  timeframe: string;
  candle: Candle;
}

export interface SubscriptionInfo {
  pair: string;
  wsSymbol: string;
  ccxtSymbol: string;
  timeframes: Set<string>;
  requiredCandles: Map<string, number>;
}

export interface ParsedIndicator {
  name: string;
  params: Record<string, number>;
}

/**
 * Convert rule pair format to Binance WS symbol.
 * 'BTC-USDT' -> 'btcusdt'
 */
export function pairToWsSymbol(pair: string): string {
  return pair.replace(/[-\/]/g, '').toLowerCase();
}

/**
 * Convert rule pair format to CCXT symbol.
 * 'BTC-USDT' -> 'BTC/USDT'
 */
export function pairToCcxtSymbol(pair: string): string {
  return pair.replace('-', '/');
}

/**
 * Build a Binance kline stream name.
 * ('btcusdt', '1m') -> 'btcusdt@kline_1m'
 */
export function buildKlineStreamName(
  wsSymbol: string,
  timeframe: string,
): string {
  return `${wsSymbol}@kline_${timeframe}`;
}
