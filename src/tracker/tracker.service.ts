import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BinanceService } from '../binance/binance.service';
import { RuleService } from '../rule/rule.service';
import { Rule } from '../rule/rule.types';
import { OrderService } from '../order/order.service';

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  constructor(
    private binanceService: BinanceService,
    private ruleService: RuleService,
    private orderService: OrderService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
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

      const prices = await this.binanceService.tickerPrice(
        rules.map((t) => t.pair),
      );

      const activated = rules.filter((r) => {
        const symbolPrice = prices.find(
          (p) => p.symbol === this.binanceService.sanitizeSymbol(r.pair),
        );
        if (symbolPrice) {
          return this.checkActivators(r, symbolPrice.price);
        }
        return false;
      });

      if (!activated.length) {
        this.logger.debug('Track tickers fished');
        return;
      }

      this.logger.log(`${activated.length} rules to be applied`);

      for (const rule of activated) {
        this.logger.log(`Applying the rule #${rule.uid} ${rule.pair}`);
        await this.applyActions(rule);
      }

      await this.ruleService.syncRules(activated);
    } catch (e) {
      this.logger.error(e.message, e.stack);
    }

    this.logger.debug('Track tickers fished');
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

    if (action) {
      this.orderService.placeOrder({
        uid: rule.uid,
        pair: rule.pair,
        side: action.side,
        type: action.type,
        price: action.price,
        quantity: action.quantity,
      });

      rule.active = false;
    }
  }
}
