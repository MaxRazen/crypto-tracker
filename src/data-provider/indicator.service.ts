import { Injectable, Logger } from '@nestjs/common';
import talib = require('talib');
import { Candle, ParsedIndicator } from './data-provider.types';

/**
 * IndicatorService calculates technical indicators from candle data
 * using TA-Lib (native C++ bindings).
 *
 * To add a new indicator:
 *   1. Add an entry to TALIB_NAME_MAP.
 *   2. If the indicator needs custom params, extend executeTalib().
 */
@Injectable()
export class IndicatorService {
  private readonly logger = new Logger(IndicatorService.name);

  /** Maps our lowercase indicator names to TA-Lib function names. */
  private readonly TALIB_NAME_MAP: Record<string, string> = {
    sma: 'SMA',
    ma: 'SMA',
    ema: 'EMA',
    rsi: 'RSI',
    wma: 'WMA',
    dema: 'DEMA',
    tema: 'TEMA',
    trima: 'TRIMA',
    kama: 'KAMA',
  };

  /**
   * Parse an activator type string into a structured indicator descriptor.
   *
   * Examples:
   *   'price'    -> { name: 'price', params: {} }
   *   'sma(25)'  -> { name: 'sma', params: { period: 25 } }
   *   'ma(50)'   -> { name: 'ma',  params: { period: 50 } }
   *   'rsi(14)'  -> { name: 'rsi', params: { period: 14 } }
   */
  parseActivatorType(type: string): ParsedIndicator {
    if (type === 'price') {
      return { name: 'price', params: {} };
    }

    const match = type.match(/^(\w+)\((\d+)\)$/);
    if (match) {
      return {
        name: match[1].toLowerCase(),
        params: { period: parseInt(match[2], 10) },
      };
    }

    return { name: type.toLowerCase(), params: {} };
  }

  /**
   * Determine how many closed candles are needed for a given activator type.
   * Adds a buffer over the bare minimum so TA-Lib has warm-up room.
   */
  getRequiredCandleCount(type: string): number {
    const { name, params } = this.parseActivatorType(type);
    if (name === 'price') return 0;

    const period = params.period || 14;
    return period + 10;
  }

  /**
   * Calculate an indicator value from closed candles.
   * Returns the most recent computed value, or null if insufficient data.
   */
  calculate(type: string, candles: Candle[]): number | null {
    const { name, params } = this.parseActivatorType(type);
    if (name === 'price') return null;

    const talibName = this.TALIB_NAME_MAP[name];
    if (!talibName) {
      this.logger.warn(`Unknown indicator: ${name}`);
      return null;
    }

    const closes = candles.map((c) => c.close);
    if (closes.length === 0) return null;

    try {
      return this.executeTalib(talibName, closes, params);
    } catch (err) {
      this.logger.warn(`Failed to calculate ${type}: ${err.message}`);
      return null;
    }
  }

  /**
   * Execute a TA-Lib function and return the last output value.
   */
  private executeTalib(
    talibName: string,
    prices: number[],
    params: Record<string, number>,
  ): number | null {
    const execParams: Record<string, any> = {
      name: talibName,
      startIdx: 0,
      endIdx: prices.length - 1,
      inReal: prices,
    };

    if (params.period !== undefined) {
      execParams.optInTimePeriod = params.period;
    }

    const result = talib.execute(execParams);
    const values: number[] | undefined = result?.result?.outReal;

    if (!values || values.length === 0) return null;
    return values[values.length - 1];
  }
}
