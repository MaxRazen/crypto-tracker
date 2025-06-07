export type RuleActivator = {
  side: 'lte' | 'gte';
  value: string;
};

export type RuleActionQuantity = {
  type: 'percent';
  value: string;
};

export type RuleAction = {
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: string;
  quantity: RuleActionQuantity;
};

export type Rule = {
  uid: string;
  active: boolean;
  pair: string;
  activators: RuleActivator[];
  actions: RuleAction[];
};
