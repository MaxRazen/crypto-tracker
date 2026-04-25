import { MarketUpdateEvent, RuleTriggeredEvent } from '../../event/event.types';

export type WsOutboundMessage =
  | { type: 'market_update'; data: MarketUpdateEvent }
  | { type: 'rule_triggered'; data: RuleTriggeredEvent };
