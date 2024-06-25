import { IOrderManager } from '../order-manager';
import { RuleContainer } from '../rules';
import { calculateSeriesChange } from '../trader/calculation';
import { Action, Activator, ActivatorSide, Candle, MarketClients, OrderCreationData, Pair, PairPrice, Rule } from '../types';
import { uniq } from 'lodash-es';

type PromiseJob = () => Promise<void>;

export class TickerWorker {
    constructor(
        private rules: Rule[],
        private clients: MarketClients,
        private orderManager: IOrderManager,
        private ruleContainer: RuleContainer,
    ) {
    }

    public async handle(): Promise<void> {

        const scalarRules: Rule[] = this.rules.filter((r: Rule) => r.fetchType === 'scalar');
        const seriesRules: Rule[] = this.rules.filter((r: Rule) => r.fetchType === 'series');

        const promiseJobs: PromiseJob[] = [];
        
        if (scalarRules.length > 0) {
            promiseJobs.push(() => this.handleScalarRules(scalarRules));
        }
        if (seriesRules.length > 0) {
            promiseJobs.push(() => this.handleSeriesRules(seriesRules))
        }

        if (promiseJobs.length > 0) {
            await Promise.all(promiseJobs.map((job: PromiseJob) => job()));
        }
    }

    private async handleScalarRules(rules: Rule[]): Promise<void> {
        const grouped: {[key: string]: Rule[]} = {};

        rules.forEach((r: Rule) => {
            if (!grouped.hasOwnProperty(r.market)) {
                grouped[r.market] = [];
            }
            grouped[r.market].push(r);
        });

        const grouppedMarkets = Object.keys(grouped);

        const results: PairPrice[][] = await Promise.all(
            grouppedMarkets.map((market: string): Promise<PairPrice[]> => {
                const client = this.clients[market];
                const pairs: Pair[] = grouped[market].map((r: Rule): Pair => r.pair);

                return client.getPrice(uniq(pairs));
            })
        );

        results.forEach((res: PairPrice[], idx: number) => {
            const market = grouppedMarkets[idx];
            const groupRules = grouped[market];

            groupRules.forEach((rule: Rule): void => {
                const pairPrice = res.find((pp: PairPrice) => pp.pair === rule.pair);
                if (!pairPrice) {
                    const availablePairs: string = res.map((pp: PairPrice) => pp.pair).join(',');
                    throw new Error(`pairPrice '${availablePairs}' could not be matched with rule pair ${rule.pair}`);
                }

                this.executeForScalar(rule, pairPrice);
            });
        });
    }

    private async handleSeriesRules(rules: Rule[]): Promise<void> {
        const results: Candle[][] = await Promise.all(
            rules.map((rule: Rule): Promise<Candle[]> => {
                const client = this.clients[rule.market];

                return client.getCandles(rule.pair, rule.timeframe, rule.seriesLimit);
            })
        );

        results.forEach((candles: Candle[], idx: number) => {
            const rule: Rule = rules[idx];

            this.executeForSeries(rule, candles);
        });
    }

    private executeForScalar(rule: Rule, pairPrice: PairPrice): void {
        rule.activators.forEach((act: Activator): void => {
            if (this.isActivatorExecuted(+pairPrice.price, +act.value, act.side)) {
                this.performActions(rule);
            }
        });
    }

    private executeForSeries(rule: Rule, candles: Candle[]): void {
        const seriesChange = calculateSeriesChange(candles);

        rule.activators.forEach((act: Activator): void => {
            if (this.isActivatorExecuted(seriesChange, +act.value, act.side)) {
                this.performActions(rule);
            }
        });
    }

    private isActivatorExecuted(currentValue: number, targetValue: number, side: ActivatorSide): boolean {
        switch (side) {
            case 'gte':
                return currentValue >= targetValue;
            case 'lte':
                return currentValue <= targetValue;
            default:
                throw new Error(`activator side is unsupporter '${side}'`);
        }
    }

    private performActions(rule: Rule) {
        rule.actions.forEach((action: Action) => {
            const orderCreateData: OrderCreationData = {
                pair: rule.pair,
                market: rule.market,
                action: action.type,
                behavior: action.behavior,
                price: action.price,
                quantity: action.quantity,
                deadlines: rule.deadlines,
            };
            this.orderManager.createOrder(orderCreateData);
        });

        this.ruleContainer.markAsCompleted(rule.uid);
    }
}
