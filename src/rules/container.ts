import { Rule, Timestamp } from '../types';
import { now } from '../utils';
import { RuleStorage } from './storage';

export class RuleContainer {
    private rules: Rule[] = [];

    constructor(
        private storage: RuleStorage,
        private activationDelay: number,
    ) {
    }

    public async load(): Promise<void> {
        this.rules = await this.storage.fetchAllActive();
    }

    public async reload(): Promise<void> {
        await this.load();
    }

    public getAvailable(): Rule[] {
        const ts: Timestamp = now();

        return this.rules.filter((rule: Rule) => {
            return rule.active && (!rule.lastCompletedAt || rule.lastCompletedAt + this.activationDelay < ts)
        })
    }

    public async markAsCompleted(ruleId: string): Promise<void> {
        const ts: Timestamp = now();
        const rule: Rule | null = this.rules.find((r: Rule) => r.uid === ruleId);

        if (!rule) return;

        rule.lastCompletedAt = ts;
        await this.storage.updateLastCompletedAt(rule, ts);
    }
}
