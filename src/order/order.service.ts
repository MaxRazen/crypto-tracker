import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Order, Quantity } from './order.types';
import { Cron, CronExpression } from '@nestjs/schedule';
import orderConfig from './order.config';
import modeConfig, { ModeConfig } from '../config/mode.config';
import { ConfigType } from '@nestjs/config';
import { OrderRepository } from './order.repository';
import { ExchangeService } from '../exchange/exchange.service';
import { PositionRepository } from './position.repository';
import { Order as CCXTOrder } from 'ccxt';

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);
  private readonly DEFAULT_EXCHANGE_ID = 'binance';
  private readonly TRACKING_INTERVAL_MS = 120000; // 2 minutes instead of 30 seconds
  private lastTrackingTime: Map<string, number> = new Map();

  private orders: Order[] = [];

  constructor(
    private orderRepository: OrderRepository,
    private exchangeService: ExchangeService,
    private positionRepository: PositionRepository,

    @Inject(orderConfig.KEY)
    private config: ConfigType<typeof orderConfig>,
    @Inject(modeConfig.KEY)
    private modeConfig: ModeConfig,
  ) {}

  async onModuleInit() {
    this.orders = await this.orderRepository.findActive();
    this.logger.log(
      `Order service initialized with ${this.orders.length} active orders`,
    );
  }

  async placeOrder(dto: Order) {
    if (!this.modeConfig.isLiveMode) {
      this.logger.log(
        `Order not placed (${this.modeConfig.isIdleMode ? 'idle' : 'plane'} mode): ${dto.side} ${dto.pair} @ ${dto.price}`,
      );
      return;
    }

    // Check idempotency: if actionId exists, check if order with same actionId already exists
    if (dto.actionId) {
      const existingOrder = await this.orderRepository.findByActionId(
        dto.actionId,
      );
      if (existingOrder) {
        this.logger.warn(
          `Order with actionId ${dto.actionId} already exists, skipping duplicate`,
        );
        return;
      }
    }

    // Also check by UID (backward compatibility)
    if (this.orders.some((o) => o.uid === dto.uid)) {
      this.logger.warn(`Order UID:${dto.uid} has been already placed`);
      return;
    }

    this.orders.push({
      ...dto,
      status: 'new',
      placedAt: new Date().getTime(),
    });

    await this.orderRepository.create(this.orders[this.orders.length - 1]);

    this.logger.log(
      `Order UID:${dto.uid} placed${dto.actionId ? ` with actionId: ${dto.actionId}` : ''}`,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'order-service',
    waitForCompletion: true,
  })
  async orderProcessor() {
    const now = Date.now();

    for (const order of this.orders) {
      if (order.status === 'new') {
        await this.submitOrder(order);
      } else if (order.status === 'pending') {
        // Optimize tracking: only check if enough time has passed
        const lastCheck = this.lastTrackingTime.get(order.uid) || 0;
        if (now - lastCheck >= this.TRACKING_INTERVAL_MS) {
          await this.trackOrder(order);
          this.lastTrackingTime.set(order.uid, now);
        }
      }

      // Remove completed/cancelled orders from memory
      if (
        order.status === 'completed' ||
        order.status === 'cancelled' ||
        order.status === 'failed'
      ) {
        this.orders = this.orders.filter((o) => o.uid !== order.uid);
        this.lastTrackingTime.delete(order.uid);
      }
    }
  }

  private async submitOrder(order: Order) {
    try {
      this.logger.log(`Submitting order UID:${order.uid}`);

      // Calculate available quantity based on balance
      const quantity = await this.calculateQuantity(order);

      if (quantity <= 0) {
        order.status = 'failed';
        order.errorMessage = 'Insufficient balance';
        await this.orderRepository.update(order);
        this.logger.error(
          `Order UID:${order.uid} failed: Insufficient balance`,
        );
        return;
      }

      const symbol = this.normalizeSymbol(order.pair);
      const side = order.side;
      const amount = quantity;

      let submittedOrder: CCXTOrder;

      // Submit order using CCXT ExchangeService
      if (order.type === 'market') {
        submittedOrder = await this.exchangeService.createMarketOrder(
          this.DEFAULT_EXCHANGE_ID,
          symbol,
          side,
          amount,
        );
      } else {
        const price = parseFloat(order.price);
        submittedOrder = await this.exchangeService.createLimitOrder(
          this.DEFAULT_EXCHANGE_ID,
          symbol,
          side,
          amount,
          price,
        );
      }

      this.logger.debug('Submitted order', submittedOrder);

      // Update order with exchange response
      order.externalUid = submittedOrder.id?.toString();
      order.status = 'pending';
      order.submittedAt = new Date().getTime();

      await this.orderRepository.update(order);

      this.logger.log(
        `Order UID:${order.uid} submitted to exchange`,
        submittedOrder,
      );
    } catch (error) {
      order.status = 'failed';
      order.errorMessage = error.message;
      await this.orderRepository.update(order);
      this.logger.error(
        `Failed to submit order UID:${order.uid}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async trackOrder(order: Order) {
    if (!order.externalUid) {
      return;
    }

    try {
      const symbol = this.normalizeSymbol(order.pair);
      const submittedOrder = await this.exchangeService.getOrder(
        this.DEFAULT_EXCHANGE_ID,
        order.externalUid,
        symbol,
      );

      this.logger.debug(`Track order UID:${order.uid}`, submittedOrder);

      // Update order based on exchange status
      if (submittedOrder.status === 'closed' || submittedOrder.filled > 0) {
        // Order is filled or closed
        order.status = 'completed';

        // Manage positions
        await this.handleOrderCompletion(order, submittedOrder);

        await this.orderRepository.update(order);
        this.logger.log(`Order UID:${order.uid} completed`, submittedOrder);
      } else if (
        submittedOrder.status === 'canceled' ||
        submittedOrder.status === 'rejected' ||
        submittedOrder.status === 'expired'
      ) {
        order.status = 'cancelled';
        await this.orderRepository.update(order);
        this.logger.log(
          `Order UID:${order.uid} cancelled/rejected on exchange`,
          submittedOrder,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to track order UID:${order.uid}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle position management when order completes
   */
  private async handleOrderCompletion(
    order: Order,
    ccxtOrder: CCXTOrder,
  ): Promise<void> {
    try {
      if (order.side === 'buy') {
        // Create or update buy position
        const existingPosition = await this.positionRepository.findOpenPosition(
          order.pair,
        );

        const filledAmount = ccxtOrder.filled || 0;
        const averagePrice = ccxtOrder.average || parseFloat(order.price);

        if (existingPosition) {
          // Update existing position (average price calculation)
          const totalQuantity = existingPosition.quantity + filledAmount;
          const totalValue =
            existingPosition.quantity * existingPosition.averagePrice +
            filledAmount * averagePrice;
          const newAveragePrice = totalValue / totalQuantity;

          await this.positionRepository.updatePosition(order.pair, {
            quantity: totalQuantity,
            averagePrice: newAveragePrice,
          });
        } else {
          // Create new position
          await this.positionRepository.create({
            pair: order.pair,
            side: 'buy',
            quantity: filledAmount,
            averagePrice: averagePrice,
            orderUid: order.uid,
            actionId: order.actionId,
            openedAt: order.submittedAt || Date.now(),
            isOpen: true,
          });
        }
      } else if (order.side === 'sell') {
        // Close buy position
        const openPosition = await this.positionRepository.findOpenPosition(
          order.pair,
        );

        if (openPosition && openPosition.side === 'buy') {
          await this.positionRepository.closePosition(order.pair, Date.now());
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle position for order UID:${order.uid}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async calculateQuantity(order: Order): Promise<number> {
    const symbol = this.normalizeSymbol(order.pair);
    const [baseAsset, quoteAsset] = this.extractAssetsFromPair(order.pair);

    // Get balance using CCXT
    const balances = await this.exchangeService.getBalance(
      this.DEFAULT_EXCHANGE_ID,
    );

    // CCXT balance structure: balances[asset] = { free, used, total }
    const balanceInfo =
      order.side === 'buy' ? balances[quoteAsset] : balances[baseAsset];

    const balance = balanceInfo?.free || 0;

    if (balance <= 0) {
      return 0;
    }

    let availableBalance: number;

    if (order.side === 'buy') {
      availableBalance = Math.min(balance, this.config.stake);
    } else {
      // For sell: use 100% of balance to handle dust
      // Check if quantity is "100%" or similar
      if (
        order.quantity.type === 'percent' &&
        parseFloat(order.quantity.value) >= 99
      ) {
        availableBalance = balance; // Sell all available
      } else {
        availableBalance = balance;
      }
    }

    const desiredQuantity = this.calculateDesiredQuantity(
      order.quantity,
      availableBalance,
      parseFloat(order.price),
    );

    // Get market info for lot size validation
    try {
      const exchange = this.exchangeService.getExchange(
        this.DEFAULT_EXCHANGE_ID,
      );
      await exchange.loadMarkets();
      const market = exchange.markets[symbol];

      if (market) {
        const minQty = market.limits?.amount?.min || 0;
        const maxQty = market.limits?.amount?.max || Infinity;
        const precision = market.precision?.amount || 8;

        if (desiredQuantity < minQty || desiredQuantity > maxQty) {
          return 0;
        }

        // Round to precision
        return (
          Math.floor(desiredQuantity * Math.pow(10, precision)) /
          Math.pow(10, precision)
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not fetch market info for ${symbol}, using desired quantity: ${error.message}`,
      );
    }

    return desiredQuantity;
  }

  private calculateDesiredQuantity(
    quantity: Quantity,
    balance: number,
    price: number,
  ): number {
    if (quantity.type !== 'percent') {
      return parseFloat(quantity.value);
    }
    return ((balance / price) * parseFloat(quantity.value)) / 100;
  }

  private extractAssetsFromPair(pair: string): string[] {
    return pair.split('-');
  }

  /**
   * Normalize symbol format (e.g., BTC-USDT -> BTC/USDT for CCXT)
   */
  private normalizeSymbol(pair: string): string {
    return pair.replace('-', '/');
  }
}
