import { Injectable, Logger } from '@nestjs/common';
import { ExchangeService } from '../../exchange/exchange.service';
import { Order } from 'ccxt';

@Injectable()
export class ApiOrdersService {
  private readonly logger = new Logger(ApiOrdersService.name);

  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * Sanitize symbol format (CCXT uses standard format like BTC/USDT)
   */
  private sanitizeSymbol(pair: string): string {
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

  /**
   * Fetch orders with filters
   */
  async fetchOrders(
    exchangeId: string,
    pair?: string,
    since?: number,
    until?: number,
  ): Promise<Order[]> {
    // Sanitize symbol if provided
    const symbol = pair ? this.sanitizeSymbol(pair) : undefined;
    console.log('symbol', symbol);

    // Fetch orders from the exchange
    let orders: Order[] = [];
    try {
      orders = await this.exchangeService.getOrders(exchangeId, symbol, since);
    } catch (error) {
      this.logger.error(
        `Failed to fetch orders from ${exchangeId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    // Filter by until date if provided
    if (until) {
      orders = orders.filter((order) => {
        const orderTime = order.timestamp || order.datetime;
        if (!orderTime) return true; // Include if no timestamp
        const orderTimestamp =
          typeof orderTime === 'number'
            ? orderTime
            : new Date(orderTime).getTime();
        return orderTimestamp <= until;
      });
    }

    return orders;
  }
}
