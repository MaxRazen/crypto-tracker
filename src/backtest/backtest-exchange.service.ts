import { Injectable, Logger } from '@nestjs/common';
import { Order, Balances } from 'ccxt';
import { HistoricalCandle } from './backtest.types';
import { randomUUID } from 'crypto';

interface VirtualBalance {
  [asset: string]: {
    free: number;
    used: number;
    total: number;
  };
}

interface VirtualOrder extends Order {
  filled: number;
  remaining: number;
  cost: number;
  average?: number;
}

@Injectable()
export class BacktestExchangeService {
  private readonly logger = new Logger(BacktestExchangeService.name);
  private balances: VirtualBalance = {};
  private orders: Map<string, VirtualOrder> = new Map();
  private orderCounter = 1;
  private currentTimestamp: number = 0;
  private currentPrices: Map<string, number> = new Map();

  /**
   * Initialize virtual balance
   */
  initializeBalance(quoteCurrency: string, startBalance: number): void {
    this.balances = {
      [quoteCurrency]: {
        free: startBalance,
        used: 0,
        total: startBalance,
      },
    };
    this.orders.clear();
    this.orderCounter = 1;
    this.logger.log(
      `Initialized virtual balance: ${startBalance} ${quoteCurrency}`,
    );
  }

  /**
   * Set current timestamp and prices for simulation
   */
  setCurrentState(timestamp: number, prices: Map<string, number>): void {
    this.currentTimestamp = timestamp;
    this.currentPrices = prices;
  }

  /**
   * Get virtual balance
   */
  getBalance(): Balances {
    return this.balances as Balances;
  }

  /**
   * Create a market order (executes immediately at current price)
   */
  async createMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
  ): Promise<VirtualOrder> {
    const price = this.currentPrices.get(symbol);
    if (!price) {
      throw new Error(`No price available for ${symbol}`);
    }

    const [baseAsset, quoteAsset] = symbol.split('/');
    const cost = side === 'buy' ? amount * price : 0;
    const received = side === 'sell' ? amount : amount;

    // Check balance
    if (side === 'buy') {
      const quoteBalance = this.balances[quoteAsset]?.free || 0;
      if (cost > quoteBalance) {
        throw new Error(
          `Insufficient balance: need ${cost} ${quoteAsset}, have ${quoteBalance}`,
        );
      }
    } else {
      const baseBalance = this.balances[baseAsset]?.free || 0;
      if (amount > baseBalance) {
        throw new Error(
          `Insufficient balance: need ${amount} ${baseAsset}, have ${baseBalance}`,
        );
      }
    }

    // Execute order immediately (market orders fill instantly in backtest)
    const orderId = (this.orderCounter++).toString();
    const order: VirtualOrder = {
      id: orderId,
      clientOrderId: randomUUID(),
      datetime: new Date(this.currentTimestamp).toISOString(),
      timestamp: this.currentTimestamp,
      status: 'closed',
      symbol,
      type: 'market',
      timeInForce: 'IOC',
      side: side,
      amount: amount,
      price: price,
      filled: amount,
      remaining: 0,
      cost: cost,
      average: price,
      lastTradeTimestamp: this.currentTimestamp,
      reduceOnly: false,
      postOnly: false,
      fee: {
        currency: side === 'buy' ? baseAsset : quoteAsset,
        cost: cost * 0.001, // 0.1% fee (typical exchange fee)
      },
      trades: [],
      info: {},
    };

    // Update balances
    if (side === 'buy') {
      // Deduct quote currency, add base currency
      if (!this.balances[quoteAsset]) {
        this.balances[quoteAsset] = { free: 0, used: 0, total: 0 };
      }
      if (!this.balances[baseAsset]) {
        this.balances[baseAsset] = { free: 0, used: 0, total: 0 };
      }

      this.balances[quoteAsset].free -= cost;
      this.balances[quoteAsset].total -= cost;
      this.balances[baseAsset].free += amount;
      this.balances[baseAsset].total += amount;
    } else {
      // Deduct base currency, add quote currency
      const receivedQuote = amount * price;
      this.balances[baseAsset].free -= amount;
      this.balances[baseAsset].total -= amount;
      if (!this.balances[quoteAsset]) {
        this.balances[quoteAsset] = { free: 0, used: 0, total: 0 };
      }
      this.balances[quoteAsset].free += receivedQuote;
      this.balances[quoteAsset].total += receivedQuote;
    }

    this.orders.set(orderId, order);
    this.logger.debug(
      `Executed ${side} order: ${amount} ${symbol} at ${price}`,
    );

    return order;
  }

  /**
   * Create a limit order (executes if price is favorable)
   */
  async createLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number,
  ): Promise<VirtualOrder> {
    const currentPrice = this.currentPrices.get(symbol);
    if (!currentPrice) {
      throw new Error(`No price available for ${symbol}`);
    }

    const [baseAsset, quoteAsset] = symbol.split('/');

    // Check if limit order can execute
    let canExecute = false;
    if (side === 'buy' && currentPrice <= price) {
      canExecute = true;
    } else if (side === 'sell' && currentPrice >= price) {
      canExecute = true;
    }

    // Check balance
    if (side === 'buy') {
      const quoteBalance = this.balances[quoteAsset]?.free || 0;
      const cost = amount * price;
      if (cost > quoteBalance) {
        throw new Error(
          `Insufficient balance: need ${cost} ${quoteAsset}, have ${quoteBalance}`,
        );
      }
    } else {
      const baseBalance = this.balances[baseAsset]?.free || 0;
      if (amount > baseBalance) {
        throw new Error(
          `Insufficient balance: need ${amount} ${baseAsset}, have ${baseBalance}`,
        );
      }
    }

    const orderId = (this.orderCounter++).toString();

    if (canExecute) {
      // Execute at limit price
      const executionPrice = price;
      const cost = side === 'buy' ? amount * executionPrice : 0;

      const order: VirtualOrder = {
        id: orderId,
        clientOrderId: randomUUID(),
        datetime: new Date(this.currentTimestamp).toISOString(),
        timestamp: this.currentTimestamp,
        status: 'closed',
        symbol,
        type: 'limit',
        timeInForce: 'GTC',
        side: side,
        amount: amount,
        price: executionPrice,
        filled: amount,
        remaining: 0,
        cost: cost,
        average: executionPrice,
        lastTradeTimestamp: this.currentTimestamp,
        reduceOnly: false,
        postOnly: false,
        fee: {
          currency: side === 'buy' ? baseAsset : quoteAsset,
          cost: cost * 0.001,
        },
        trades: [],
        info: {},
      };

      // Update balances (same as market order)
      if (side === 'buy') {
        if (!this.balances[quoteAsset]) {
          this.balances[quoteAsset] = { free: 0, used: 0, total: 0 };
        }
        if (!this.balances[baseAsset]) {
          this.balances[baseAsset] = { free: 0, used: 0, total: 0 };
        }
        this.balances[quoteAsset].free -= cost;
        this.balances[quoteAsset].total -= cost;
        this.balances[baseAsset].free += amount;
        this.balances[baseAsset].total += amount;
      } else {
        const receivedQuote = amount * executionPrice;
        this.balances[baseAsset].free -= amount;
        this.balances[baseAsset].total -= amount;
        if (!this.balances[quoteAsset]) {
          this.balances[quoteAsset] = { free: 0, used: 0, total: 0 };
        }
        this.balances[quoteAsset].free += receivedQuote;
        this.balances[quoteAsset].total += receivedQuote;
      }

      this.orders.set(orderId, order);
      return order;
    } else {
      // Order remains open (pending)
      const order: VirtualOrder = {
        id: orderId,
        clientOrderId: randomUUID(),
        datetime: new Date(this.currentTimestamp).toISOString(),
        timestamp: this.currentTimestamp,
        status: 'open',
        symbol,
        type: 'limit',
        timeInForce: 'GTC',
        side: side,
        amount: amount,
        price: price,
        filled: 0,
        remaining: amount,
        cost: 0,
        lastTradeTimestamp: undefined,
        reduceOnly: false,
        postOnly: false,
        fee: {
          currency: side === 'buy' ? quoteAsset : baseAsset,
          cost: 0,
        },
        trades: [],
        info: {},
      };

      // Lock balance
      if (side === 'buy') {
        const cost = amount * price;
        if (!this.balances[quoteAsset]) {
          this.balances[quoteAsset] = { free: 0, used: 0, total: 0 };
        }
        this.balances[quoteAsset].free -= cost;
        this.balances[quoteAsset].used += cost;
      } else {
        if (!this.balances[baseAsset]) {
          this.balances[baseAsset] = { free: 0, used: 0, total: 0 };
        }
        this.balances[baseAsset].free -= amount;
        this.balances[baseAsset].used += amount;
      }

      this.orders.set(orderId, order);
      return order;
    }
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): VirtualOrder | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Get all orders
   */
  getAllOrders(): VirtualOrder[] {
    return Array.from(this.orders.values());
  }

  /**
   * Reset state (for new backtest)
   */
  reset(): void {
    this.balances = {};
    this.orders.clear();
    this.orderCounter = 1;
    this.currentTimestamp = 0;
    this.currentPrices.clear();
  }
}
