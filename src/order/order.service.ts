import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Order, Quantity } from './order.types';
import { Cron, CronExpression } from '@nestjs/schedule';
import orderConfig from './order.config';
import modeConfig, { ModeConfig } from '../config/mode.config';
import { ConfigType } from '@nestjs/config';
import { OrderRepository } from './order.repository';
import { ExchangeService } from '../exchange/exchange.service';
import { PositionRepository } from './position.repository';
import { Order as CCXTOrder } from 'ccxt';
import { Subscription } from 'rxjs';
import { EventService } from '../event/event.service';
import { OrderActionEvent } from '../event/event.types';

@Injectable()
export class OrderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderService.name);
  private readonly DEFAULT_EXCHANGE_ID = 'binance';
  private eventSub: Subscription | null = null;

  private orders: Order[] = [];

  constructor(
    private orderRepository: OrderRepository,
    private exchangeService: ExchangeService,
    private positionRepository: PositionRepository,
    private eventService: EventService,

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

    this.eventSub = this.eventService.onOrderAction$.subscribe({
      next: (event) => {
        this.placeOrder(this.toOrder(event)).catch((err) =>
          this.logger.error(
            `Failed to place order for rule ${event.rule.uid}: ${err.message}`,
          ),
        );
      },
      error: (err) =>
        this.logger.error(`Order action event stream error: ${err.message}`),
    });
  }

  onModuleDestroy() {
    this.eventSub?.unsubscribe();
  }

  private toOrder(event: OrderActionEvent): Order {
    return {
      uid: `${event.rule.uid}-${event.action.type}-${event.timestamp}`,
      pair: event.rule.pair,
      price: event.action.context.price || String(event.price),
      side: event.action.type,
      type: event.action.context.type,
      quantity: event.action.context.quantity,
      actionId: `${event.rule.uid}-${event.action.type}`,
    };
  }

  async placeOrder(dto: Order) {
    if (!this.modeConfig.isLiveMode) {
      this.logger.log(
        `Order not placed (${this.modeConfig.isIdleMode ? 'idle' : 'plane'} mode): ${dto.side} ${dto.pair} @ ${dto.price}`,
      );
      return;
    }

    if (dto.actionId) {
      const existingOrder = await this.orderRepository.findActiveByActionId(
        dto.actionId,
      );
      if (existingOrder) {
        this.logger.warn(
          `Order with actionId ${dto.actionId} already exists, skipping duplicate`,
        );
        return;
      }
    }

    if (this.orders.some((o) => o.uid === dto.uid)) {
      this.logger.warn(`Order UID:${dto.uid} has been already placed`);
      return;
    }

    const order: Order = {
      ...dto,
      status: 'new',
      placedAt: Date.now(),
    };

    this.orders.push(order);
    await this.orderRepository.create(order);
    this.logger.log(
      `Order UID:${dto.uid} placed${dto.actionId ? ` with actionId: ${dto.actionId}` : ''}`,
    );

    // Submit immediately; cron acts as recovery for orders persisted but not yet submitted
    await this.submitOrder(order);
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'order-service',
    waitForCompletion: true,
  })
  async orderProcessor() {
    // Snapshot to avoid mutation issues when removing terminal orders mid-loop
    const snapshot = [...this.orders];

    this.logger.debug(
      `Process orders\n\t${snapshot.map((x) => x.pair).join('\n\t')}`,
    );

    for (const order of snapshot) {
      if (order.status === 'new') {
        // Recovery path: submit orders that survived a crash before submitOrder ran
        await this.submitOrder(order);
      } else if (order.status === 'pending') {
        await this.trackOrder(order);
      }

      if (
        order.status === 'completed' ||
        order.status === 'cancelled' ||
        order.status === 'failed'
      ) {
        this.orders = this.orders.filter((o) => o.uid !== order.uid);
      }
    }
  }

  private async submitOrder(order: Order) {
    try {
      this.logger.log(`Submitting order UID:${order.uid}`);

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

      let submittedOrder: CCXTOrder;

      if (order.type === 'market') {
        submittedOrder = await this.exchangeService.createMarketOrder(
          this.DEFAULT_EXCHANGE_ID,
          symbol,
          side,
          quantity,
        );
      } else {
        const price = parseFloat(order.price);
        submittedOrder = await this.exchangeService.createLimitOrder(
          this.DEFAULT_EXCHANGE_ID,
          symbol,
          side,
          quantity,
          price,
        );
      }

      this.logger.debug(
        `Submitted order uid=${order.uid} pair=${order.pair} status=${submittedOrder.status}`,
      );

      order.externalUid = submittedOrder.id?.toString();
      order.status = 'pending';
      order.submittedAt = Date.now();

      await this.orderRepository.update(order);
      this.logger.log(`Order UID:${order.uid} submitted to exchange`);
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

      this.logger.debug(
        `Track order uid=${order.uid} pair=${order.pair} status=${submittedOrder.status}`,
      );

      const isClosed =
        submittedOrder.status === 'closed' ||
        submittedOrder.status === 'filled';
      const isCancelled = ['canceled', 'rejected', 'expired'].includes(
        submittedOrder.status,
      );

      if (isClosed) {
        order.status = 'completed';
        order.completedAt = Date.now();
        order.filledQuantity = submittedOrder.filled;
        await this.handleOrderCompletion(order, submittedOrder);
        await this.orderRepository.update(order);
        this.logger.log(`Order UID:${order.uid} completed`);
      } else if (isCancelled) {
        order.status = 'cancelled';
        order.completedAt = Date.now();
        await this.orderRepository.update(order);
        this.logger.log(
          `Order UID:${order.uid} cancelled/rejected on exchange`,
        );
      } else if (
        submittedOrder.filled > 0 &&
        submittedOrder.filled !== (order.filledQuantity ?? 0)
      ) {
        // Partial fill: track progress but keep pending
        order.filledQuantity = submittedOrder.filled;
        await this.orderRepository.update(order);
        this.logger.log(
          `Order UID:${order.uid} partially filled: ${submittedOrder.filled}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to track order UID:${order.uid}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleOrderCompletion(
    order: Order,
    ccxtOrder: CCXTOrder,
  ): Promise<void> {
    try {
      if (order.side === 'buy') {
        const existingPosition = await this.positionRepository.findOpenPosition(
          order.pair,
        );

        const filledAmount = ccxtOrder.filled || 0;
        const averagePrice = ccxtOrder.average || parseFloat(order.price);

        if (existingPosition) {
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
        const openPosition = await this.positionRepository.findOpenPosition(
          order.pair,
        );

        if (openPosition && openPosition.side === 'buy') {
          const filledAmount = ccxtOrder.filled || 0;
          if (filledAmount <= 0) return;

          if (filledAmount >= openPosition.quantity) {
            await this.positionRepository.closePosition(order.pair, Date.now());
          } else {
            await this.positionRepository.updatePosition(order.pair, {
              quantity: openPosition.quantity - filledAmount,
            });
          }
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

    const balances = await this.exchangeService.getBalance(
      this.DEFAULT_EXCHANGE_ID,
    );

    const balanceInfo =
      order.side === 'buy' ? balances[quoteAsset] : balances[baseAsset];
    const balance = balanceInfo?.free || 0;

    if (balance <= 0) {
      return 0;
    }

    const availableBalance =
      order.side === 'buy' ? Math.min(balance, this.config.stake) : balance;

    const desiredQuantity = this.calculateDesiredQuantity(
      order.quantity,
      availableBalance,
      parseFloat(order.price),
      order.side,
    );

    try {
      const exchange = this.exchangeService.getExchange(
        this.DEFAULT_EXCHANGE_ID,
      );
      await exchange.loadMarkets();
      const market = exchange.markets[symbol];

      if (market) {
        const minQty = market.limits?.amount?.min || 0;
        const maxQty = market.limits?.amount?.max || Infinity;

        if (desiredQuantity < minQty || desiredQuantity > maxQty) {
          return 0;
        }

        return parseFloat(exchange.amountToPrecision(symbol, desiredQuantity));
      }
    } catch (error) {
      this.logger.warn(
        `Could not fetch market info for ${symbol}, using desired quantity: ${error.message}`,
      );
    }

    return desiredQuantity;
  }

  // Not private: pure function, tested directly
  calculateDesiredQuantity(
    quantity: Quantity,
    balance: number,
    price: number,
    side: 'buy' | 'sell',
  ): number {
    if (quantity.type !== 'percent') {
      return parseFloat(quantity.value);
    }
    const pct = parseFloat(quantity.value) / 100;
    if (side === 'buy') {
      // balance is quote currency; convert to base units via price
      return (balance / price) * pct;
    }
    // balance is base currency; sell a fraction directly
    return balance * pct;
  }

  private extractAssetsFromPair(pair: string): string[] {
    return pair.split('-');
  }

  // Not private: pure function, tested directly
  normalizeSymbol(pair: string): string {
    return pair.replace(/-/g, '/');
  }
}
