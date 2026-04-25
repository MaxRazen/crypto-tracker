import { ApiProperty } from '@nestjs/swagger';

export class OrderPerformanceDto {
  @ApiProperty({ description: 'Profit percentage (ROI)', example: 5.25 })
  profitPercent: number;

  @ApiProperty({ description: 'Realized profit', example: 125.5 })
  profit: number;

  @ApiProperty({
    description: 'Anticipated profit including open orders at limit price',
    example: 150.0,
  })
  anticipatedProfit: number;

  @ApiProperty({ description: 'Total fees paid', example: 0.5 })
  fees: number;

  @ApiProperty({ description: 'Total orders excluding cancelled', example: 10 })
  totalOrders: number;

  @ApiProperty({ description: 'Cancelled orders count', example: 2 })
  cancelledOrders: number;

  @ApiProperty({ description: 'Active/open orders count', example: 1 })
  activeOrders: number;

  @ApiProperty({ description: 'Weighted average buy price', example: 49500 })
  avgBuyPrice: number;

  @ApiProperty({ description: 'Weighted average sell price', example: 52000 })
  avgSellPrice: number;

  @ApiProperty({
    description: 'Total volume (buy + sell filled)',
    example: 1.5,
  })
  volume: number;
}
