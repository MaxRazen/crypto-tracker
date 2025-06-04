import { Module } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { BinanceModule } from '../binance/binance.module';

@Module({
  imports: [BinanceModule],
  providers: [TrackerService],
})
export class TrackerModule {}
