import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import exchangeConfig from './exchange.config';
import { ExchangeService } from './exchange.service';
import { BinanceExchangeProvider } from './binance.provider';
import { BinanceService } from './binance.service';

@Module({
  imports: [ConfigModule.forFeature(exchangeConfig)],
  providers: [ExchangeService, BinanceExchangeProvider, BinanceService],
  exports: [ExchangeService, BinanceService],
})
export class ExchangeModule {}
