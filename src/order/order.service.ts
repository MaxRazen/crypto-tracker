import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BinanceService } from '../binance/binance.service';
import { Order, Quantity } from './order.types';
import { Cron, CronExpression } from '@nestjs/schedule';
import orderConfig from './order.config';
import { ConfigType } from '@nestjs/config';
import { BinanceOrderRequest } from '../binance/binance.types';
import { SpotRestAPI } from '@binance/spot';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);

  private orders: Order[] = [];

  constructor(
    private orderRepository: OrderRepository,
    private binanceService: BinanceService,

    @Inject(orderConfig.KEY)
    private config: ConfigType<typeof orderConfig>,
  ) {}

  onModuleInit() {
    this.orders = this.orderRepository.findActive();
    this.logger.debug(
      `Order service initialized with saved active orders`,
      this.orders,
    );
  }

  async placeOrder(dto: Order) {
    if (this.orders.some((o) => o.uid === dto.uid)) {
      this.logger.warn(`Order UID:${dto.uid} has been already placed`);
      return;
    }

    this.orders.push({
      ...dto,
      status: 'new',
      placedAt: new Date().getTime(),
    });

    this.orderRepository.create(this.orders[this.orders.length - 1]);

    this.logger.log(`Order UID:${dto.uid} placed`);
  }

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'order-service',
    waitForCompletion: true,
  })
  async orderProcessor() {
    for (const order of this.orders) {
      if (order.status === 'new') {
        await this.submitOrder(order);
      } else if (order.status === 'pending') {
        await this.trackOrder(order);
        this.orders = this.orders.filter(
          (o) => o.status !== 'cancelled' && o.status !== 'completed',
        );
      }
      // Note: deadline cancellation logic can be added here
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
        this.logger.error(
          `Order UID:${order.uid} failed: Insufficient balance`,
        );
        return;
      }

      // Submit order to Binance
      const submitOrderDto: BinanceOrderRequest = {
        uid: order.uid,
        symbol: this.binanceService.sanitizeSymbol(order.pair),
        side: order.side === 'buy' ? 'BUY' : 'SELL',
        type: order.type === 'limit' ? 'LIMIT' : 'MARKET',
        quantity: quantity,
        price: parseFloat(order.price),
      };

      this.logger.debug('Order to be submitted', submitOrderDto);

      const submittedOrder =
        await this.binanceService.createOrder(submitOrderDto);

      this.logger.debug('Submitted order', submittedOrder);

      // Update order with Binance response
      order.externalUid = submittedOrder.orderId;
      order.status = 'pending';
      order.submittedAt = new Date().getTime();

      this.orderRepository.update(order);

      this.logger.log(
        `Order UID:${order.uid} submitted to Binance`,
        submittedOrder,
      );
    } catch (error) {
      order.status = 'failed';
      order.errorMessage = error.message;
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
      const symbol = this.binanceService.sanitizeSymbol(order.pair);
      const submittedOrder = await this.binanceService.getOrder(
        symbol,
        order.externalUid,
      );

      this.logger.debug(`Track order UID:${order.uid}`, submittedOrder);

      // Update order based on Binance status
      if (submittedOrder.status === 'FILLED') {
        order.status = 'completed';
        this.logger.log(`Order UID:${order.uid} completed`, submittedOrder);
        this.orderRepository.update(order);
      } else if (
        submittedOrder.status === 'CANCELED' ||
        submittedOrder.status === 'REJECTED' ||
        submittedOrder.status === 'EXPIRED'
      ) {
        order.status = 'cancelled';
        this.logger.log(
          `Order UID:${order.uid} cancelled/rejected on Binance`,
          submittedOrder,
        );
        this.orderRepository.update(order);
      }
    } catch (error) {
      this.logger.error(
        `Failed to track order UID:${order.uid}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async calculateQuantity(order: Order) {
    const symbol = this.binanceService.sanitizeSymbol(order.pair);
    const [baseAsset, quoteAsset] = this.extractAssetsFromPair(order.pair);
    const exchangeInfo = await this.binanceService.exchangeInfo([order.pair]);
    const { balances } = await this.binanceService.accountInfo();

    const balance =
      order.side === 'buy'
        ? balances.find(({ asset }) => asset === quoteAsset)
        : balances.find(({ asset }) => asset === baseAsset);

    if (!balance || parseFloat(balance.free) <= 0) {
      return 0;
    }

    const availableBalance =
      order.side === 'buy'
        ? Math.min(parseFloat(balance.free), this.config.stake)
        : parseFloat(balance.free);

    const desiredQuantity = this.calculateDesiredQuantity(
      order.quantity,
      availableBalance,
      parseFloat(order.price),
    );

    const symbolExchange = exchangeInfo.symbols.find(
      (x) => x.symbol === symbol,
    );
    const baseExchangeParams = symbolExchange?.filters?.find(
      (f) => f.filterType === 'LOT_SIZE',
    );

    return +this.calculateValidQuantity(
      desiredQuantity,
      baseExchangeParams,
    ).toFixed(symbolExchange.baseAssetPrecision);
  }

  private calculateDesiredQuantity(
    quantity: Quantity,
    balance: number,
    price: number,
  ) {
    if (quantity.type !== 'percent') {
      return parseFloat(quantity.value);
    }
    return ((balance / price) * parseFloat(quantity.value)) / 100;
  }

  private calculateValidQuantity(
    desiredQuantity: number,
    exchangeInfo: SpotRestAPI.ExchangeInfoResponseExchangeFiltersInner,
  ) {
    if (
      desiredQuantity < +exchangeInfo.minQty ||
      desiredQuantity > +exchangeInfo.maxQty
    ) {
      return 0;
    }

    const step = parseFloat(exchangeInfo.stepSize);

    return Math.floor(desiredQuantity / step) * step;
  }

  private extractAssetsFromPair(pair: string): string[] {
    return pair.split('-');
  }
}
