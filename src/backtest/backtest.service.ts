import { Injectable, Logger } from '@nestjs/common';
import {
  BacktestOptions,
  BacktestResult,
  BacktestTrade,
  BacktestPosition,
  EquityPoint,
} from './backtest.types';
import { HistoricalDataService } from './historical-data.service';
import { BacktestExchangeService } from './backtest-exchange.service';
import { BacktestPriceFetcherService } from './backtest-price-fetcher.service';
import { RuleService } from '../rule/rule.service';
import { Rule, isOrderAction } from '../rule/rule.types';
import { HistoricalCandle } from './backtest.types';

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);
  private readonly DEFAULT_EXCHANGE_ID = 'binance';
  private positionHistory: Map<
    string,
    { entryPrice: number; quantity: number; entryTime: number }
  > = new Map();

  constructor(
    private readonly historicalDataService: HistoricalDataService,
    private readonly backtestExchangeService: BacktestExchangeService,
    private readonly backtestPriceFetcherService: BacktestPriceFetcherService,
    private readonly ruleService: RuleService,
  ) {}

  /**
   * Run a backtest with given options
   */
  async runBacktest(options: BacktestOptions): Promise<BacktestResult> {
    this.logger.log(
      `Starting backtest from ${options.startDate.toISOString()} to ${options.endDate.toISOString()}`,
    );

    // Reset services
    this.backtestExchangeService.reset();
    this.backtestPriceFetcherService.clearCandles();
    this.positionHistory.clear();

    // Initialize virtual balance
    this.backtestExchangeService.initializeBalance(
      options.quoteCurrency,
      options.startBalance,
    );

    // Get rules to test
    const allRules =
      options.rules && options.rules.length > 0
        ? await Promise.all(
            options.rules.map((uid) => this.ruleService.getRule(uid)),
          )
        : await this.ruleService.getActiveRules();

    const rules = allRules.filter((r): r is Rule => r !== null);

    if (rules.length === 0) {
      throw new Error('No rules found to test');
    }

    // Get unique pairs from rules
    const pairs = [...new Set(rules.map((r) => r.pair))];
    const symbols = pairs.map((p) => this.normalizeSymbol(p));

    this.logger.log(`Testing ${rules.length} rules for ${pairs.length} pairs`);

    // Load historical data for all symbols
    const candlesBySymbol = new Map<string, HistoricalCandle[]>();
    const since = options.startDate.getTime();
    const until = options.endDate.getTime();

    for (const symbol of symbols) {
      try {
        const candles = await this.historicalDataService.loadHistoricalData(
          options.exchangeId || this.DEFAULT_EXCHANGE_ID,
          symbol,
          options.interval,
          since,
          until,
        );
        candlesBySymbol.set(symbol, candles);
        this.backtestPriceFetcherService.loadCandles(symbol, candles);
      } catch (error) {
        this.logger.error(
          `Failed to load data for ${symbol}: ${error.message}`,
        );
        throw error;
      }
    }

    // Find the time range that covers all symbols
    let minTimestamp = until;
    let maxTimestamp = since;

    for (const candles of candlesBySymbol.values()) {
      if (candles.length > 0) {
        minTimestamp = Math.min(minTimestamp, candles[0].timestamp);
        maxTimestamp = Math.max(
          maxTimestamp,
          candles[candles.length - 1].timestamp,
        );
      }
    }

    // Generate time steps based on interval
    const intervalMs = this.getIntervalMs(options.interval);
    const timeSteps: number[] = [];
    for (
      let t = Math.max(since, minTimestamp);
      t <= Math.min(until, maxTimestamp);
      t += intervalMs
    ) {
      timeSteps.push(t);
    }

    this.logger.log(`Simulating ${timeSteps.length} time steps`);

    // Track results
    const trades: BacktestTrade[] = [];
    const equityCurve: EquityPoint[] = [];
    let previousPositions: Map<string, BacktestPosition> = new Map();

    // Simulate time progression
    for (let i = 0; i < timeSteps.length; i++) {
      const timestamp = timeSteps[i];
      this.backtestPriceFetcherService.setCurrentTimestamp(timestamp);

      // Get current prices
      const prices = await this.backtestPriceFetcherService.fetchPrices(
        this.DEFAULT_EXCHANGE_ID,
        symbols,
      );

      // Update exchange service with current state
      this.backtestExchangeService.setCurrentState(
        timestamp,
        new Map(
          Array.from(prices.entries()).map(([symbol, data]) => [
            symbol,
            data.price,
          ]),
        ),
      );

      // Evaluate rules (simplified tracker logic)
      await this.evaluateRulesAtTimestamp(
        rules,
        prices,
        timestamp,
        options.quoteCurrency,
      );

      // Track equity
      const balance = this.backtestExchangeService.getBalance();
      const quoteBalance = balance[options.quoteCurrency]?.total || 0;

      // Calculate unrealized PnL from open positions
      const currentPositions = await this.calculatePositions(
        pairs,
        prices,
        options.quoteCurrency,
      );
      let unrealizedPnl = 0;
      for (const position of currentPositions.values()) {
        unrealizedPnl += position.unrealizedPnl;
      }

      equityCurve.push({
        timestamp,
        balance: quoteBalance,
        equity: quoteBalance + unrealizedPnl,
      });

      // Detect closed positions (trades)
      for (const [pair, currentPos] of currentPositions.entries()) {
        const prevPos = previousPositions.get(pair);
        if (prevPos && !currentPos) {
          // Position was closed
          trades.push({
            id: `trade-${trades.length + 1}`,
            pair,
            side: prevPos.side,
            entryPrice: prevPos.averagePrice,
            exitPrice: prevPos.currentPrice,
            quantity: prevPos.quantity,
            entryTime: prevPos.openedAt,
            exitTime: timestamp,
            pnl: prevPos.unrealizedPnl,
            pnlPercent: prevPos.unrealizedPnlPercent,
          });
        }
      }

      previousPositions = currentPositions;
    }

    // Calculate final results
    const finalBalance = this.backtestExchangeService.getBalance();
    const endBalance =
      finalBalance[options.quoteCurrency]?.total || options.startBalance;

    const result = this.calculateMetrics(
      options.startBalance,
      endBalance,
      trades,
      equityCurve,
      options.startDate,
      options.endDate,
    );

    this.logger.log(
      `Backtest completed: ${result.totalReturnPercent.toFixed(2)}% return, ${result.totalTrades} trades`,
    );

    return result;
  }

  /**
   * Evaluate rules at a specific timestamp (simplified tracker logic)
   */
  private async evaluateRulesAtTimestamp(
    rules: Rule[],
    prices: Map<string, { symbol: string; price: number; timestamp: number }>,
    timestamp: number,
    quoteCurrency: string,
  ): Promise<void> {
    for (const rule of rules) {
      if (!rule.active) {
        continue;
      }

      const symbol = this.normalizeSymbol(rule.pair);
      const priceData = prices.get(symbol);

      if (!priceData) {
        continue;
      }

      // Check if rule condition is met
      const isActivated = rule.activators.some((a) => {
        if (a.side === 'lte') return priceData.price <= parseFloat(a.value);
        if (a.side === 'gte') return priceData.price >= parseFloat(a.value);
        return false;
      });

      if (!isActivated) {
        continue;
      }

      // Find order action
      const action = rule.actions.find(isOrderAction);
      if (!action) {
        continue;
      }

      // Check if we should skip this action (position check)
      const pair = rule.pair;
      const hasOpenPosition = this.positionHistory.has(pair);

      if (action.type === 'buy' && hasOpenPosition) {
        continue;
      }

      if (action.type === 'sell' && !hasOpenPosition) {
        continue;
      }

      // Execute the action
      try {
        const quantity = await this.calculateOrderQuantity(
          rule,
          action,
          quoteCurrency,
          priceData.price,
        );
        if (quantity <= 0) {
          continue;
        }

        const orderPrice =
          action.context.type === 'market'
            ? priceData.price
            : parseFloat(action.context.price);

        let order;
        if (action.context.type === 'market') {
          order = await this.backtestExchangeService.createMarketOrder(
            symbol,
            action.type,
            quantity,
          );
        } else {
          order = await this.backtestExchangeService.createLimitOrder(
            symbol,
            action.type,
            quantity,
            orderPrice,
          );
        }

        // Track position
        if (order.status === 'closed' && order.filled > 0) {
          if (action.type === 'buy') {
            this.positionHistory.set(pair, {
              entryPrice: order.average || orderPrice,
              quantity: order.filled,
              entryTime: timestamp,
            });
          } else if (action.type === 'sell') {
            this.positionHistory.delete(pair);
          }
        }
      } catch (error) {
        this.logger.warn(
          `Failed to execute order for rule ${rule.uid}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Calculate order quantity
   */
  private async calculateOrderQuantity(
    rule: Rule,
    action: Extract<
      import('../rule/rule.types').RuleAction,
      { type: 'buy' | 'sell' }
    >,
    quoteCurrency: string,
    currentPrice: number,
  ): Promise<number> {
    const balance = this.backtestExchangeService.getBalance();
    const symbol = this.normalizeSymbol(rule.pair);
    const [baseAsset] = symbol.split('/');

    if (action.type === 'buy') {
      const quoteBalance = balance[quoteCurrency]?.free || 0;
      const percent = parseFloat(action.context.quantity.value);
      const amountToSpend = (quoteBalance * percent) / 100;
      return amountToSpend / currentPrice;
    } else {
      const baseBalance = balance[baseAsset]?.free || 0;
      const percent = parseFloat(action.context.quantity.value);
      if (percent >= 99) {
        return baseBalance;
      }
      return (baseBalance * percent) / 100;
    }
  }

  /**
   * Calculate current positions from balances and position history
   */
  private async calculatePositions(
    pairs: string[],
    prices: Map<string, { symbol: string; price: number; timestamp: number }>,
    quoteCurrency: string,
  ): Promise<Map<string, BacktestPosition>> {
    const positions = new Map<string, BacktestPosition>();
    const balance = this.backtestExchangeService.getBalance();

    for (const pair of pairs) {
      const symbol = this.normalizeSymbol(pair);
      const [baseAsset] = symbol.split('/');
      const baseBalance = balance[baseAsset]?.free || 0;
      const priceData = prices.get(symbol);

      if (baseBalance > 0 && priceData) {
        const positionInfo = this.positionHistory.get(pair);
        const averagePrice = positionInfo?.entryPrice || priceData.price;
        const currentPrice = priceData.price;
        const quantity = baseBalance;
        const unrealizedPnl = (currentPrice - averagePrice) * quantity;
        const unrealizedPnlPercent =
          ((currentPrice - averagePrice) / averagePrice) * 100;

        positions.set(pair, {
          pair,
          side: 'buy',
          quantity,
          averagePrice,
          currentPrice,
          unrealizedPnl,
          unrealizedPnlPercent,
          openedAt: positionInfo?.entryTime || Date.now(),
        });
      }
    }

    return positions;
  }

  /**
   * Calculate backtest metrics
   */
  private calculateMetrics(
    startBalance: number,
    endBalance: number,
    trades: BacktestTrade[],
    equityCurve: EquityPoint[],
    startDate: Date,
    endDate: Date,
  ): BacktestResult {
    const totalReturn = endBalance - startBalance;
    const totalReturnPercent = (totalReturn / startBalance) * 100;

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);
    const winRate =
      trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    const averageWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) /
          winningTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + t.pnl, 0) /
              losingTrades.length,
          )
        : 0;

    const profitFactor =
      averageLoss > 0
        ? (averageWin * winningTrades.length) /
          (averageLoss * losingTrades.length)
        : winningTrades.length > 0
          ? Infinity
          : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = startBalance;

    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const drawdown = peak - point.equity;
      const drawdownPercent = (drawdown / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    return {
      startDate,
      endDate,
      startBalance,
      endBalance,
      totalReturn,
      totalReturnPercent,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      maxDrawdown,
      maxDrawdownPercent,
      trades,
      positions: [],
      equityCurve,
    };
  }

  /**
   * Convert interval string to milliseconds
   */
  private getIntervalMs(interval: string): number {
    const match = interval.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid interval format: ${interval}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown interval unit: ${unit}`);
    }
  }

  /**
   * Normalize symbol format
   */
  private normalizeSymbol(pair: string): string {
    return pair.replace('-', '/');
  }
}
