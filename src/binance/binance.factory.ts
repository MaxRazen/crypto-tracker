import { Inject, Injectable } from '@nestjs/common';
import binanceConfig from './binance.config';
import { ConfigType } from '@nestjs/config';
import { Spot, SPOT_REST_API_TESTNET_URL } from '@binance/spot';

@Injectable()
export class BinanceFactory {
  constructor(
    @Inject(binanceConfig.KEY)
    private readonly config: ConfigType<typeof binanceConfig>,
  ) {}

  makeClient() {
    const configurationRestAPI = {
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
      basePath: this.config.baseUrl || SPOT_REST_API_TESTNET_URL,
    };

    return new Spot({ configurationRestAPI });
  }
}
