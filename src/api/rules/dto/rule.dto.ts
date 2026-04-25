import { ApiProperty } from '@nestjs/swagger';
import { RuleActivatorDto } from './rule-activator.dto';
import { RuleActionDto } from './rule-action.dto';

export class RuleDto {
  @ApiProperty({ example: 'rule-btc-buy-low' })
  uid: string;

  @ApiProperty({ example: 'rule-btc-buy-low' })
  status: 'active' | 'inactive' | 'activated';

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 'BTC-USDT' })
  pair: string;

  @ApiProperty({ example: 'binance' })
  market: string;

  @ApiProperty({ example: 'ws' })
  fetchType: string;

  @ApiProperty({
    type: [RuleActivatorDto],
    example: [{ type: 'price', side: 'lte', value: '50000', timeframe: '1m' }],
  })
  activators: RuleActivatorDto[];

  @ApiProperty({
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
  actions: RuleActionDto[];

  @ApiProperty()
  activatedAt: Date | null;

  @ApiProperty({ type: [Object], example: [] })
  deadlines: any[];
}
