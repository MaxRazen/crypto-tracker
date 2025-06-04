import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BinanceService {
  constructor(private httpService: HttpService) {}

  async tickerPrice(tickers: string[]) {
    const query = `symbols=` + JSON.stringify(tickers);

    return this.httpService.axiosRef.get<
      Array<{ symbol: string; price: string }>
    >('https://api4.binance.com/api/v3/ticker/price?' + query);
  }
}
