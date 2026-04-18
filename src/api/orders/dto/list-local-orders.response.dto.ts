import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocalQuantityDto {
  @ApiProperty({ enum: ['fixed', 'percent'], example: 'percent' })
  type: 'fixed' | 'percent';

  @ApiProperty({ example: '100' })
  value: string;
}

export class LocalOrderDto {
  @ApiProperty({
    description: 'Internal order UID',
    example: 'rule001-buy-1700000000000',
  })
  uid: string;

  @ApiProperty({ example: 'SOL-USDT' })
  pair: string;

  @ApiProperty({ enum: ['buy', 'sell'], example: 'buy' })
  side: 'buy' | 'sell';

  @ApiProperty({ enum: ['market', 'limit'], example: 'limit' })
  type: 'market' | 'limit';

  @ApiProperty({ example: '150.50' })
  price: string;

  @ApiProperty({ type: LocalQuantityDto })
  quantity: LocalQuantityDto;

  @ApiProperty({
    enum: ['new', 'pending', 'completed', 'cancelled', 'failed'],
    example: 'completed',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Exchange order ID (once submitted)',
    example: '12345678',
  })
  externalUid?: string;

  @ApiPropertyOptional({
    description: 'Rule action that triggered this order ({ruleUid}-{side})',
    example: 'rule001-buy',
  })
  actionId?: string;

  @ApiPropertyOptional({ description: 'Amount filled so far', example: 10 })
  filledQuantity?: number;

  @ApiPropertyOptional({
    description: 'Timestamp when placed locally (ms)',
    example: 1700000000000,
  })
  placedAt?: number;

  @ApiPropertyOptional({
    description: 'Timestamp when submitted to exchange (ms)',
    example: 1700000001000,
  })
  submittedAt?: number;

  @ApiPropertyOptional({
    description: 'Timestamp when completed or cancelled (ms)',
    example: 1700000060000,
  })
  completedAt?: number;

  @ApiPropertyOptional({
    description: 'Error message if failed',
    example: 'Insufficient balance',
  })
  errorMessage?: string;
}

export class LocalPositionDto {
  @ApiProperty({ example: 'SOL-USDT' })
  pair: string;

  @ApiProperty({ enum: ['buy', 'sell'], example: 'buy' })
  side: 'buy' | 'sell';

  @ApiProperty({ description: 'Current held quantity', example: 10.5 })
  quantity: number;

  @ApiProperty({ description: 'Weighted average entry price', example: 148.3 })
  averagePrice: number;

  @ApiPropertyOptional({
    description: 'Order that opened this position',
    example: 'rule001-buy-1700000000000',
  })
  orderUid?: string;

  @ApiPropertyOptional({
    description: 'Rule action that opened this position',
    example: 'rule001-buy',
  })
  actionId?: string;

  @ApiProperty({
    description: 'Timestamp when position was opened (ms)',
    example: 1700000001000,
  })
  openedAt: number;

  @ApiPropertyOptional({
    description: 'Timestamp when position was closed (ms)',
    example: 1700000120000,
  })
  closedAt?: number;

  @ApiProperty({ example: true })
  isOpen: boolean;
}

export class ListLocalOrdersResponseDto {
  @ApiProperty({ type: [LocalOrderDto] })
  orders: LocalOrderDto[];

  @ApiProperty({ type: [LocalPositionDto] })
  positions: LocalPositionDto[];
}
