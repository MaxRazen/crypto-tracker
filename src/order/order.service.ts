import { Injectable, Logger } from '@nestjs/common';
import { BinanceService } from '../binance/binance.service';
import { Order } from './order.types';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  private orders: Order[] = [];

  constructor(private binanceService: BinanceService) {}

  async placeOrder(dto: Order) {
    if (this.orders.some((o) => o.uid === dto.uid)) {
      this.logger.warn(`Order UID:${dto.uid} has been already placed`);
      return;
    }

    this.orders.push(dto);
    this.logger.log(`Order UID:${dto.uid} placed`);
  }

  private async submitOrder() {}
}
