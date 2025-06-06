export type RuleActivator = {
  side: 'lte' | 'gte';
  value: string;
};

export type RuleActionQuantity = {
  type: 'percent';
  value: string;
};

export type RuleAction = {
  type: 'buy' | 'sell';
  behavior: 'limit' | 'market';
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
