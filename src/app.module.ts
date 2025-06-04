import { Module } from '@nestjs/common';
import { TrackerModule } from './tracker/tracker.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BinanceModule } from './binance/binance.module';

@Module({
  imports: [ScheduleModule.forRoot(), TrackerModule, BinanceModule],
})
export class AppModule {}
