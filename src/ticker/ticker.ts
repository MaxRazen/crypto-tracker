import { OrderManager } from '../order-manager';
import { MarketClients, Rule } from '../types';
import { TickerWorker } from './worker';

const STATUS_COMPLETE = 'complete';

const REJECT_TIMEOUT = 'timeout';
export const REJECT_ERROR = 'error';
export const REJECT_FATAL = 'fatal';

export type RejectReason = {
    type: 'timeout' | 'error' | 'fatal'
    reason?: string
}

type resolver = (value: string | PromiseLike<string>) => void;
type rejector = (reason: RejectReason) => void;

export class UnsupportedClient extends Error {}
export class UnsupportedFetchType extends Error {}

export class Ticker {
    private rules: Rule[]
    private tickTimeout: number
    private clients: MarketClients
    private orderManger: OrderManager
    private interval: NodeJS.Timeout

    constructor(
        rules: Rule[],
        tickTimeout: number,
        clients: MarketClients,
        orderManager: OrderManager,
    ) {
        this.rules = rules;
        this.tickTimeout = Math.max(30, +tickTimeout) * 1000;
        this.clients = clients;
        this.orderManger = orderManager;
        this.validateRules();
    }

    public start() {
        this.interval = setInterval(async () => {
            try {
                const result = await this.tick();
                console.log('tick :: interval ::', result);
            } catch (e) {
                console.error('tick :: interval ::', e);
            }
        }, this.tickTimeout);
    }

    private tick(): Promise<string | RejectReason> {
        return new Promise((resolve: resolver, reject: rejector) => {
            this.handleTick(resolve, reject);

            setTimeout(() => reject({type: REJECT_TIMEOUT}), this.tickTimeout - 1000);
        })
    }

    private async handleTick(resolve: resolver, reject: rejector): Promise<void> {
        const worker = new TickerWorker(this.rules, this.clients, this.orderManger);
        worker.handle();

        resolve(STATUS_COMPLETE);
    }

    private validateRules(): void {
        if (this.rules.length === 0) {
            throw new Error('rules were not passed to Ticker');
        }

        this.rules.forEach((r: Rule) => {
            if (!this.clients[r.market]) {
                throw new UnsupportedClient(`rule ${r.pair}-${r.timeframe} has unsupported market '${r.market}'`);
            }

            if (!['price', 'candles'].includes(r.fetchType)) {
                throw new UnsupportedFetchType(`rule ${r.pair}-${r.timeframe} has unsupported fetch type '${r.market}'`);
            }
        });
    }
}
