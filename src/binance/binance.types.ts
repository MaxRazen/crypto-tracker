export interface BinanceOrderRequest {
  uid: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity?: number;
  price?: number;
  quoteOrderQty?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface BinanceOrderResponse {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  fills: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}
