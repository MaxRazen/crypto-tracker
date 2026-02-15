import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, Subscription } from 'rxjs';
import {
  KlineEvent,
  SubscriptionInfo,
  buildKlineStreamName,
} from './data-provider.types';
import { BinanceWsService } from './binance-ws.service';
import { MarketDataService } from './market-data.service';

/**
 * DataProviderService manages exchange data streams.
 *
 * It is agnostic of rules — consumers (rule-engine) tell it what symbols
 * and timeframes to subscribe to, and it delivers market data via an
 * Observable bus.
 *
 * Responsibilities:
 *   - Seed historical candle data via CCXT REST.
 *   - Maintain a Binance WebSocket connection for live kline streams.
 *   - Emit KlineEvents on the in-memory bus for each tick.
 *   - Expose market data access (candles, prices) via MarketDataService.
 */
@Injectable()
export class DataProviderService implements OnModuleDestroy {
  private readonly logger = new Logger(DataProviderService.name);

  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private wsSub: Subscription | null = null;
  private readonly marketUpdate$ = new Subject<KlineEvent>();

  constructor(
    private readonly binanceWsService: BinanceWsService,
    private readonly marketDataService: MarketDataService,
  ) {}

  onModuleDestroy() {
    this.teardown();
    this.marketUpdate$.complete();
  }

  /**
   * Initialize data streams for the given subscriptions.
   * Seeds historical data then connects the WebSocket pipeline.
   */
  async initialize(subscriptions: SubscriptionInfo[]): Promise<void> {
    this.subscriptions.clear();
    for (const sub of subscriptions) {
      this.subscriptions.set(sub.pair, sub);
    }

    this.logSubscriptions();
    await this.seedAllHistoricalData();
    this.connectWebSocket();
  }

  /**
   * Tear down current streams and re-initialize with new subscriptions.
   * Called by rule-engine on hot reload.
   */
  async reinitialize(subscriptions: SubscriptionInfo[]): Promise<void> {
    this.logger.log('Re-initializing data provider...');
    this.teardown();
    await this.initialize(subscriptions);
  }

  /**
   * Observable of all market ticks across all subscribed streams.
   */
  get onMarketUpdate$(): Observable<KlineEvent> {
    return this.marketUpdate$.asObservable();
  }

  // ─── private ─────────────────────────────────────────────

  private teardown(): void {
    this.wsSub?.unsubscribe();
    this.wsSub = null;
  }

  private async seedAllHistoricalData(): Promise<void> {
    const tasks: Promise<void>[] = [];

    for (const sub of this.subscriptions.values()) {
      for (const [timeframe, limit] of sub.requiredCandles.entries()) {
        tasks.push(
          this.marketDataService.seedHistoricalData(
            sub.pair,
            sub.wsSymbol,
            timeframe,
            limit,
          ),
        );
      }
    }

    const results = await Promise.allSettled(tasks);
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length}/${results.length} historical data seeds failed`,
      );
    }
  }

  private connectWebSocket(): void {
    const streams: string[] = [];

    for (const sub of this.subscriptions.values()) {
      for (const timeframe of sub.timeframes) {
        streams.push(buildKlineStreamName(sub.wsSymbol, timeframe));
      }
    }

    if (streams.length === 0) {
      this.logger.warn('No streams to subscribe to');
      return;
    }

    const kline$ = this.binanceWsService.subscribe(streams);

    this.wsSub = kline$.subscribe({
      next: (event) => {
        this.marketDataService.updateCandle(
          event.wsSymbol,
          event.timeframe,
          event.candle,
        );
        this.marketUpdate$.next(event);
      },
      error: (err) => {
        this.logger.error(`Kline stream error: ${err.message}`, err.stack);
      },
    });

    this.logger.log(`WebSocket pipeline active — ${streams.length} streams`);
  }

  private logSubscriptions(): void {
    for (const sub of this.subscriptions.values()) {
      const tfs = Array.from(sub.timeframes).join(', ');
      this.logger.log(`  ${sub.pair} → [${tfs}]`);
    }
  }
}
