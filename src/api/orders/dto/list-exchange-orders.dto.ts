import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsIn,
  IsInt,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const CCXT_ORDER_STATUSES = [
  'open',
  'closed',
  'canceled',
  'expired',
  'rejected',
] as const;

export class ListExchangeOrdersDto {
  @ApiPropertyOptional({
    description: 'Start date for fetching orders',
    type: Number,
    format: 'timestamp',
  })
  @IsOptional()
  @IsInt()
  since?: number;

  @ApiPropertyOptional({
    description: 'End date for fetching orders',
    type: Number,
    format: 'timestamp',
  })
  @IsOptional()
  @IsInt()
  until?: number;

  @ApiPropertyOptional({
    description: 'Trading pair to filter orders (e.g., BTC-USDT)',
    example: 'BTC-USDT',
  })
  @IsOptional()
  @IsString()
  pair?: string;

  @ApiPropertyOptional({
    description: 'Exchange ID to fetch orders from',
    example: 'binance',
    default: 'binance',
  })
  @IsOptional()
  @IsString()
  exchange?: string;

  @ApiPropertyOptional({
    description: 'Filter by one or more exchange order statuses',
    example: ['open', 'closed'],
    enum: CCXT_ORDER_STATUSES,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsIn(CCXT_ORDER_STATUSES, { each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Compute performance metrics',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  computePerformance?: boolean;
}
