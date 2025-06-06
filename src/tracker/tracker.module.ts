import { Module } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { BinanceModule } from '../binance/binance.module';
import { RuleModule } from '../rule/rule.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [BinanceModule, RuleModule, OrderModule],
  providers: [TrackerService],
})
export class TrackerModule {}
