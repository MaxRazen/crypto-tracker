import { HttpService } from 'nestjs-http-promise';
import { Inject, Injectable } from '@nestjs/common';
import binanceConfig from './binance.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class BinanceService {
  private readonly version: string;

  constructor(
    private httpService: HttpService,

    @Inject(binanceConfig.KEY)
    config: ConfigType<typeof binanceConfig>,
  ) {
    this.version = config.apiVersion;
  }

  async tickerPrice(tickers: string[]) {
    const query = `symbols=` + JSON.stringify(tickers);

    return this.httpService.get<Array<{ symbol: string; price: string }>>(
      `/api/${this.version}/ticker/price?` + query,
    );
  }
}
