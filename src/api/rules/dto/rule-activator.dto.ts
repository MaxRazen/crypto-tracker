import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RuleActivatorDto {
  @ApiProperty({
    description: 'Activator type (e.g. price, sma(25))',
    example: 'price',
  })
  type: string;

  @ApiProperty({ enum: ['lte', 'gte'], example: 'lte' })
  side: 'lte' | 'gte';

  @ApiProperty({ example: '50000' })
  value: string;

  @ApiPropertyOptional({
    description: 'Timeframe for indicator-based activators',
    example: '1h',
  })
  timeframe?: string;
}
