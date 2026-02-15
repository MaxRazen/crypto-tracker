# Cryptocurrency tracker

## Roadmap

- [x] Ticker & worker implementation
- [x] Order manager integration
- [ ] Enhance logging & tracing functionality
- [ ] Rules API (CRUD endpoints, rule validation)
- [ ] Basic WebUI to manage the rules
- [ ] WebUI Authentication
- [ ] Notification service integration
- [ ] Broadcast logs onto WebUI


-----

thoughs

```
rule (db entity)
	- uid [int 6 digit]
	- active [bool] - rule engine only picks up the active rule. inactive rule are bounced
	- activatedAt [timestamp, nullable] - populated once the rule activated
	- pair [string] - the symbol of the crypto currency (e.g. SOL-USDT)
	- market [string] - the exchange name (e.g. binance)
	- frequency [int] - seconds delay to match the activators
	- activators_operator [enum: AND, OR]
	- activators [json] - the list of conditions which need to be matched to apply the actions
		Array<
			type: 'price' | string, // symbol price or indicator name
			side: 'lte' | 'gte',
			value: string,
			timeframe: 1m | 3m | 5m | 12m | 15m | 30m | 1h | 4h | 1d,
			
		}>
	- actions [json] - the list of actions applied once the activators 
		Array<{
			type: 'activate' | 'deactivate' | 'buy' | 'sell' | 'notification' | 'alert'
			context: <
				'activate' | 'deactivated' => {ruleUid: string}
				'buy' | 'sell' => {
					type: 'limit' | 'market',
					price: string,
					quantity: {
						type: 'fixed' | 'percent',
						value: string
					}
				}
				'notification' | 'alert' => { channel: 'telegram' }
			>
		}>
	- deadlines
```

## Architecture

```mermaid
graph TD
    subgraph API["API Module"]
        REST["REST Endpoints<br/><small>CRUD rules, orders, backtest</small>"]
    end

    subgraph RM["Rule Module"]
        RS["RuleService"]
        RR["RuleRepository"]
        DB[(SQLite)]
        RS --> RR --> DB
    end

    subgraph DP["Data Provider Module"]
        BWS["BinanceWsService<br/><small>WebSocket kline streams</small>"]
        MDS["MarketDataService<br/><small>candle buffers + historical seed</small>"]
        IND["IndicatorService<br/><small>TA-Lib: SMA, EMA, RSI ...</small>"]
        DPS["DataProviderService<br/><small>orchestrates WS + seeding</small>"]
        BWS -- "KlineEvent" --> DPS
        DPS --> MDS
    end

    subgraph RE["Rule Engine Module"]
        RES["RuleEngineService<br/><small>evaluate activators,<br/>dispatch actions</small>"]
    end

    subgraph OM["Order Module"]
        OS["OrderService<br/><small>place & track orders</small>"]
    end

    subgraph NM["Notification Module<br/><small>(future)</small>"]
        NS["NotificationService"]
    end

    REST -- "rules CRUD" --> RS
    RS -- "onRulesChanged$<br/><small>hot reload</small>" --> RES
    RES -- "initialize() /<br/>reinitialize()" --> DPS
    DPS -- "onMarketUpdate$" --> RES
    RES -- "getClosedCandles()" --> MDS
    RES -- "calculate()" --> IND

    RES -- "onOrderAction$<br/><small>buy / sell</small>" --> OS
    RES -- "onRuleActivation$<br/><small>activate / deactivate</small>" --> RS
    RES -- "onNotificationAction$<br/><small>alert / notification</small>" --> NS

    BINANCE["Binance Exchange"] -- "WSS kline streams" --> BWS
    BINANCE -- "REST fetchOHLCV" --> MDS

    style API fill:#e8f4fd,stroke:#4a90d9
    style RM fill:#fdf2e8,stroke:#d9944a
    style DP fill:#e8fde8,stroke:#4ad94a
    style RE fill:#fde8f4,stroke:#d94a90
    style OM fill:#f4e8fd,stroke:#904ad9
    style NM fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
```

### Data pipeline

```mermaid
sequenceDiagram
    participant Binance
    participant WS as BinanceWsService
    participant MD as MarketDataService
    participant DP as DataProviderService
    participant RE as RuleEngineService
    participant IND as IndicatorService
    participant ORD as OrderService
    participant RULE as RuleService

    Note over RE: onModuleInit
    RE->>RULE: getActiveRules()
    RULE-->>RE: Rule[]
    RE->>DP: initialize(subscriptions)
    DP->>MD: seedHistoricalData() via CCXT REST
    DP->>WS: subscribe(streams)
    WS->>Binance: WSS connect

    loop Every kline tick
        Binance->>WS: kline payload
        WS->>DP: KlineEvent
        DP->>MD: updateCandle()
        DP->>RE: onMarketUpdate$ next
        RE->>MD: getClosedCandles()
        RE->>IND: calculate("sma(25)", candles)
        IND-->>RE: indicator value
        Note over RE: evaluate activators (AND)
        alt All activators match
            RE->>RULE: updateRule(uid, active:false)
            RE->>ORD: onOrderAction$ (buy/sell)
            RE->>RULE: onRuleActivation$ (activate/deactivate)
        end
    end

    Note over RULE: API mutates a rule
    RULE->>RE: onRulesChanged$
    RE->>DP: reinitialize(subscriptions)
```