import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiOrdersService, OrderPerformance } from './api.orders.service';
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
    type: Object,
  })
  async fetchOrders(
    @Body() dto: FetchOrdersDto,
  ): Promise<{ orders: Order[]; performance?: OrderPerformance }> {
    return await this.apiOrdersService.fetchOrders(dto);
  }
}
