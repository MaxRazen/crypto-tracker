import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { BinanceModule } from '../binance/binance.module';

@Module({
  imports: [BinanceModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
