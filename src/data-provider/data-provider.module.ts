import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import modeConfig from '../config/mode.config';
import { ExchangeModule } from '../exchange/exchange.module';
import { BinanceWsService } from './binance-ws.service';
import { MarketDataService } from './market-data.service';
import { IndicatorService } from './indicator.service';
import { DataProviderService } from './data-provider.service';

@Module({
  imports: [ConfigModule.forFeature(modeConfig), ExchangeModule],
  providers: [
    BinanceWsService,
    MarketDataService,
    IndicatorService,
    DataProviderService,
  ],
  exports: [DataProviderService, MarketDataService, IndicatorService],
})
export class DataProviderModule {}
