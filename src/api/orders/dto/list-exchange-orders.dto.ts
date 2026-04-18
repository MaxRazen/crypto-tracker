import {
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  IsArray,
  IsIn,
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
    description: 'Start date for fetching orders (ISO date string)',
    example: '2024-01-01T00:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiPropertyOptional({
    description: 'End date for fetching orders (ISO date string)',
    example: '2024-01-31T23:59:59Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  until?: string;

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
