import { readFile, writeFile } from 'node:fs/promises';
import { Injectable, Logger } from '@nestjs/common';
import { Rule } from './rule.types';

@Injectable()
export class RuleService {
  private readonly logger = new Logger(RuleService.name);

  private readonly filepath = 'rules.json';

  async getActiveRules() {
    const rules = await this.loadRules();

    return rules.filter((r) => r.active);
  }

  async syncRules(dirtyRules: Rule[]) {
    const rules = await this.loadRules();

    let isSaveNeeded = false;
    rules.forEach((rule) => {
      const dirtyRule = dirtyRules.find((r) => r.uid === rule.uid);
      if (!dirtyRule) {
        return;
      }
      if (rule.active !== dirtyRule.active) {
        rule.active = dirtyRule.active;
        isSaveNeeded = true;
      }
    });

    if (!isSaveNeeded) {
      return;
    }

    try {
      await writeFile(this.filepath, JSON.stringify(rules, null, 2));
    } catch (e) {
      this.logger.fatal(e.message, e.stack);
    }
  }

  private async loadRules() {
    try {
      const rules = await readFile(this.filepath);
      return this.parseRules(rules.toString());
    } catch (e) {
      this.logger.fatal(e.message, e.stack);
    }
  }

  private parseRules(rawRules: string) {
    const rules = JSON.parse(rawRules) as Array<Rule>;
    if (!Array.isArray(rules)) {
      throw new Error('Loaded rules must be a valid JSON array');
    }
    return rules;
  }
}
