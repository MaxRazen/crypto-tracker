import { Module } from '@nestjs/common';
import { ExchangeModule } from '../exchange/exchange.module';
import { BinanceWsService } from './binance-ws.service';
import { MarketDataService } from './market-data.service';
import { IndicatorService } from './indicator.service';
import { DataProviderService } from './data-provider.service';

@Module({
  imports: [ExchangeModule],
  providers: [
    BinanceWsService,
    MarketDataService,
    IndicatorService,
    DataProviderService,
  ],
  exports: [DataProviderService, MarketDataService, IndicatorService],
})
export class DataProviderModule {}
