import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fee structure from CCXT exchange order
 */
export class OrderFeeDto {
  @ApiPropertyOptional({ description: 'Fee currency', example: 'USDT' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Fee cost', example: 0.001 })
  cost?: number;

  @ApiPropertyOptional({ description: 'Fee rate', example: 0.001 })
  rate?: number;
}

/**
 * Exchange order structure (CCXT format).
 * Aligns with order.types Order concepts: pair→symbol, side, type, price, status.
 */
export class ExchangeOrderDto {
  @ApiProperty({ description: 'Exchange order ID', example: '12345678' })
  id: string;

  @ApiPropertyOptional({ description: 'Client order ID' })
  clientOrderId?: string;

  @ApiProperty({
    description: 'Order datetime (ISO string)',
    example: '2024-01-15T10:30:00.000Z',
  })
  datetime: string;

  @ApiProperty({ description: 'Order timestamp (ms)', example: 1705312200000 })
  timestamp: number;

  @ApiPropertyOptional({ description: 'Last trade timestamp' })
  lastTradeTimestamp?: number;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  lastUpdateTimestamp?: number;

  @ApiProperty({
    description: 'Order status',
    enum: ['open', 'closed', 'canceled', 'expired', 'rejected', 'new'],
    example: 'closed',
  })
  status: string;

  @ApiProperty({ description: 'Trading pair (symbol)', example: 'BTC/USDT' })
  symbol: string;

  @ApiProperty({
    description: 'Order type',
    enum: ['market', 'limit'],
    example: 'limit',
  })
  type: string;

  @ApiPropertyOptional({ description: 'Time in force' })
  timeInForce?: string;

  @ApiProperty({
    description: 'Order side',
    enum: ['buy', 'sell'],
    example: 'buy',
  })
  side: string;

  @ApiProperty({ description: 'Order price', example: 50000 })
  price: number;

  @ApiPropertyOptional({ description: 'Average fill price' })
  average?: number;

  @ApiProperty({ description: 'Order amount', example: 0.001 })
  amount: number;

  @ApiProperty({ description: 'Filled amount', example: 0.001 })
  filled: number;

  @ApiProperty({ description: 'Remaining amount', example: 0 })
  remaining: number;

  @ApiPropertyOptional({ description: 'Stop price' })
  stopPrice?: number;

  @ApiPropertyOptional({ description: 'Trigger price' })
  triggerPrice?: number;

  @ApiProperty({ description: 'Total cost (filled * price)', example: 50 })
  cost: number;

  @ApiPropertyOptional({ description: 'Order fee', type: OrderFeeDto })
  fee?: OrderFeeDto;

  @ApiPropertyOptional({ description: 'Reduce only flag' })
  reduceOnly?: boolean;

  @ApiPropertyOptional({ description: 'Post only flag' })
  postOnly?: boolean;

  @ApiPropertyOptional({ description: 'Raw exchange response' })
  info?: Record<string, unknown>;
}

/**
 * Order performance metrics (when computePerformance=true)
 */
export class OrderPerformanceDto {
  @ApiProperty({ description: 'Profit percentage (ROI)', example: 5.25 })
  profitPercent: number;

  @ApiProperty({ description: 'Realized profit', example: 125.5 })
  profit: number;

  @ApiProperty({
    description: 'Anticipated profit (including open orders)',
    example: 150.0,
  })
  anticipatedProfit: number;

  @ApiProperty({ description: 'Total fees paid', example: 0.5 })
  fees: number;

  @ApiProperty({
    description: 'Total orders (excluding cancelled)',
    example: 10,
  })
  totalOrders: number;

  @ApiProperty({ description: 'Cancelled orders count', example: 2 })
  cancelledOrders: number;

  @ApiProperty({ description: 'Active/open orders count', example: 1 })
  activeOrders: number;

  @ApiProperty({ description: 'Average buy price', example: 49500 })
  avgBuyPrice: number;

  @ApiProperty({ description: 'Average sell price', example: 52000 })
  avgSellPrice: number;

  @ApiProperty({ description: 'Total volume (buy + sell)', example: 1.5 })
  volume: number;
}

/**
 * Response for fetch orders endpoint
 */
export class FetchOrdersResponseDto {
  @ApiProperty({
    description: 'Orders retrieved from the exchange',
    type: [ExchangeOrderDto],
  })
  orders: ExchangeOrderDto[];

  @ApiPropertyOptional({
    description: 'Performance metrics (when computePerformance=true)',
    type: OrderPerformanceDto,
  })
  performance?: OrderPerformanceDto;
}
