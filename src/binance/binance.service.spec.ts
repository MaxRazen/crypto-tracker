import { Test, TestingModule } from '@nestjs/testing';
import { BinanceService } from './binance.service';
import { HttpModule } from 'nestjs-http-promise';
import { ConfigModule } from '@nestjs/config';
import binanceConfig from './binance.config';

describe('BinanceService', () => {
  let service: BinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule.forFeature(binanceConfig)],
      providers: [BinanceService],
    }).compile();

    service = module.get<BinanceService>(BinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
