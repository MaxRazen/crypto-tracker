import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { HttpModule } from 'nestjs-http-promise';
import { ConfigModule } from '@nestjs/config';
import * as http from 'http';
import binanceConfig, { BinanceConfig } from './binance.config';

@Module({
  imports: [
    ConfigModule.forFeature(binanceConfig),
    HttpModule.registerAsync({
      useFactory: async (config: BinanceConfig) => ({
        timeout: 5_000,
        baseURL: config.baseUrl,
        httpAgent: new http.Agent({ timeout: 5_000, keepAlive: true }),
      }),
      inject: [binanceConfig.KEY],
      imports: [ConfigModule.forFeature(binanceConfig)],
    }),
  ],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class BinanceModule {}
