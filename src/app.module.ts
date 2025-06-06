import { Module } from '@nestjs/common';
import { TrackerModule } from './tracker/tracker.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BinanceModule } from './binance/binance.module';
import { RuleModule } from './rule/rule.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TrackerModule,
    BinanceModule,
    RuleModule,
    OrderModule,
  ],
})
export class AppModule {}
