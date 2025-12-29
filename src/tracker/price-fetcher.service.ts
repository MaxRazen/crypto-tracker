import { Injectable, Logger } from '@nestjs/common';
import { ExchangeService } from '../exchange/exchange.service';
import { Ticker } from 'ccxt';

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

@Injectable()
export class PriceFetcherService {
  private readonly logger = new Logger(PriceFetcherService.name);
  private priceCache: Map<string, PriceData> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * Fetch prices for multiple symbols and cache them
   * This decouples data fetching from rule evaluation logic
   */
  async fetchPrices(
    exchangeId: string,
    symbols: string[],
  ): Promise<Map<string, PriceData>> {
    const now = Date.now();
    const uncachedSymbols: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const cached = this.priceCache.get(symbol);
      if (!cached || now - cached.timestamp > this.CACHE_TTL) {
        uncachedSymbols.push(symbol);
      }
    }

    // Fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      try {
        const tickers = await this.exchangeService.getTickers(
          exchangeId,
          uncachedSymbols,
        );

        // Update cache
        for (const [symbol, ticker] of Object.entries(tickers)) {
          const priceData: PriceData = {
            symbol,
            price: ticker.last || ticker.close || 0,
            timestamp: now,
          };
          this.priceCache.set(symbol, priceData);
        }

        this.logger.debug(
          `Fetched prices for ${uncachedSymbols.length} symbols`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to fetch prices: ${error.message}`,
          error.stack,
        );
        // Return cached data even if stale
      }
    }

    // Return all requested symbols from cache
    const result = new Map<string, PriceData>();
    for (const symbol of symbols) {
      const cached = this.priceCache.get(symbol);
      if (cached) {
        result.set(symbol, cached);
      }
    }

    return result;
  }

  /**
   * Get a single price from cache or fetch if needed
   */
  async getPrice(
    exchangeId: string,
    symbol: string,
  ): Promise<PriceData | null> {
    const prices = await this.fetchPrices(exchangeId, [symbol]);
    return prices.get(symbol) || null;
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; symbols: string[] } {
    return {
      size: this.priceCache.size,
      symbols: Array.from(this.priceCache.keys()),
    };
  }
}
