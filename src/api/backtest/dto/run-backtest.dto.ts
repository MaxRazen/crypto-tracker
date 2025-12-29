import {
  IsDateString,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunBacktestDto {
  @ApiProperty({
    description: 'Start date for the backtest period',
    example: '2024-01-01T00:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for the backtest period',
    example: '2024-01-31T23:59:59Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Timeframe interval for historical data',
    example: '1h',
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
  })
  @IsString()
  interval: string; // e.g., '1m', '5m', '1h', '1d'

  @ApiProperty({
    description: 'Starting balance in quote currency',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  startBalance: number;

  @ApiProperty({
    description: 'Quote currency for the backtest',
    example: 'USDT',
  })
  @IsString()
  quoteCurrency: string;

  @ApiPropertyOptional({
    description: 'Exchange ID to use for historical data',
    example: 'binance',
    default: 'binance',
  })
  @IsString()
  @IsOptional()
  exchangeId?: string;

  @ApiPropertyOptional({
    description:
      'Array of rule UIDs to test. If empty, all active rules will be tested',
    example: ['rule-uid-1', 'rule-uid-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rules?: string[]; // Rule UIDs to test (if empty, tests all active rules)
}
