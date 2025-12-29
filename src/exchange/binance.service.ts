import { Injectable, Inject, Logger } from '@nestjs/common';
import { Exchange } from 'ccxt';
import { BINANCE_EXCHANGE_PROVIDER } from './binance.provider';
import { ExchangeService } from './exchange.service';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  private readonly exchangeId = 'binance' as const;

  constructor(
    @Inject(BINANCE_EXCHANGE_PROVIDER) private readonly exchange: Exchange,
    private readonly exchangeService: ExchangeService,
  ) {}

  /**
   * Get ticker price for a symbol
   */
  async getTicker(symbol: string) {
    return await this.exchangeService.getTicker(this.exchangeId, symbol);
  }

  /**
   * Get ticker prices for multiple symbols
   */
  async getTickers(symbols?: string[]) {
    return await this.exchangeService.getTickers(this.exchangeId, symbols);
  }

  /**
   * Get account balance
   */
  async getBalance() {
    return await this.exchangeService.getBalance(this.exchangeId);
  }

  /**
   * Get account trades for a specific symbol
   */
  async getTrades(symbol: string, since?: number, limit?: number) {
    return await this.exchangeService.getTrades(
      this.exchangeId,
      symbol,
      since,
      limit,
    );
  }

  /**
   * Get all account trades
   */
  async getAllTrades(since?: number) {
    return await this.exchangeService.getAllTrades(this.exchangeId, since);
  }

  /**
   * Create a market order
   */
  async createMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    params?: Record<string, any>,
  ) {
    return await this.exchangeService.createMarketOrder(
      this.exchangeId,
      symbol,
      side,
      amount,
      params,
    );
  }

  /**
   * Create a limit order
   */
  async createLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number,
    params?: Record<string, any>,
  ) {
    return await this.exchangeService.createLimitOrder(
      this.exchangeId,
      symbol,
      side,
      amount,
      price,
      params,
    );
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    orderId: string,
    symbol: string,
    params?: Record<string, any>,
  ) {
    return await this.exchangeService.cancelOrder(
      this.exchangeId,
      orderId,
      symbol,
      params,
    );
  }

  /**
   * Get order by ID
   */
  async getOrder(
    orderId: string,
    symbol: string,
    params?: Record<string, any>,
  ) {
    return await this.exchangeService.getOrder(
      this.exchangeId,
      orderId,
      symbol,
      params,
    );
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string, since?: number, limit?: number) {
    return await this.exchangeService.getOpenOrders(
      this.exchangeId,
      symbol,
      since,
      limit,
    );
  }

  /**
   * Get all orders (open and closed)
   */
  async getOrders(symbol?: string, since?: number, limit?: number) {
    return await this.exchangeService.getOrders(
      this.exchangeId,
      symbol,
      since,
      limit,
    );
  }

  /**
   * Get order book
   */
  async getOrderBook(symbol: string, limit?: number) {
    return await this.exchangeService.getOrderBook(
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Sanitize symbol format (CCXT uses standard format like BTC/USDT)
   */
  sanitizeSymbol(pair: string): string {
    // Convert formats like BTCUSDT or BTC-USDT to BTC/USDT
    const upper = pair.toUpperCase().replace(/[-_]/g, '');
    // Try to detect base/quote (simplified - assumes common quote currencies)
    const quoteCurrencies = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'BUSD'];
    for (const quote of quoteCurrencies) {
      if (upper.endsWith(quote)) {
        const base = upper.slice(0, -quote.length);
        if (base.length > 0) {
          return `${base}/${quote}`;
        }
      }
    }
    // If no match, return as-is (CCXT might handle it)
    return upper.includes('/') ? upper : pair.toUpperCase();
  }
}
