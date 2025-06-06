import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { BinanceModule } from '../binance/binance.module';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BinanceModule],
      providers: [OrderService],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
