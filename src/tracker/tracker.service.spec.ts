import { Test, TestingModule } from '@nestjs/testing';
import { TrackerService } from './tracker.service';
import { BinanceModule } from '../binance/binance.module';
import { RuleModule } from '../rule/rule.module';
import { OrderModule } from '../order/order.module';

describe('TrackerService', () => {
  let service: TrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BinanceModule, RuleModule, OrderModule],
      providers: [TrackerService],
    }).compile();

    service = module.get<TrackerService>(TrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
