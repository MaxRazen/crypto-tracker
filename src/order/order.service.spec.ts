import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { ConfigModule } from '@nestjs/config';
import orderConfig from './order.config';
import modeConfig from '../config/mode.config';
import { OrderRepository } from './order.repository';
import { PositionRepository } from './position.repository';
import { PositionCooldownRepository } from './position-cooldown.repository';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(orderConfig),
        ConfigModule.forFeature(modeConfig),
      ],
      providers: [
        OrderRepository,
        PositionRepository,
        PositionCooldownRepository,
        OrderService,
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
