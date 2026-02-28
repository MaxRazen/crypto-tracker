import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Subject, Observable, Subscription, debounceTime } from 'rxjs';
import modeConfig, { ModeConfig } from '../config/mode.config';
import {
  Rule,
  RuleActivator,
  isOrderAction,
  isRuleActivationAction,
  isNotificationAction,
  RuleAction,
} from '../rule/rule.types';
import { RuleService } from '../rule/rule.service';
import { DataProviderService } from '../data-provider/data-provider.service';
import { MarketDataService } from '../data-provider/market-data.service';
import { IndicatorService } from '../data-provider/indicator.service';
import {
  SubscriptionInfo,
  pairToWsSymbol,
} from '../data-provider/data-provider.types';
import {
  ActivatorEvaluation,
  RuleTriggeredEvent,
  OrderActionEvent,
  RuleActivationEvent,
  NotificationActionEvent,
} from './rule-engine.types';

/**
 * RuleEngineService is the central orchestrator that bridges data and rules.
 *
 * Responsibilities:
 *   1. Load active rules and configure the data-provider subscriptions.
 *   2. Listen to market updates and evaluate rule activators per tick.
 *   3. When a rule triggers, dispatch its actions to the appropriate buses:
 *      - buy/sell        → orderAction$
 *      - activate/deact  → ruleActivation$
 *      - notification    → notificationAction$
 *   4. React to rule hot-reload events from RuleService.
 */
@Injectable()
export class RuleEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RuleEngineService.name);
  private readonly MIN_SEED_CANDLES = 50;

  /** Rules indexed by wsSymbol for O(1) lookup per tick */
  private rulesBySymbol: Map<string, Rule[]> = new Map();

  private marketSub: Subscription | null = null;
  private ruleChangeSub: Subscription | null = null;

  // ─── action buses ────────────────────────────────────────

  private readonly ruleTriggered$ = new Subject<RuleTriggeredEvent>();
  private readonly orderAction$ = new Subject<OrderActionEvent>();
  private readonly ruleActivation$ = new Subject<RuleActivationEvent>();
  private readonly notificationAction$ = new Subject<NotificationActionEvent>();

  constructor(
    private readonly ruleService: RuleService,
    private readonly dataProviderService: DataProviderService,
    private readonly marketDataService: MarketDataService,
    private readonly indicatorService: IndicatorService,
    @Inject(modeConfig.KEY)
    private readonly modeConfig: ModeConfig,
  ) {}

  async onModuleInit() {
    try {
      await this.initialize();
    } catch (error) {
      this.logger.error(
        `Failed to initialize rule engine: ${error.message}`,
        error.stack,
      );
    }

    // Hot-reload: debounce rapid consecutive changes (e.g. rule trigger + activation
    // action both fire onRulesChanged$ in the same tick) into a single reload.
    this.ruleChangeSub = this.ruleService.onRulesChanged$
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.reload().catch((err) =>
          this.logger.error(`Hot-reload failed: ${err.message}`, err.stack),
        );
      });
  }

  onModuleDestroy() {
    this.marketSub?.unsubscribe();
    this.ruleChangeSub?.unsubscribe();
    this.ruleTriggered$.complete();
    this.orderAction$.complete();
    this.ruleActivation$.complete();
    this.notificationAction$.complete();
  }

  // ─── public observables (consumers subscribe here) ──────

  get onRuleTriggered$(): Observable<RuleTriggeredEvent> {
    return this.ruleTriggered$.asObservable();
  }

  get onOrderAction$(): Observable<OrderActionEvent> {
    return this.orderAction$.asObservable();
  }

  get onRuleActivation$(): Observable<RuleActivationEvent> {
    return this.ruleActivation$.asObservable();
  }

  get onNotificationAction$(): Observable<NotificationActionEvent> {
    return this.notificationAction$.asObservable();
  }

  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [symbol, rules] of this.rulesBySymbol.entries()) {
      stats[symbol] = rules.filter((r) => r.active).length;
    }
    return stats;
  }

  // ─── lifecycle ───────────────────────────────────────────

  private async initialize(): Promise<void> {
    if (this.modeConfig.isIdleMode) {
      return;
    }

    const rules = await this.ruleService.getActiveRules();
    if (rules.length === 0) {
      this.logger.warn('No active rules — rule engine idle');
      return;
    }

    this.logger.log(`Loaded ${rules.length} active rules`);

    // Build subscriptions and configure data provider
    const subscriptions = this.buildSubscriptions(rules);
    await this.dataProviderService.initialize(subscriptions);

    // Index rules in memory
    this.loadRules(rules);

    // Wire market updates → evaluation pipeline
    this.wireMarketUpdates();
  }

  private async reload(): Promise<void> {
    if (this.modeConfig.isIdleMode) {
      return;
    }

    this.logger.log('Hot-reloading rules...');
    this.marketSub?.unsubscribe();
    this.marketSub = null;

    const rules = await this.ruleService.getActiveRules();
    if (rules.length === 0) {
      this.logger.warn('No active rules after reload — engine idle');
      this.rulesBySymbol.clear();
      await this.dataProviderService.reinitialize([]);
      return;
    }

    const subscriptions = this.buildSubscriptions(rules);
    await this.dataProviderService.reinitialize(subscriptions);
    this.loadRules(rules);
    this.wireMarketUpdates();

    this.logger.log(`Hot-reload complete — ${rules.length} active rules`);
  }

  // ─── subscription building ──────────────────────────────

  private buildSubscriptions(rules: Rule[]): SubscriptionInfo[] {
    const map = new Map<string, SubscriptionInfo>();

    for (const rule of rules) {
      const pair = rule.pair;
      const wsSymbol = pairToWsSymbol(pair);

      if (!map.has(pair)) {
        map.set(pair, {
          pair,
          wsSymbol,
          ccxtSymbol: pair.replace('-', '/'),
          timeframes: new Set<string>(),
          requiredCandles: new Map<string, number>(),
        });
      }

      const sub = map.get(pair)!;

      for (const activator of rule.activators) {
        const timeframe = activator.timeframe || rule.timeframe;
        sub.timeframes.add(timeframe);

        const needed = Math.max(
          this.indicatorService.getRequiredCandleCount(activator.type),
          this.MIN_SEED_CANDLES,
        );
        const current = sub.requiredCandles.get(timeframe) || 0;
        sub.requiredCandles.set(timeframe, Math.max(current, needed));
      }
    }

    return Array.from(map.values());
  }

  // ─── rule loading ───────────────────────────────────────

  private loadRules(rules: Rule[]): void {
    this.rulesBySymbol.clear();

    for (const rule of rules) {
      if (!rule.active) continue;

      const wsSymbol = pairToWsSymbol(rule.pair);
      const bucket = this.rulesBySymbol.get(wsSymbol) || [];
      bucket.push(rule);
      this.rulesBySymbol.set(wsSymbol, bucket);
    }

    const totalActive = rules.filter((r) => r.active).length;
    this.logger.log(
      `Indexed ${totalActive} active rules across ${this.rulesBySymbol.size} symbols`,
    );
  }

  // ─── market wiring ─────────────────────────────────────

  private wireMarketUpdates(): void {
    this.marketSub = this.dataProviderService.onMarketUpdate$.subscribe({
      next: (event) => {
        this.evaluateSymbol(event.wsSymbol, event.candle.timestamp);
      },
      error: (err) => {
        this.logger.error(`Market stream error: ${err.message}`, err.stack);
      },
    });
  }

  // ─── rule evaluation ───────────────────────────────────

  private evaluateSymbol(wsSymbol: string, timestamp: number): void {
    if (this.modeConfig.isIdleMode) {
      return;
    }

    this.logger.debug(`Evaluating symbol: ${wsSymbol} at ${timestamp}`);

    const rules = this.rulesBySymbol.get(wsSymbol);
    if (!rules || rules.length === 0) return;

    const currentPrice = this.marketDataService.getCurrentPrice(wsSymbol);
    if (currentPrice === undefined) return;

    for (const rule of rules) {
      if (!rule.active) continue;

      const evaluations = this.evaluateAllActivators(
        rule,
        wsSymbol,
        currentPrice,
      );
      const allMatch = evaluations.every((e) => e.matched);

      if (allMatch) {
        // One-shot: deactivate in cache immediately
        rule.active = false;

        this.logger.log(
          `Rule ${rule.uid} triggered for ${rule.pair} @ ${currentPrice}`,
        );

        const event: RuleTriggeredEvent = {
          rule,
          evaluations,
          price: currentPrice,
          timestamp,
        };

        this.ruleTriggered$.next(event);

        // Persist deactivation
        this.ruleService
          .updateRule(rule.uid, { active: false })
          .catch((err) =>
            this.logger.error(
              `Failed to deactivate rule ${rule.uid}: ${err.message}`,
            ),
          );

        // Dispatch all actions
        this.dispatchActions(rule, currentPrice, timestamp);
      }
    }
  }

  private evaluateAllActivators(
    rule: Rule,
    wsSymbol: string,
    currentPrice: number,
  ): ActivatorEvaluation[] {
    return rule.activators.map((activator) => {
      const timeframe = activator.timeframe || rule.timeframe;
      return this.evaluateActivator(
        activator,
        wsSymbol,
        timeframe,
        currentPrice,
      );
    });
  }

  private evaluateActivator(
    activator: RuleActivator,
    wsSymbol: string,
    timeframe: string,
    currentPrice: number,
  ): ActivatorEvaluation {
    const { name } = this.indicatorService.parseActivatorType(activator.type);
    const targetValue = parseFloat(activator.value);
    let computedValue: number;

    if (name === 'price') {
      computedValue = currentPrice;
    } else {
      const candles = this.marketDataService.getClosedCandles(
        wsSymbol,
        timeframe,
      );
      const result = this.indicatorService.calculate(activator.type, candles);
      if (result === null) {
        return {
          type: activator.type,
          timeframe,
          side: activator.side,
          computedValue: NaN,
          targetValue,
          matched: false,
        };
      }
      computedValue = result;
    }

    let matched = false;
    if (activator.side === 'lte') matched = computedValue <= targetValue;
    if (activator.side === 'gte') matched = computedValue >= targetValue;

    return {
      type: activator.type,
      timeframe,
      side: activator.side,
      computedValue,
      targetValue,
      matched,
    };
  }

  // ─── action dispatching ─────────────────────────────────

  private dispatchActions(rule: Rule, price: number, timestamp: number): void {
    if (this.modeConfig.isIdleMode) {
      return;
    }
    for (const action of rule.actions) {
      if (isOrderAction(action)) {
        this.orderAction$.next({ rule, action, price, timestamp });
      } else if (isRuleActivationAction(action)) {
        this.ruleActivation$.next({ rule, action, timestamp });
        this.handleRuleActivation(action);
      } else if (isNotificationAction(action)) {
        this.notificationAction$.next({ rule, action, price, timestamp });
      }
    }
  }

  /**
   * Handle activate/deactivate actions inline: toggle the target rule.
   */
  private handleRuleActivation(
    action: Extract<
      RuleAction,
      { type: 'activate' | 'deactivate' }
    >,
  ): void {
    const targetUid = action.context.ruleUid;
    const activate = action.type === 'activate';

    this.ruleService
      .updateRule(targetUid, { active: activate })
      .then(() =>
        this.logger.log(
          `Rule ${targetUid} ${activate ? 'activated' : 'deactivated'} by action`,
        ),
      )
      .catch((err) =>
        this.logger.error(
          `Failed to ${action.type} rule ${targetUid}: ${err.message}`,
        ),
      );
  }
}
