import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import {
  RuleTriggeredEvent,
  OrderActionEvent,
  RuleActivationEvent,
  NotificationActionEvent,
  MarketUpdateEvent,
} from './event.types';

/**
 * Central event bus.
 *
 * RuleEngineService emits events here; downstream services (OrderService,
 * NotificationService, …) subscribe to the public observables.
 * This keeps the rule-engine decoupled from every consumer.
 */
@Injectable()
export class EventService implements OnModuleDestroy {
  private readonly ruleTriggered$ = new Subject<RuleTriggeredEvent>();
  private readonly orderAction$ = new Subject<OrderActionEvent>();
  private readonly ruleActivation$ = new Subject<RuleActivationEvent>();
  private readonly notificationAction$ = new Subject<NotificationActionEvent>();
  private readonly marketUpdate$ = new Subject<MarketUpdateEvent>();

  onModuleDestroy() {
    this.ruleTriggered$.complete();
    this.orderAction$.complete();
    this.ruleActivation$.complete();
    this.notificationAction$.complete();
    this.marketUpdate$.complete();
  }

  // ─── emit (called by producers) ─────────────────────────

  emitRuleTriggered(event: RuleTriggeredEvent): void {
    this.ruleTriggered$.next(event);
  }

  emitOrderAction(event: OrderActionEvent): void {
    this.orderAction$.next(event);
  }

  emitRuleActivation(event: RuleActivationEvent): void {
    this.ruleActivation$.next(event);
  }

  emitNotificationAction(event: NotificationActionEvent): void {
    this.notificationAction$.next(event);
  }

  emitMarketUpdate(event: MarketUpdateEvent): void {
    this.marketUpdate$.next(event);
  }

  // ─── observe (consumed by subscribers) ──────────────────

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

  get onMarketUpdate$(): Observable<MarketUpdateEvent> {
    return this.marketUpdate$.asObservable();
  }
}
