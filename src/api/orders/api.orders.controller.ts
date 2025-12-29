import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiOrdersService } from './api.orders.service';
import { FetchOrdersDto } from './dto/fetch-orders.dto';
import { Order } from 'ccxt';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('api/orders')
export class ApiOrderController {
  constructor(private readonly apiOrdersService: ApiOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch orders from exchange',
    description:
      'Retrieves orders from the specified exchange, optionally filtered by date range and trading pair',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: [Object],
  })
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
