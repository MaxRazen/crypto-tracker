export type Quantity = {
  type: 'percent';
  value: string;
};

export type Order = {
  uid: string;
  pair: string;
  price: string;
  type: 'buy' | 'sell';
  quantity: Quantity;
};
