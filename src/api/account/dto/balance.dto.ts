import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BalanceDto {
  @ApiPropertyOptional({
    description: 'Exchange ID to fetch balance from',
    example: 'binance',
    default: 'binance',
  })
  @IsOptional()
  @IsString()
  exchange?: string;

  @ApiPropertyOptional({
    description: 'Filter by a specific asset symbol (e.g. USDT, BTC)',
    example: 'USDT',
  })
  @IsOptional()
  @IsString()
  symbol?: string;
}
