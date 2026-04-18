import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssetBalanceDto {
  @ApiProperty({ example: 'USDT' })
  asset: string;

  @ApiProperty({ example: 1000.5 })
  free: number;

  @ApiProperty({ example: 0 })
  used: number;

  @ApiProperty({ example: 1000.5 })
  total: number;
}

export class BalanceResponseDto {
  @ApiProperty({ type: [AssetBalanceDto] })
  assets: AssetBalanceDto[];

  @ApiPropertyOptional({ example: 1713430000000 })
  timestamp?: number;
}
