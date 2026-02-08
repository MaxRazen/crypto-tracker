import { Injectable, Logger } from '@nestjs/common';
import { ExchangeService } from '../../exchange/exchange.service';
import { Order } from 'ccxt';
import { FetchOrdersDto } from './dto/fetch-orders.dto';

export interface OrderPerformance {
  profitPercent: number;
  profit: number;
  anticipatedProfit: number;
  fees: number;
  totalOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  avgBuyPrice: number;
  avgSellPrice: number;
  volume: number;
}

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
  async fetchOrders({ pair, exchange, computePerformance, ...dto }: FetchOrdersDto): Promise<{ orders: Order[]; performance?: OrderPerformance }> {
    const exchangeId = exchange || 'binance';

    // Convert date strings to timestamps
    const since = dto.since ? new Date(dto.since).getTime() : undefined;
    const until = dto.until ? new Date(dto.until).getTime() : undefined;

    // Sanitize symbol if provided
    const symbol = pair ? this.sanitizeSymbol(pair) : undefined;

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

    return {
      orders,
      performance: computePerformance ? this.computePerformance(orders) : undefined,
    };
  }

  private computePerformance(orders: Order[]): OrderPerformance {
    let totalBuyVolume = 0;
    let totalBuyCost = 0;
    let totalSellVolume = 0;
    let totalSellCost = 0;

    let anticipatedBuyVolume = 0;
    let anticipatedBuyCost = 0;
    let anticipatedSellVolume = 0;
    let anticipatedSellCost = 0;

    let fees = 0;
    let activeOrders = 0;
    let cancelledOrders = 0;

    for (const order of orders) {
      // Active Orders
      const isActive = ['open', 'new'].includes(order.status);
      if (isActive) {
        activeOrders++;
      }

      // Cancelled Orders
      const isCancelled = ['expired', 'canceled'].includes(order.status);
      if (isCancelled) {
        cancelledOrders++;
        continue;
      }

      // Fees
      const orderAny = order as any;
      if (orderAny.fees && orderAny.fees.length > 0) {
        for (const f of orderAny.fees) {
          fees += f.cost || 0;
        }
      } else if (order.fee) {
        fees += order.fee.cost || 0;
      }

      const filled = order.filled || 0;
      const price = order.price || 0;
      const cost = order.cost || (filled * price);
      
      const remaining = order.remaining || (order.amount - filled);
      const anticipatedVal = remaining * price;

      if (order.side === 'buy') {
        totalBuyVolume += filled;
        totalBuyCost += cost;
        if (remaining > 0) {
          anticipatedBuyVolume += remaining;
          anticipatedBuyCost += anticipatedVal;
        }
      } else if (order.side === 'sell') {
        totalSellVolume += filled;
        totalSellCost += cost;
        if (remaining > 0) {
          anticipatedSellVolume += remaining;
          anticipatedSellCost += anticipatedVal;
        }
      }
    }

    const avgBuyPrice = totalBuyVolume > 0 ? totalBuyCost / totalBuyVolume : 0;
    const avgSellPrice = totalSellVolume > 0 ? totalSellCost / totalSellVolume : 0;

    // Realized Profit
    // Cost of goods sold = avgBuyPrice * totalSellVolume
    const costOfGoodsSold = avgBuyPrice * totalSellVolume;
    const profit = totalSellCost - costOfGoodsSold - fees;
    
    // Profit Percent (ROI on sold items)
    const profitPercent = costOfGoodsSold > 0 ? (profit / costOfGoodsSold) * 100 : 0;

    // Anticipated Profit
    // We assume all open orders are executed at their limit price
    const finalBuyVolume = totalBuyVolume + anticipatedBuyVolume;
    const finalBuyCost = totalBuyCost + anticipatedBuyCost;
    const finalAvgBuyPrice = finalBuyVolume > 0 ? finalBuyCost / finalBuyVolume : 0;

    const finalSellVolume = totalSellVolume + anticipatedSellVolume;
    const finalSellCost = totalSellCost + anticipatedSellCost;
    
    // Calculate anticipated profit based on final volumes
    // We use the final average buy price as the basis for the final sell volume
    const finalCostOfGoodsSold = finalAvgBuyPrice * finalSellVolume;
    const anticipatedProfit = finalSellCost - finalCostOfGoodsSold - fees;

    const volume = totalBuyVolume + totalSellVolume;

    return {
      profitPercent: Number(profitPercent.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      anticipatedProfit: Number(anticipatedProfit.toFixed(2)),
      fees: Number(fees.toFixed(8)),
      totalOrders: orders.length - cancelledOrders,
      cancelledOrders,
      activeOrders,
      avgBuyPrice: Number(avgBuyPrice.toFixed(8)),
      avgSellPrice: Number(avgSellPrice.toFixed(8)),
      volume: Number(volume.toFixed(8)),
    };
  }
}
