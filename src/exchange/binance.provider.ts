import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { binance } from 'ccxt';
import { ExchangeConfig } from './exchange.config';
import { ExchangeService } from './exchange.service';

export const BINANCE_EXCHANGE_PROVIDER = 'BINANCE_EXCHANGE';

export const BinanceExchangeProvider: Provider = {
  provide: BINANCE_EXCHANGE_PROVIDER,
  inject: [ConfigService, ExchangeService],
  useFactory: async (
    configService: ConfigService,
    exchangeService: ExchangeService,
  ) => {
    const exchangeConfig =
      configService.get<ExchangeConfig['binance']>('exchange.binance');

    if (!exchangeConfig?.apiKey || !exchangeConfig?.apiSecret) {
      throw new Error(
        'Binance API key and secret must be configured in environment variables',
      );
    }

    const exchangeId = 'binance';
    const exchange = new binance({
      apiKey: exchangeConfig.apiKey,
      secret: exchangeConfig.apiSecret,
      sandbox: exchangeConfig.sandbox || false,
      enableRateLimit: exchangeConfig.enableRateLimit ?? true,
      options: {
        defaultType: 'spot', // Use spot trading
      },
    });

    // Register the exchange with the exchange service
    exchangeService.registerExchange(exchangeId, exchange);

    return exchange;
  },
};
