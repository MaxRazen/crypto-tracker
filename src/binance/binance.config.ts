import { SPOT_REST_API_TESTNET_URL } from '@binance/spot';
import { registerAs } from '@nestjs/config';

export type BinanceConfig = {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
};

export default registerAs(
  'binance',
  (): BinanceConfig => ({
    baseUrl: process.env.BINANCE_API_URL || SPOT_REST_API_TESTNET_URL,
    apiKey: process.env.BINANCE_API_KEY || '',
    apiSecret: process.env.BINANCE_API_SECRET || '',
  }),
);
