import { RuleActivator, RuleAction } from '../../../rule/rule.types';

export class UpdateRuleDto {
  active?: boolean;
  pair?: string;
  market?: string;
  timeframe?: string;
  fetchType?: string;
  activators?: RuleActivator[];
  actions?: RuleAction[];
  deadlines?: any[];
}
