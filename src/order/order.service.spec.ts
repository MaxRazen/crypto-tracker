import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { BinanceModule } from '../binance/binance.module';
import { ConfigModule } from '@nestjs/config';
import orderConfig from './order.config';
import { StorageModule } from '../storage/storage.module';
import { OrderRepository } from './order.repository';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(orderConfig),
        StorageModule,
        BinanceModule,
      ],
      providers: [OrderRepository, OrderService],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
