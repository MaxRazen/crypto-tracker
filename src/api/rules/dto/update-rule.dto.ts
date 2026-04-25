import { IsString, IsBoolean, IsArray, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RuleActivator, RuleAction } from '../../../rule/rule.types';
import { RuleActivatorDto } from './rule-activator.dto';
import { RuleActionDto } from './rule-action.dto';

export class UpdateRuleDto {
  @ApiPropertyOptional({
    description: 'Whether the rule is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Trading pair for the rule',
    example: 'BTC-USDT',
  })
  @IsOptional()
  @IsString()
  pair?: string;

  @ApiPropertyOptional({
    description: 'Market type',
    example: 'spot',
  })
  @IsOptional()
  @IsString()
  market?: string;

  @ApiPropertyOptional({
    description: 'Type of data fetch',
    example: 'ticker',
  })
  @IsOptional()
  @IsString()
  fetchType?: string;

  @ApiPropertyOptional({
    description: 'Array of rule activators (conditions)',
    type: [RuleActivatorDto],
    example: [{ type: 'price', side: 'lte', value: '50000', timeframe: '1m' }],
  })
  @IsOptional()
  @IsArray()
  activators?: RuleActivator[];

  @ApiPropertyOptional({
    description: 'Array of actions to execute when rule is activated',
    type: [RuleActionDto],
    example: [
      {
        type: 'buy',
        context: {
          type: 'market',
          price: '50000',
          quantity: { type: 'percent', value: '50' },
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  actions?: RuleAction[];

  @ApiPropertyOptional({
    description: 'Array of deadlines (optional)',
    example: [],
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  deadlines?: any[];
}
