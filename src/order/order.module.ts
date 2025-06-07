import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { BinanceModule } from '../binance/binance.module';
import { ConfigModule } from '@nestjs/config';
import orderConfig from './order.config';
import { OrderRepository } from './order.repository';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ConfigModule.forFeature(orderConfig), StorageModule, BinanceModule],
  providers: [OrderRepository, OrderService],
  exports: [OrderService],
})
export class OrderModule {}
