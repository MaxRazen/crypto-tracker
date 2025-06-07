import { Injectable, Logger } from '@nestjs/common';
import { BinanceOrderRequest } from './binance.types';
import { BinanceFactory } from './binance.factory';
import { Spot, SpotRestAPI } from '@binance/spot';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);

  private readonly client: Spot;

  constructor(binanceFactory: BinanceFactory) {
    this.client = binanceFactory.makeClient();
  }

  sanitizeSymbol(pair: string): string {
    return pair.toUpperCase().replaceAll('-', '');
  }

  async tickerPrice(pairs: string[]) {
    const response = await this.client.restAPI.tickerPrice({
      symbols: this.wrapSymbols(pairs.map((p) => this.sanitizeSymbol(p))),
    });
    return (await response.data()) as SpotRestAPI.TickerPriceResponse2;
  }

  async exchangeInfo(pairs: string[]) {
    const response = await this.client.restAPI.exchangeInfo({
      symbols: this.wrapSymbols(pairs.map((p) => this.sanitizeSymbol(p))),
    });
    return await response.data();
  }

  async accountInfo(): Promise<SpotRestAPI.GetAccountResponse> {
    const response = await this.client.restAPI.getAccount({
      omitZeroBalances: true,
    });
    return await response.data();
  }

  async createOrder(
    orderRequest: BinanceOrderRequest,
  ): Promise<SpotRestAPI.NewOrderResponse> {
    const response = await this.client.restAPI.newOrder({
      newClientOrderId: orderRequest.uid,
      symbol: orderRequest.symbol,
      side: SpotRestAPI.NewOrderSideEnum[orderRequest.side],
      type: SpotRestAPI.NewOrderTypeEnum[orderRequest.type],
      quantity: orderRequest.quantity,
      price: orderRequest.price,
      timeInForce: SpotRestAPI.NewOrderTimeInForceEnum.GTC,
    });

    return await response.data();
  }

  async cancelOrder(
    pair: string,
    orderId: number,
  ): Promise<SpotRestAPI.DeleteOrderResponse> {
    const response = await this.client.restAPI.deleteOrder({
      symbol: this.sanitizeSymbol(pair),
      orderId,
    });
    return await response.data();
  }

  async getOrder(
    pair: string,
    orderId: number,
  ): Promise<SpotRestAPI.GetOrderResponse> {
    const response = await this.client.restAPI.getOrder({
      symbol: this.sanitizeSymbol(pair),
      orderId,
    });
    return await response.data();
  }

  private wrapSymbols(symbols: string[]) {
    return [JSON.stringify(symbols)];
  }
}
