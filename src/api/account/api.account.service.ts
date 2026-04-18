import { Injectable, Logger } from '@nestjs/common';
import { ExchangeService } from '../../exchange/exchange.service';
import { BalanceDto } from './dto/balance.dto';
import {
  AssetBalanceDto,
  BalanceResponseDto,
} from './dto/balance.response.dto';

const BALANCE_META_KEYS = new Set([
  'info',
  'timestamp',
  'datetime',
  'free',
  'used',
  'total',
]);

@Injectable()
export class ApiAccountService {
  private readonly logger = new Logger(ApiAccountService.name);

  constructor(private readonly exchangeService: ExchangeService) {}

  async balance({ exchange, symbol }: BalanceDto): Promise<BalanceResponseDto> {
    const exchangeId = exchange || 'binance';
    const balances = await this.exchangeService.getBalance(exchangeId);

    const assets: AssetBalanceDto[] = Object.entries(balances)
      .filter(([key]) => !BALANCE_META_KEYS.has(key))
      .filter(([key]) => !symbol || key.toUpperCase() === symbol.toUpperCase())
      .map(([asset, balance]) => ({
        asset,
        free: (balance as any).free ?? 0,
        used: (balance as any).used ?? 0,
        total: (balance as any).total ?? 0,
      }))
      .filter(({ total }) => (!symbol && total > 0) || !!symbol);

    return { assets, timestamp: balances.timestamp };
  }
}
