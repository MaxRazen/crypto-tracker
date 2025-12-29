import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RuleService } from '../rule/rule.service';
import { Rule } from '../rule/rule.types';
import { OrderService } from '../order/order.service';
import { ExchangeService } from '../exchange/exchange.service';
import { PriceFetcherService } from './price-fetcher.service';
import { PositionRepository } from '../order/position.repository';
import { PositionCooldownRepository } from '../order/position-cooldown.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);
  private readonly DEFAULT_EXCHANGE_ID = 'binance';
  private readonly DEFAULT_COOLDOWN_PERIOD = 300000; // 5 minutes

  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly ruleService: RuleService,
    private readonly orderService: OrderService,
    private readonly priceFetcherService: PriceFetcherService,
    private readonly positionRepository: PositionRepository,
    private readonly positionCooldownRepository: PositionCooldownRepository,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'ticker-tracker',
    waitForCompletion: true,
  })
  async trackTickers() {
    this.logger.debug('Track tickers running');

    try {
      const rules = await this.ruleService.getActiveRules();
      if (!rules.length) {
        this.logger.debug('No rules to process');
        return;
      }

      // Decouple data fetching: fetch all prices first
      const symbols = rules.map((r) => this.normalizeSymbol(r.pair));
      const prices = await this.priceFetcherService.fetchPrices(
        this.DEFAULT_EXCHANGE_ID,
        symbols,
      );

      if (prices.size === 0) {
        this.logger.warn('No prices fetched, skipping rule evaluation');
        return;
      }

      // Evaluate rules against cached prices
      const activatedRules: Rule[] = [];

      for (const rule of rules) {
        const symbol = this.normalizeSymbol(rule.pair);
        const priceData = prices.get(symbol);

        if (!priceData) {
          this.logger.warn(`No price data for symbol: ${symbol}`);
          continue;
        }

        // Check if rule condition is met
        if (!this.checkActivators(rule, priceData.price.toString())) {
          continue;
        }

        // Check if action should be executed
        const action = rule.actions.find(
          (a) => a.side === 'buy' || a.side === 'sell',
        );

        if (!action) {
          continue;
        }

        // Check if we should skip this action
        if (await this.shouldSkipAction(rule.pair, action.side)) {
          this.logger.debug(
            `Skipping action for ${rule.pair} ${action.side} - position exists or in cooldown`,
          );
          continue;
        }

        activatedRules.push(rule);
      }

      if (!activatedRules.length) {
        this.logger.debug('No activated rules');
        return;
      }

      this.logger.log(`${activatedRules.length} rules to be applied`);

      // Apply actions for activated rules
      for (const rule of activatedRules) {
        this.logger.log(`Applying the rule #${rule.uid} ${rule.pair}`);
        await this.applyActions(rule);
      }

      // Sync rules (mark as inactive if needed)
      await this.ruleService.syncRules(activatedRules);
    } catch (e) {
      this.logger.error(e.message, e.stack);
    }

    this.logger.debug('Track tickers finished');
  }

  /**
   * Check if action should be skipped due to existing position or cooldown
   */
  private async shouldSkipAction(
    pair: string,
    actionSide: 'buy' | 'sell',
  ): Promise<boolean> {
    // For buy actions: check if there's already an open position
    if (actionSide === 'buy') {
      const openPosition = await this.positionRepository.findOpenPosition(pair);
      if (openPosition) {
        this.logger.debug(
          `Open position exists for ${pair}, skipping buy action`,
        );
        return true;
      }
    }

    // For sell actions: check if there's an open buy position
    if (actionSide === 'sell') {
      const openPosition = await this.positionRepository.findOpenPosition(pair);
      if (!openPosition || openPosition.side !== 'buy') {
        this.logger.debug(
          `No open buy position for ${pair}, skipping sell action`,
        );
        return true;
      }
    }

    // Check cooldown period
    const inCooldown = await this.positionCooldownRepository.isInCooldown(
      pair,
      actionSide,
      this.DEFAULT_COOLDOWN_PERIOD,
    );

    if (inCooldown) {
      this.logger.debug(
        `Action ${actionSide} for ${pair} is in cooldown period`,
      );
      return true;
    }

    return false;
  }

  checkActivators(rule: Rule, price: string): boolean {
    return rule.activators.some((a) => {
      if (a.side === 'lte') return parseFloat(price) <= parseFloat(a.value);
      if (a.side === 'gte') return parseFloat(price) >= parseFloat(a.value);
      return false;
    });
  }

  async applyActions(rule: Rule) {
    const action = rule.actions.find(
      (a) => a.side === 'buy' || a.side === 'sell',
    );

    if (!action) {
      return;
    }

    // Generate idempotency key (actionId)
    const actionId = randomUUID();

    // Place order with actionId
    await this.orderService.placeOrder({
      uid: rule.uid,
      pair: rule.pair,
      side: action.side,
      type: action.type,
      price: action.price,
      quantity: action.quantity,
      actionId,
    });

    // Update cooldown period
    await this.positionCooldownRepository.updateCooldown(
      rule.pair,
      action.side,
      this.DEFAULT_COOLDOWN_PERIOD,
    );

    // Mark rule as inactive
    rule.active = false;
  }

  /**
   * Normalize symbol format (e.g., BTC-USDT -> BTC/USDT for CCXT)
   */
  private normalizeSymbol(pair: string): string {
    return pair.replace('-', '/');
  }
}
