import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiOrdersService } from './api.orders.service';
import { FetchOrdersDto } from './dto/fetch-orders.dto';
import { FetchOrdersResponseDto } from './dto/fetch-orders.response.dto';
import { ListLocalOrdersDto } from './dto/list-local-orders.dto';
import { ListLocalOrdersResponseDto } from './dto/list-local-orders.response.dto';

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
      'Retrieves orders from the specified exchange, optionally filtered by date range, trading pair, and status',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: FetchOrdersResponseDto,
  })
  async fetchOrders(@Body() dto: FetchOrdersDto) {
    return this.apiOrdersService.fetchOrders(dto);
  }

  @Get('local')
  @ApiOperation({
    summary: 'List orders and positions from local DB',
    description:
      'Returns orders tracked internally with their local status, and all currently open positions',
  })
  @ApiResponse({
    status: 200,
    description: 'Local orders and positions retrieved successfully',
    type: ListLocalOrdersResponseDto,
  })
  async listLocalOrders(@Query() dto: ListLocalOrdersDto) {
    return this.apiOrdersService.listLocalOrders(dto);
  }
}
