// ======================
// Rules

export type MarketType = string;
export type TimeframeType = '1m' | '5m' | '15m' | '30m' | '1h' | '4h';
export type FetchType = 'scalar' | 'series';

export type ActivatorType = 'price' | 'percent';
export type ActivatorSide = 'gte' | 'lte';

export type Activator = {
    type: ActivatorType
    side: ActivatorSide
    value: string
}

export type ActionType = 'buy' | 'sell';
export type ActionBehavior = 'market' | 'limit';

export type ActionQuantity = {
    type: 'fixed' | 'percent'
    value: string
}

export type Action = {
    type: ActionType
    behavior: ActionBehavior
    price: string
    quantity: ActionQuantity
}

export type DeadlineType = 'time';
export type DeadlineAction = 'sellByMarket' | 'buyByMarket';

export type Deadline = {
    type: DeadlineType
    value: string
    action: DeadlineAction
}

export type Rule = {
    uid: string
    active: boolean
    pair: string
    market: MarketType
    timeframe: TimeframeType
    seriesLimit?: number
    fetchType: FetchType
    activators: Activator[]
    actions: Action[]
    deadlines: Deadline[]
}

// ======================
// Markets

// example: BTC-USDT
export type Pair = string

export type PairPrice = {
    pair: Pair,
    price: string
}

export type Candle = {
    open: number
    close: number
    closeTime: number
}

export type CandleGroup = {
    symbol: Pair
    candles: Candle[]
}

export interface MarketClient {
    getPrice(pairs: Pair[]): Promise<PairPrice[]>
    getCandles(pair: Pair, tf: TimeframeType, limit: number): Promise<Candle[]>
    // it's currently not in use
    // getCandleGroup(pairs: Pair[], tf: TimeframeType, limit: number): Promise<CandleGroup[]>
}

export type MarketClients = {
    [key: string]: MarketClient
}

// ======================
// Orders

type OrderQuantity = {
    type: 'fixed' | 'percent'
    value: string
}

export type OrderCreationData = {
    pair: Pair
    market: MarketType
    action: ActionType
    behavior: ActionBehavior
    price: string
    quantity: Quantity
    deadlines: Deadline[]
}