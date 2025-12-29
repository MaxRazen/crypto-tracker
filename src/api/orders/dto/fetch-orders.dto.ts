import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FetchOrdersDto {
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
}
