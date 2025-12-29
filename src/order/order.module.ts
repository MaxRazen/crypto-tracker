import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { BinanceModule } from '../binance/binance.module';
import { ConfigModule } from '@nestjs/config';
import orderConfig from './order.config';
import { OrderRepository } from './order.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';

@Module({
  imports: [
    ConfigModule.forFeature(orderConfig),
    TypeOrmModule.forFeature([OrderEntity]),
    BinanceModule,
  ],
  providers: [OrderRepository, OrderService],
  exports: [OrderService],
})
export class OrderModule {}
