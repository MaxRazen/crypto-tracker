import { Injectable, Logger } from '@nestjs/common';
import { Exchange, Ticker, Order, Trade, Balances } from 'ccxt';

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);
  private exchanges: Map<string, Exchange> = new Map();

  /**
   * Register an exchange instance
   */
  registerExchange(exchangeId: string, exchange: Exchange): void {
    this.exchanges.set(exchangeId, exchange);
    this.logger.log(`Registered exchange: ${exchangeId}`);
  }

  /**
   * Get an exchange instance by ID
   */
  getExchange(exchangeId: string): Exchange {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeId} not found`);
    }
    return exchange;
  }

  /**
   * Get ticker price for a symbol
   */
  async getTicker(exchangeId: string, symbol: string): Promise<Ticker> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchTicker(symbol);
  }

  /**
   * Get ticker prices for multiple symbols
   */
  async getTickers(
    exchangeId: string,
    symbols?: string[],
  ): Promise<Record<string, Ticker>> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchTickers(symbols);
  }

  /**
   * Get account balance
   */
  async getBalance(exchangeId: string): Promise<Balances> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchBalance();
  }

  /**
   * Get account trades
   */
  async getTrades(
    exchangeId: string,
    symbol: string,
    since?: number,
    limit?: number,
  ): Promise<Trade[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchMyTrades(symbol, since, limit);
  }

  /**
   * Get all account trades (across all symbols)
   */
  async getAllTrades(exchangeId: string, since?: number): Promise<Trade[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchMyTrades(undefined, since);
  }

  /**
   * Create a market order
   */
  async createMarketOrder(
    exchangeId: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    params?: Record<string, any>,
  ): Promise<Order> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.createMarketOrder(
      symbol,
      side,
      amount,
      undefined,
      params,
    );
  }

  /**
   * Create a limit order
   */
  async createLimitOrder(
    exchangeId: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number,
    params?: Record<string, any>,
  ): Promise<Order> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.createLimitOrder(symbol, side, amount, price, params);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    exchangeId: string,
    orderId: string,
    symbol: string,
    params?: Record<string, any>,
  ): Promise<Order> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.cancelOrder(orderId, symbol, params);
  }

  /**
   * Get order by ID
   */
  async getOrder(
    exchangeId: string,
    orderId: string,
    symbol: string,
    params?: Record<string, any>,
  ): Promise<Order> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchOrder(orderId, symbol, params);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(
    exchangeId: string,
    symbol?: string,
    since?: number,
    limit?: number,
  ): Promise<Order[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchOpenOrders(symbol, since, limit);
  }

  /**
   * Get all orders (open and closed) for a symbol
   */
  async getOrders(
    exchangeId: string,
    symbol?: string,
    since?: number,
    limit?: number,
  ): Promise<Order[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchOrders(symbol, since, limit);
  }

  /**
   * Get order book
   */
  async getOrderBook(
    exchangeId: string,
    symbol: string,
    limit?: number,
  ): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchOrderBook(symbol, limit);
  }
}
