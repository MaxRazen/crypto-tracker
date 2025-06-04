import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BinanceService } from '../binance/binance.service';

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  constructor(private binanceService: BinanceService) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'ticker-tracker',
  })
  async tickerTrackerSchedule() {
    const result = await this.binanceService.tickerPrice(['SOLUSDT']);

    this.logger.debug(result.data);
  }
}
