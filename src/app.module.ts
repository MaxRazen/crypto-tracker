import { Module } from '@nestjs/common';
import { TrackerModule } from './tracker/tracker.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BinanceModule } from './binance/binance.module';
import { RuleModule } from './rule/rule.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TrackerModule,
    BinanceModule,
    RuleModule,
    OrderModule,
    StorageModule,
  ],
})
export class AppModule {}
