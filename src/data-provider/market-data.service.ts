import { Injectable, Logger } from '@nestjs/common';
import { ExchangeService } from '../exchange/exchange.service';
import { Candle, pairToCcxtSymbol } from './data-provider.types';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  private readonly MAX_BUFFER_SIZE = 500;
  private readonly EXCHANGE_ID = 'binance';

  /** candle buffers keyed by 'wsSymbol:timeframe', e.g. 'btcusdt:1h' */
  private candleBuffers: Map<string, Candle[]> = new Map();

  /** latest tick price keyed by wsSymbol */
  private currentPrices: Map<string, number> = new Map();

  private marketsLoaded = false;

  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * Seed the candle buffer with historical data fetched via CCXT REST API.
   * Must be called before WebSocket streaming begins.
   */
  async seedHistoricalData(
    pair: string,
    wsSymbol: string,
    timeframe: string,
    limit: number,
  ): Promise<void> {
    const ccxtSymbol = pairToCcxtSymbol(pair);
    const key = `${wsSymbol}:${timeframe}`;

    try {
      await this.ensureMarketsLoaded();

      const exchange = this.exchangeService.getExchange(this.EXCHANGE_ID);
      const ohlcv = await exchange.fetchOHLCV(
        ccxtSymbol,
        timeframe,
        undefined,
        limit,
      );

      if (!ohlcv || ohlcv.length === 0) {
        this.logger.warn(`No historical data for ${ccxtSymbol} ${timeframe}`);
        return;
      }

      const candles: Candle[] = ohlcv.map((row) => ({
        timestamp: row[0],
        open: row[1],
        high: row[2],
        low: row[3],
        close: row[4],
        volume: row[5],
        isClosed: true,
      }));

      this.candleBuffers.set(key, candles);

      // Set initial price from the most recent candle
      const lastCandle = candles[candles.length - 1];
      this.currentPrices.set(wsSymbol, lastCandle.close);

      this.logger.log(
        `Seeded ${candles.length} candles for ${ccxtSymbol} ${timeframe}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to seed data for ${ccxtSymbol} ${timeframe}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update the candle buffer with a live kline event.
   * Handles both in-progress and closed candles.
   */
  updateCandle(wsSymbol: string, timeframe: string, candle: Candle): void {
    const key = `${wsSymbol}:${timeframe}`;

    if (!this.candleBuffers.has(key)) {
      this.candleBuffers.set(key, []);
    }

    const buffer = this.candleBuffers.get(key)!;

    if (buffer.length > 0) {
      const last = buffer[buffer.length - 1];
      if (last.timestamp === candle.timestamp) {
        buffer[buffer.length - 1] = candle;
      } else if (candle.timestamp > last.timestamp) {
        buffer.push(candle);
      }
    } else {
      buffer.push(candle);
    }

    // Trim buffer to max size
    while (buffer.length > this.MAX_BUFFER_SIZE) {
      buffer.shift();
    }

    this.currentPrices.set(wsSymbol, candle.close);
  }

  /**
   * Get closed candles for a symbol + timeframe.
   * Returns candles sorted oldest-first, optionally limited to the last N.
   */
  getClosedCandles(
    wsSymbol: string,
    timeframe: string,
    limit?: number,
  ): Candle[] {
    const key = `${wsSymbol}:${timeframe}`;
    const buffer = this.candleBuffers.get(key) || [];
    const closed = buffer.filter((c) => c.isClosed);
    if (limit && closed.length > limit) {
      return closed.slice(-limit);
    }
    return closed;
  }

  /**
   * Get the latest tick price for a symbol.
   */
  getCurrentPrice(wsSymbol: string): number | undefined {
    return this.currentPrices.get(wsSymbol);
  }

  /**
   * Check if we have any data buffered for a symbol + timeframe.
   */
  hasData(wsSymbol: string, timeframe: string): boolean {
    const key = `${wsSymbol}:${timeframe}`;
    return (this.candleBuffers.get(key)?.length ?? 0) > 0;
  }

  /**
   * Get buffer stats for debugging.
   */
  getBufferStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [key, buffer] of this.candleBuffers.entries()) {
      stats[key] = buffer.length;
    }
    return stats;
  }

  private async ensureMarketsLoaded(): Promise<void> {
    if (this.marketsLoaded) return;
    const exchange = this.exchangeService.getExchange(this.EXCHANGE_ID);
    await exchange.loadMarkets();
    this.marketsLoaded = true;
  }
}
