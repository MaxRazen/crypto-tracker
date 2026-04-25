import { ApiProperty } from '@nestjs/swagger';

export class RuleActionQuantityDto {
  @ApiProperty({ enum: ['fixed', 'percent'], example: 'percent' })
  type: 'fixed' | 'percent';

  @ApiProperty({ example: '50' })
  value: string;
}

export class OrderActionContextDto {
  @ApiProperty({ enum: ['market', 'limit'], example: 'market' })
  type: 'limit' | 'market';

  @ApiProperty({ example: '50000' })
  price: string;

  @ApiProperty({ type: RuleActionQuantityDto })
  quantity: RuleActionQuantityDto;
}

export class RuleActivationContextDto {
  @ApiProperty({
    description: 'UID of the rule to activate or deactivate',
    example: 'rule-btc-sell-high',
  })
  ruleUid: string;
}

export class NotificationActionContextDto {
  @ApiProperty({
    description: 'Notification channel identifier',
    example: 'telegram',
  })
  channel: string;
}

export class RuleActionDto {
  @ApiProperty({
    enum: ['buy', 'sell', 'activate', 'deactivate', 'notification', 'alert'],
    example: 'buy',
  })
  type: string;

  @ApiProperty({
    description:
      'Context shape depends on type — buy/sell: OrderActionContextDto; activate/deactivate: RuleActivationContextDto; notification/alert: NotificationActionContextDto',
    example: {
      type: 'market',
      price: '50000',
      quantity: { type: 'percent', value: '50' },
    },
  })
  context:
    | OrderActionContextDto
    | RuleActivationContextDto
    | NotificationActionContextDto;
}
