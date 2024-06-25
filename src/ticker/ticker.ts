import { OrderManager } from '../order-manager';
import { RuleContainer } from '../rules';
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

// every 5 minutes rules will be refreshed
const RULES_REFRESH_DELAY = 300;

export class Ticker {
    private ruleContainer: RuleContainer
    private clients: MarketClients
    private orderManger: OrderManager
    private tickTimeout: number
    private workerInterval: NodeJS.Timeout
    private containerInterval: NodeJS.Timeout

    constructor(
        ruleContainer: RuleContainer,
        clients: MarketClients,
        orderManager: OrderManager,
        tickTimeout: number,
    ) {
        this.ruleContainer = ruleContainer;
        this.clients = clients;
        this.orderManger = orderManager;
        this.tickTimeout = Math.max(30, +tickTimeout) * 1000;
    }

    public start() {
        this.ruleContainer.load();
        this.validateRules(this.ruleContainer.getAvailable());

        this.workerInterval = setInterval(async () => {
            await this.workerHandler()
        }, this.tickTimeout);

        this.containerInterval = setInterval(async () => {
            await this.containerHandler();
        }, RULES_REFRESH_DELAY * 1000);
    }

    public stop(): void {
        clearInterval(this.workerInterval);
        clearInterval(this.containerInterval);
    }

    private async workerHandler(): Promise<void> {
        try {
            const result = await this.tick();
            console.log('tick :: interval ::', result);
        } catch (e) {
            console.error('tick :: interval ::', e);
        }
    }

    private async containerHandler(): Promise<void> {
        try {
            await this.ruleContainer.reload();
            this.validateRules(this.ruleContainer.getAvailable());
        } catch (e) {
            this.stop();
            throw e;
        }
    }

    private tick(): Promise<string | RejectReason> {
        return new Promise((resolve: resolver, reject: rejector) => {
            this.handleTick(resolve, reject);

            setTimeout(() => reject({type: REJECT_TIMEOUT}), this.tickTimeout - 1000);
        })
    }

    private async handleTick(resolve: resolver, reject: rejector): Promise<void> {
        const worker = new TickerWorker(
            this.ruleContainer.getAvailable(),
            this.clients,
            this.orderManger,
        );
        await worker.handle();

        resolve(STATUS_COMPLETE);
    }

    private validateRules(rules: Rule[]): void {
        if (rules.length === 0) {
            throw new Error('rules were not passed to Ticker');
        }

        rules.forEach((r: Rule) => {
            if (!this.clients[r.market]) {
                throw new Error(`rule ${r.pair}-${r.timeframe} has unsupported market '${r.market}'`);
            }

            if (!['scalar', 'series'].includes(r.fetchType)) {
                throw new Error(`rule ${r.pair}-${r.timeframe} has unsupported fetch type '${r.fetchType}'`);
            }
        });
    }
}
