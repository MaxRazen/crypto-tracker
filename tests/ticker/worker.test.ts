import { assert } from 'chai';
import { describe, it } from 'mocha';
import { cloneDeep } from 'lodash-es';
import { TickerWorker } from '../../src/ticker/worker';
import { IOrderManager } from '../../src/order-manager';
import { Candle, MarketClient, MarketClients, OrderCreationData, PairPrice, Rule, TimeframeType } from '../../src/types';
import jsonCandles from '../stub/candles.grow.json';

class OrderManagerStub implements IOrderManager {
    constructor(private assertCallback: (data: any) => void) {
    }

    public async createOrder(orderCreateData: any): Promise<void> {
        this.assertCallback(orderCreateData);
    }
}

class DummyMarketClient implements MarketClient {
    private prices: PairPrice[] = [];
    private candles: Candle[] = [];
    constructor(private assertCallback: (data: any) => void) {
    }

    public async getPrice(pairs: string[]): Promise<PairPrice[]> {
        const result = this.prices.length ? this.prices : [{
            pair: 'BTC-USDT',
            price: '128.0',
        }];
        this.assertCallback(result);

        return result;
    }

    public async getCandles(pair: string, tf: TimeframeType, limit: number): Promise<Candle[]> {
        const result = this.candles.length ? this.candles : jsonCandles;
        this.assertCallback(result);

        return result;
    }

    public setPrices(prices: PairPrice[]) {
        this.prices = prices;
    }

    public setCandles(candles: Candle[]) {
        this.candles = candles;
    }
}

const rule: Rule = {
    uid: '1001',
    active: true,
    market: 'dummy',
    pair: 'BTC-USDT',
    timeframe: '15m',
    fetchType: 'scalar',
    activators: [{
        type: 'price',
        side: 'gte',
        value: '126.99'
    }],
    actions: [{
        type: 'buy',
        behavior: 'limit',
        price: '128.5',
        quantity: {
            type: 'percent',
            value: '100'
        },
    }],
    deadlines: [],
}

describe('ticker/worker module', () => {
    it('test fetchType: scalar', async () => {
        const orderManager = new OrderManagerStub((data: OrderCreationData) => {
            assert.equal(data, {
                pair: rule.pair,
                market: rule.market,
                action: rule.actions[0].type,
                behavior: rule.actions[0].behavior,
                price: rule.actions[0].price,
                quantity: rule.actions[0].quantity,
                deadlines: rule.deadlines,
            })
        });
        const clients: MarketClients = {
            [rule.market]: new DummyMarketClient(() => {
                assert.isTrue(true);
            })
        }

        const worker = new TickerWorker([rule], clients, orderManager);

        await worker.handle();
    })
    ,
    it('test fetchType: series', () => {
        const orderManager = new OrderManagerStub((data: OrderCreationData) => {
            assert.equal(data, {
                pair: rule.pair,
                market: rule.market,
                action: 'sell',
                behavior: rule.actions[0].behavior,
                price: rule.actions[0].price,
                quantity: rule.actions[0].quantity,
                deadlines: rule.deadlines,
            })
        });
        const client: DummyMarketClient = new DummyMarketClient(() => {
            assert.isTrue(true);
        });
        client.setCandles(jsonCandles.reverse());

        const clients: MarketClients = {
            [rule.market]: client,
        }

        const customRule: Rule = cloneDeep(rule);
        customRule.fetchType = 'series';
        customRule.actions[0].type = 'sell';
        customRule.seriesLimit = 5;
        customRule.activators = [{
            type: 'percent',
            side: 'lte',
            value: '3',
        }];

        const worker = new TickerWorker([customRule], clients, orderManager);

        worker.handle();
    })
});
