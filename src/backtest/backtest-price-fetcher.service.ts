import { Injectable, Logger } from '@nestjs/common';
import { PriceData } from '../tracker/price-fetcher.service';
import { HistoricalCandle } from './backtest.types';

@Injectable()
export class BacktestPriceFetcherService {
  private readonly logger = new Logger(BacktestPriceFetcherService.name);
  private candlesBySymbol: Map<string, HistoricalCandle[]> = new Map();
  private currentTimestamp: number = 0;

  /**
   * Load historical candles for symbols
   */
  loadCandles(symbol: string, candles: HistoricalCandle[]): void {
    this.candlesBySymbol.set(symbol, candles);
    this.logger.debug(`Loaded ${candles.length} candles for ${symbol}`);
  }

  /**
   * Set current simulation timestamp
   */
  setCurrentTimestamp(timestamp: number): void {
    this.currentTimestamp = timestamp;
  }

  /**
   * Get prices for symbols at current timestamp
   */
  async fetchPrices(
    exchangeId: string,
    symbols: string[],
  ): Promise<Map<string, PriceData>> {
    const result = new Map<string, PriceData>();

    for (const symbol of symbols) {
      const candles = this.candlesBySymbol.get(symbol);
      if (!candles || candles.length === 0) {
        this.logger.warn(`No candles loaded for ${symbol}`);
        continue;
      }

      // Find the candle that contains or is closest to current timestamp
      let price: number | null = null;

      for (let i = 0; i < candles.length; i++) {
        const candle = candles[i];
        const nextCandle = candles[i + 1];

        if (candle.timestamp <= this.currentTimestamp) {
          if (!nextCandle || nextCandle.timestamp > this.currentTimestamp) {
            // This candle contains the current timestamp
            price = candle.close;
            break;
          }
        }
      }

      // If timestamp is before first candle, use first candle's open
      if (price === null && candles[0].timestamp > this.currentTimestamp) {
        price = candles[0].open;
      }

      // If timestamp is after last candle, use last candle's close
      if (price === null) {
        price = candles[candles.length - 1].close;
      }

      if (price !== null) {
        result.set(symbol, {
          symbol,
          price,
          timestamp: this.currentTimestamp,
        });
      }
    }

    return result;
  }

  /**
   * Get a single price
   */
  async getPrice(
    exchangeId: string,
    symbol: string,
  ): Promise<PriceData | null> {
    const prices = await this.fetchPrices(exchangeId, [symbol]);
    return prices.get(symbol) || null;
  }

  /**
   * Clear loaded candles
   */
  clearCandles(): void {
    this.candlesBySymbol.clear();
  }
}
