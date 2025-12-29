import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BacktestService } from './backtest.service';
import { HistoricalDataService } from './historical-data.service';
import { BacktestExchangeService } from './backtest-exchange.service';
import { BacktestPriceFetcherService } from './backtest-price-fetcher.service';
import { ExchangeModule } from '../exchange/exchange.module';
import { RuleModule } from '../rule/rule.module';
import backtestConfig from './backtest.config';

@Module({
  imports: [
    ConfigModule.forFeature(backtestConfig),
    ExchangeModule,
    RuleModule,
  ],
  providers: [
    HistoricalDataService,
    BacktestExchangeService,
    BacktestPriceFetcherService,
    BacktestService,
  ],
  exports: [BacktestService],
})
export class BacktestModule {}
