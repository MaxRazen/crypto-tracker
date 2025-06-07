import { Test, TestingModule } from '@nestjs/testing';
import { BinanceService } from './binance.service';
import { ConfigModule } from '@nestjs/config';
import binanceConfig from './binance.config';
import { BinanceFactory } from './binance.factory';

describe('BinanceService', () => {
  let service: BinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(binanceConfig)],
      providers: [BinanceFactory, BinanceService],
    }).compile();

    service = module.get<BinanceService>(BinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
