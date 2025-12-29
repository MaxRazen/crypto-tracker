import { registerAs } from '@nestjs/config';

export type BacktestConfig = {
  enabled: boolean;
  defaultStartBalance: number;
  defaultQuoteCurrency: string;
  defaultInterval: string; // e.g., '1m', '5m', '1h', '1d'
  defaultStartDate?: string; // ISO date string
  defaultEndDate?: string; // ISO date string
};

export default registerAs(
  'backtest',
  (): BacktestConfig => ({
    enabled: process.env.BACKTEST_ENABLED === 'true',
    defaultStartBalance: parseFloat(
      process.env.BACKTEST_START_BALANCE || '10000',
    ),
    defaultQuoteCurrency: process.env.BACKTEST_QUOTE_CURRENCY || 'USDT',
    defaultInterval: process.env.BACKTEST_INTERVAL || '1m',
    defaultStartDate: process.env.BACKTEST_START_DATE,
    defaultEndDate: process.env.BACKTEST_END_DATE,
  }),
);
