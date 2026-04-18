import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiOrdersService } from './api.orders.service';
import { ListExchangeOrdersDto } from './dto/list-exchange-orders.dto';
import { ListExchangeOrdersResponseDto } from './dto/list-exchange-orders.response.dto';
import { ListInternalOrdersDto } from './dto/list-local-orders.dto';
import { ListInternalOrdersResponseDto } from './dto/list-local-orders.response.dto';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('api/orders')
export class ApiOrderController {
  constructor(private readonly apiOrdersService: ApiOrdersService) {}

  @Post('exchange/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch orders from exchange',
    description:
      'Retrieves orders from the specified exchange, optionally filtered by date range, trading pair, and status',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: ListExchangeOrdersResponseDto,
  })
  async listExchangeOrders(@Body() dto: ListExchangeOrdersDto) {
    return this.apiOrdersService.listExchangeOrders(dto);
  }

  @Post('internal/list')
  @ApiOperation({
    summary: 'List orders and positions from local DB',
    description:
      'Returns orders tracked internally with their local status, and all currently open positions',
  })
  @ApiResponse({
    status: 200,
    description: 'Local orders and positions retrieved successfully',
    type: ListInternalOrdersResponseDto,
  })
  async listInternalOrders(@Body() dto: ListInternalOrdersDto) {
    return this.apiOrdersService.listInternalOrders(dto);
  }
}
