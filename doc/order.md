# Order Module

Handles the full lifecycle of a trade triggered by the rule engine: from receiving a buy/sell event, placing the order on the exchange, tracking its fill status, and maintaining an open position record.

---

## Concepts

### Order lifecycle

```
Event received → placeOrder() → saved as 'new' → submitOrder() → 'pending'
                                                                      ↓
                                                   cron (every 1 min) trackOrder()
                                                                      ↓
                                               'completed' | 'cancelled' | 'failed'
```

| Status | Meaning |
|--------|---------|
| `new` | Persisted locally, not yet sent to exchange. Only survives a process crash. |
| `pending` | Submitted to exchange, awaiting fill confirmation. |
| `completed` | Exchange confirmed `closed`/`filled`. |
| `cancelled` | Exchange returned `canceled`, `rejected`, or `expired`. |
| `failed` | Could not be submitted (insufficient balance, exchange error). |

### Immediate submit + cron recovery

`placeOrder()` saves to DB then **immediately calls `submitOrder()`** — no waiting for the cron. The cron's job for `new` orders is purely crash recovery: if the process dies between the DB write and the `submitOrder()` call, the cron picks it up on restart.

### Partial fills

`trackOrder()` distinguishes between a partial fill (`status: open`, `filled > 0`) and a completed fill (`status: closed`). Partial fills update `filledQuantity` and keep the order `pending`. Only `closed`/`filled` exchange statuses transition the order to `completed`.

### Positions

A position tracks the currently held asset for a pair. It is created/updated on buy completion and reduced or closed on sell completion.

- **Buy**: creates a new position or updates the average price of an existing one (weighted average).
- **Sell**: if `filledAmount >= position.quantity` → closes the position; if partial → reduces `quantity` in place.

### Quantity calculation

| Side | Balance used | Percent formula |
|------|-------------|-----------------|
| `buy` | Quote asset (e.g. USDT), capped at `ORDER_STAKE` | `(balance / price) * pct` → base units |
| `sell` | Base asset (e.g. SOL) | `balance * pct` → base units directly |

Fixed-type quantity bypasses the formula and uses the literal value.

### Idempotency

Two guards prevent duplicate orders from the same rule action:
1. **`actionId` check** (DB) — `{ruleUid}-{actionType}`, queries active orders.
2. **`uid` check** (in-memory) — `{ruleUid}-{actionType}-{timestamp}`, guards against rapid duplicate events in the same process lifetime.

---

## File tree

```
src/order/
├── order.module.ts              NestJS module — wires providers, imports ExchangeModule
├── order.config.ts              Config: ORDER_STAKE (max USDT per buy, default 1000)
├── order.types.ts               Core Order type and Quantity type
│
├── order.service.ts             ★ Main orchestrator
│                                  - Subscribes to EventService.onOrderAction$
│                                  - placeOrder(): idempotency + immediate submit
│                                  - submitOrder(): calls CCXT via ExchangeService
│                                  - trackOrder(): polls exchange, handles partial fills
│                                  - handleOrderCompletion(): updates positions
│                                  - @Cron(EVERY_MINUTE): recovery + pending tracking
│
├── order.repository.ts          DB access for orders (SQLite via TypeORM)
│                                  - findActive(): loads 'new'+'pending' on startup
│                                  - findActiveByActionId(): idempotency query
│
├── position.repository.ts       DB access for positions
│                                  - findOpenPosition(pair): current open position
│                                  - updatePosition(): average price / quantity update
│                                  - closePosition(): marks isOpen=false with timestamp
│
├── order.service.spec.ts        Unit tests (35 cases) — all deps mocked
│
└── entities/
    ├── order.entity.ts          SQLite table 'orders'
    │                              uid, pair, price, side, type, quantity (json),
    │                              status, externalUid, actionId, filledQuantity,
    │                              placedAt, submittedAt, completedAt, errorMessage
    └── position.entity.ts       SQLite table 'positions'
                                   pair (PK), side, quantity, averagePrice,
                                   orderUid, actionId, openedAt, closedAt, isOpen
```

---

## Key dependencies

| Dependency | Role |
|-----------|------|
| `EventService.onOrderAction$` | RxJS stream — rule engine emits `OrderActionEvent` here |
| `ExchangeService` | CCXT wrapper — `createLimitOrder`, `createMarketOrder`, `getOrder`, `getBalance` |
| `ModeConfig` | Guards — only `live` mode places real orders; `idle`/`plane` log and skip |

---

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `ORDER_STAKE` | `1000` | Max USDT to spend per buy order |
| `MODE` | `idle` | `idle` / `plane` / `live` — controls whether orders are submitted |
