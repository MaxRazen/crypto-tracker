import { Rule, RuleAction } from '../rule/rule.types';
import { KlineEvent } from '../data-provider/data-provider.types';

export type MarketUpdateEvent = KlineEvent;

export interface ActivatorEvaluation {
  type: string;
  timeframe: string;
  side: string;
  computedValue: number;
  targetValue: number;
  matched: boolean;
}

export interface RuleTriggeredEvent {
  rule: Rule;
  evaluations: ActivatorEvaluation[];
  price: number;
  timestamp: number;
}

export interface OrderActionEvent {
  rule: Rule;
  action: Extract<RuleAction, { type: 'buy' | 'sell' }>;
  price: number;
  timestamp: number;
}

export interface RuleActivationEvent {
  rule: Rule;
  action: Extract<RuleAction, { type: 'activate' | 'deactivate' }>;
  timestamp: number;
}

export interface NotificationActionEvent {
  rule: Rule;
  action: Extract<RuleAction, { type: 'notification' | 'alert' }>;
  price: number;
  timestamp: number;
}
