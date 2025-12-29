import { Module } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { RuleModule } from '../rule/rule.module';
import { OrderModule } from '../order/order.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { PriceFetcherService } from './price-fetcher.service';

@Module({
  imports: [ExchangeModule, RuleModule, OrderModule],
  providers: [PriceFetcherService, TrackerService],
  exports: [PriceFetcherService],
})
export class TrackerModule {}
