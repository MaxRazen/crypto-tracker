import { Injectable, Logger } from '@nestjs/common';
import { ExchangeService } from '../exchange/exchange.service';
import { HistoricalCandle } from './backtest.types';

@Injectable()
export class HistoricalDataService {
  private readonly logger = new Logger(HistoricalDataService.name);
  private candleCache: Map<string, HistoricalCandle[]> = new Map();

  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * Load historical OHLCV data for a symbol
   * Uses CCXT's fetchOHLCV method
   */
  async loadHistoricalData(
    exchangeId: string,
    symbol: string,
    timeframe: string,
    since: number,
    until: number,
  ): Promise<HistoricalCandle[]> {
    const cacheKey = `${exchangeId}:${symbol}:${timeframe}:${since}:${until}`;

    // Check cache first
    if (this.candleCache.has(cacheKey)) {
      this.logger.debug(`Using cached data for ${symbol}`);
      return this.candleCache.get(cacheKey)!;
    }

    try {
      const exchange = this.exchangeService.getExchange(exchangeId);
      await exchange.loadMarkets();

      const candles: HistoricalCandle[] = [];
      let currentSince = since;
      const limit = 1000; // CCXT default limit

      // Fetch candles in batches (CCXT has limits)
      while (currentSince < until) {
        const ohlcv = await exchange.fetchOHLCV(
          symbol,
          timeframe,
          currentSince,
          limit,
        );

        if (!ohlcv || ohlcv.length === 0) {
          break;
        }

        // Convert CCXT OHLCV format to our format
        // CCXT format: [timestamp, open, high, low, close, volume]
        for (const candle of ohlcv) {
          if (candle[0] > until) {
            break;
          }

          candles.push({
            timestamp: candle[0],
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
            volume: candle[5],
          });

          currentSince = candle[0] + 1;
        }

        // If we got fewer candles than limit, we've reached the end
        if (ohlcv.length < limit) {
          break;
        }

        // Move to next batch
        currentSince = ohlcv[ohlcv.length - 1][0] + 1;
      }

      this.logger.log(
        `Loaded ${candles.length} candles for ${symbol} from ${new Date(since).toISOString()} to ${new Date(until).toISOString()}`,
      );

      // Cache the data
      this.candleCache.set(cacheKey, candles);

      return candles;
    } catch (error) {
      this.logger.error(
        `Failed to load historical data for ${symbol}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get price at a specific timestamp (interpolated from candles)
   */
  getPriceAtTimestamp(
    candles: HistoricalCandle[],
    timestamp: number,
  ): number | null {
    if (candles.length === 0) {
      return null;
    }

    // Find the candle that contains this timestamp
    for (const candle of candles) {
      if (candle.timestamp <= timestamp) {
        // Use close price (most representative)
        return candle.close;
      }
    }

    // If timestamp is before first candle, return first candle's open
    if (timestamp < candles[0].timestamp) {
      return candles[0].open;
    }

    // If timestamp is after last candle, return last candle's close
    return candles[candles.length - 1].close;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.candleCache.clear();
  }
}
