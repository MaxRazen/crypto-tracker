import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { ConfigModule } from '@nestjs/config';
import binanceConfig from './binance.config';
import { BinanceFactory } from './binance.factory';

@Module({
  imports: [ConfigModule.forFeature(binanceConfig)],
  providers: [BinanceFactory, BinanceService],
  exports: [BinanceService],
})
export class BinanceModule {}
