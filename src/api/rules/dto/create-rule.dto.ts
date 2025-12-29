import { IsString, IsBoolean, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RuleActivator, RuleAction } from '../../../rule/rule.types';

export class CreateRuleDto {
  @ApiProperty({
    description: 'Unique identifier for the rule',
    example: 'rule-btc-buy-low',
  })
  @IsString()
  uid: string;

  @ApiPropertyOptional({
    description: 'Whether the rule is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({
    description: 'Trading pair for the rule',
    example: 'BTC-USDT',
  })
  @IsString()
  pair: string;

  @ApiProperty({
    description: 'Market type',
    example: 'spot',
  })
  @IsString()
  market: string;

  @ApiProperty({
    description: 'Timeframe for price data',
    example: '1h',
  })
  @IsString()
  timeframe: string;

  @ApiProperty({
    description: 'Type of data fetch',
    example: 'ticker',
  })
  @IsString()
  fetchType: string;

  @ApiProperty({
    description: 'Array of rule activators (conditions)',
    example: [
      {
        type: 'price',
        side: 'lte',
        value: '50000',
      },
    ],
    type: 'array',
  })
  @IsArray()
  activators: RuleActivator[];

  @ApiProperty({
    description: 'Array of actions to execute when rule is activated',
    example: [
      {
        side: 'buy',
        type: 'market',
        price: '50000',
        quantity: {
          type: 'percent',
          value: '50',
        },
      },
    ],
    type: 'array',
  })
  @IsArray()
  actions: RuleAction[];

  @ApiPropertyOptional({
    description: 'Array of deadlines (optional)',
    example: [],
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  deadlines?: any[];
}
