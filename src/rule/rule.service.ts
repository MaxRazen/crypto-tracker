import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { RuleRepository } from './rule.repository';
import { Rule } from './rule.types';

@Injectable()
export class RuleService {
  private readonly logger = new Logger(RuleService.name);
  private readonly rulesChanged$ = new Subject<void>();

  constructor(private readonly ruleRepository: RuleRepository) {}

  /**
   * Observable that fires whenever rules are mutated (create/update/delete).
   * The rule-engine subscribes here to trigger a hot reload.
   */
  get onRulesChanged$(): Observable<void> {
    return this.rulesChanged$.asObservable();
  }

  async getActiveRules(): Promise<Rule[]> {
    return await this.ruleRepository.findActive();
  }

  async getAllRules(): Promise<Rule[]> {
    return await this.ruleRepository.findAll();
  }

  async getRule(uid: string): Promise<Rule | null> {
    return await this.ruleRepository.findOne(uid);
  }

  async saveRule(rule: Rule): Promise<void> {
    await this.ruleRepository.save(rule);
    this.notifyRulesChanged();
  }

  async updateRule(uid: string, rule: Partial<Rule>): Promise<void> {
    await this.ruleRepository.update(uid, rule as Rule);
    this.notifyRulesChanged();
  }

  async deleteRule(uid: string): Promise<void> {
    await this.ruleRepository.delete(uid);
    this.notifyRulesChanged();
  }

  async syncRules(dirtyRules: Rule[]): Promise<void> {
    const rules = await this.ruleRepository.findAll();

    let isSaveNeeded = false;
    for (const rule of rules) {
      const dirtyRule = dirtyRules.find((r) => r.uid === rule.uid);
      if (!dirtyRule) {
        continue;
      }
      if (rule.active !== dirtyRule.active) {
        rule.active = dirtyRule.active;
        await this.ruleRepository.save(rule);
        isSaveNeeded = true;
      }
    }

    if (isSaveNeeded) {
      this.logger.log('Rules synchronized');
      this.notifyRulesChanged();
    }
  }

  private notifyRulesChanged(): void {
    this.rulesChanged$.next();
  }
}
