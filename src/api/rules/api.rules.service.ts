import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RuleService } from '../../rule/rule.service';
import { Rule } from '../../rule/rule.types';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleDto } from './dto/rule.dto';

@Injectable()
export class ApiRulesService {
  private readonly logger = new Logger(ApiRulesService.name);

  constructor(private readonly ruleService: RuleService) {}

  async create(createRuleDto: CreateRuleDto): Promise<Rule> {
    const rule: Rule = {
      uid: createRuleDto.uid,
      active: createRuleDto.active ?? false,
      pair: createRuleDto.pair,
      market: createRuleDto.market,
      fetchType: createRuleDto.fetchType ?? 'ws',
      activators: createRuleDto.activators,
      actions: createRuleDto.actions,
      activatedAt: null,
      deadlines: createRuleDto.deadlines || [],
    };

    await this.ruleService.saveRule(rule);
    this.logger.log(`Rule ${rule.uid} created`);
    return rule;
  }

  async findAll(): Promise<RuleDto[]> {
    const rules = await this.ruleService.getAllRules();

    return rules.map((x) => {
      return {
        ...x,
        status: x.active ? 'active' : x.activatedAt ? 'activated' : 'inactive',
      } as RuleDto;
    });
  }

  async findOne(uid: string): Promise<Rule> {
    const rule = await this.ruleService.getRule(uid);
    if (!rule) {
      throw new NotFoundException(`Rule with uid ${uid} not found`);
    }
    return rule;
  }

  async findActive(): Promise<Rule[]> {
    return await this.ruleService.getActiveRules();
  }

  async update(uid: string, updateRuleDto: UpdateRuleDto): Promise<Rule> {
    const existingRule = await this.ruleService.getRule(uid);
    if (!existingRule) {
      throw new NotFoundException(`Rule with uid ${uid} not found`);
    }

    const updatedRule: Rule = {
      ...existingRule,
      ...updateRuleDto,
    };

    await this.ruleService.updateRule(uid, updatedRule);
    this.logger.log(`Rule ${uid} updated`);
    return updatedRule;
  }

  async remove(uid: string): Promise<void> {
    const rule = await this.ruleService.getRule(uid);
    if (!rule) {
      throw new NotFoundException(`Rule with uid ${uid} not found`);
    }

    await this.ruleService.deleteRule(uid);
    this.logger.log(`Rule ${uid} deleted`);
  }
}
