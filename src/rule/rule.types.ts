// ─── Activators ───────────────────────────────────────────

export type RuleActivator = {
  type: string;
  side: 'lte' | 'gte';
  value: string;
  timeframe?: string;
};

// ─── Action Types ─────────────────────────────────────────

export type RuleActionQuantity = {
  type: 'fixed' | 'percent';
  value: string;
};

export type OrderActionContext = {
  type: 'limit' | 'market';
  price: string;
  quantity: RuleActionQuantity;
};

export type RuleActivationContext = {
  ruleUid: string;
};

export type NotificationActionContext = {
  channel: string;
};

export type RuleAction =
  | { type: 'activate'; context: RuleActivationContext }
  | { type: 'deactivate'; context: RuleActivationContext }
  | { type: 'buy'; context: OrderActionContext }
  | { type: 'sell'; context: OrderActionContext }
  | { type: 'notification'; context: NotificationActionContext }
  | { type: 'alert'; context: NotificationActionContext };

// ─── Type Guards ──────────────────────────────────────────

export function isOrderAction(
  action: RuleAction,
): action is Extract<RuleAction, { type: 'buy' | 'sell' }> {
  return action.type === 'buy' || action.type === 'sell';
}

export function isRuleActivationAction(
  action: RuleAction,
): action is Extract<RuleAction, { type: 'activate' | 'deactivate' }> {
  return action.type === 'activate' || action.type === 'deactivate';
}

export function isNotificationAction(
  action: RuleAction,
): action is Extract<RuleAction, { type: 'notification' | 'alert' }> {
  return action.type === 'notification' || action.type === 'alert';
}

// ─── Rule ─────────────────────────────────────────────────

export type Rule = {
  uid: string;
  active: boolean;
  pair: string;
  market: string;
  timeframe: string;
  fetchType: string;
  activators: RuleActivator[];
  actions: RuleAction[];
  deadlines: any[];
};
