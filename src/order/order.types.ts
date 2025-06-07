export type Quantity = {
  type: 'percent';
  value: string;
};

export type Order = {
  uid: string;
  pair: string;
  price: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: Quantity;
  // Order Processing
  placedAt?: number;
  submittedAt?: number;
  status?: 'new' | 'pending' | 'failed' | 'completed' | 'cancelled';
  errorMessage?: string;
  externalUid?: number;
};
