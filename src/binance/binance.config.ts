import { registerAs } from '@nestjs/config';

export type BinanceConfig = {
  baseUrl: string;
  apiVersion: string;
  apiKey: string;
  apiSecret: string;
};

export default registerAs(
  'binance',
  (): BinanceConfig => ({
    baseUrl: process.env.BINANCE_API_URL || 'https://api.binance.com',
    apiVersion: process.env.BINANCE_API_VERSION || 'v3',
    apiKey: process.env.BINANCE_API_KEY || '',
    apiSecret: process.env.BINANCE_API_SECRET || '',
  }),
);
