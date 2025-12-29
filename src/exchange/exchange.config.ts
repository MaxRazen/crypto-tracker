import { registerAs } from '@nestjs/config';

export type ExchangeConfig = {
  binance: {
    apiKey: string;
    apiSecret: string;
    sandbox?: boolean;
    enableRateLimit?: boolean;
  };
};

export default registerAs(
  'exchange',
  (): ExchangeConfig => ({
    binance: {
      apiKey: process.env.BINANCE_API_KEY || '',
      apiSecret: process.env.BINANCE_API_SECRET || '',
      sandbox: process.env.BINANCE_SANDBOX === 'true',
      enableRateLimit: true,
    },
  }),
);
