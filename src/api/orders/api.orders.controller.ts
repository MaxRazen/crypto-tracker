import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiOrdersService } from './api.orders.service';
import { FetchOrdersDto } from './dto/fetch-orders.dto';
import { FetchOrdersResponseDto } from './dto/fetch-orders.response.dto';

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
    type: FetchOrdersResponseDto,
  })
  async fetchOrders(@Body() dto: FetchOrdersDto) {
    return this.apiOrdersService.fetchOrders(dto);
  }
}
