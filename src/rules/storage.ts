import { Rule, Timestamp } from '../types';
import { LocalDatastore } from '../datastore-local';

export interface RuleStorage {
    fetchAllActive(): Promise<Rule[]>
    updateOrCreate(rule: Rule): Promise<void>
    updateLastCompletedAt(rule: Rule, ts: Timestamp): Promise<void>
}

export class RuleDatastore implements RuleStorage {
    constructor(private readonly ds: LocalDatastore) {
    }

    public async updateOrCreate(rule: Rule): Promise<void> {
        const rwHandler = (data: string): string => {
            const rules = this.desirialize(data);
            const ruleIdx = rules.findIndex((r: Rule) => r.uid === rule.uid);
            if (ruleIdx < 0) {
                rules.push(rule)
            } else {
                rules[ruleIdx] = rule;
            }
            return this.serialize(rules);
        }
        await this.ds.writeTransaction(rwHandler);
    }

    public async fetchAll(): Promise<Rule[]> {
        const data = await this.ds.readAll();
        return this.desirialize(data);
    }

    public async fetchAllActive(): Promise<Rule[]> {
        const rules = await this.fetchAll()
        return rules.filter((r: Rule) => r.active);
    }

    public async updateLastCompletedAt(rule: Rule, ts: Timestamp): Promise<void> {
        const rwHandler = (data: string): string => {
            const rules = this.desirialize(data);
            const updatableRule = rules.find((r: Rule) => r.uid === rule.uid);
            if (!rule) {
                throw new Error(`rule with id '${rule.uid}' is not found`);
            }
            updatableRule.lastCompletedAt = ts;
            return this.serialize(rules);
        }
        await this.ds.writeTransaction(rwHandler);
    }

    private serialize(rules: Rule[]): string {
        return JSON.stringify(rules);
    }

    private desirialize(data: string): Rule[] {
        const rules: Rule[] = JSON.parse(data || '[]');

        if (!Array.isArray(rules)) {
            console.warn('rule/storage: desirialization cannot be completed', data);
            return [];
        }

        return rules;
    }
}
