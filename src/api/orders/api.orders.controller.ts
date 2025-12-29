import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOrdersService } from './api.orders.service';
import { FetchOrdersDto } from './dto/fetch-orders.dto';
import { Order } from 'ccxt';

@Controller('api/orders')
export class ApiOrderController {
  constructor(private readonly apiOrdersService: ApiOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async fetchOrders(@Body() dto: FetchOrdersDto): Promise<Order[]> {
    const exchangeId = dto.exchange || 'binance';

    // Convert date strings to timestamps
    const since = dto.since ? new Date(dto.since).getTime() : undefined;
    const until = dto.until ? new Date(dto.until).getTime() : undefined;

    return await this.apiOrdersService.fetchOrders(
      exchangeId,
      dto.pair,
      since,
      until,
    );
  }
}
