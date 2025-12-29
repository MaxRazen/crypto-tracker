import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RuleRepository } from '../../rule/rule.repository';
import { Rule } from '../../rule/rule.types';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class ApiRulesService {
  private readonly logger = new Logger(ApiRulesService.name);

  constructor(private readonly ruleRepository: RuleRepository) {}

  async create(createRuleDto: CreateRuleDto): Promise<Rule> {
    const rule: Rule = {
      uid: createRuleDto.uid,
      active: createRuleDto.active ?? true,
      pair: createRuleDto.pair,
      market: createRuleDto.market,
      timeframe: createRuleDto.timeframe,
      fetchType: createRuleDto.fetchType,
      activators: createRuleDto.activators,
      actions: createRuleDto.actions,
      deadlines: createRuleDto.deadlines || [],
    };

    await this.ruleRepository.save(rule);
    this.logger.log(`Rule ${rule.uid} created`);
    return rule;
  }

  async findAll(): Promise<Rule[]> {
    return await this.ruleRepository.findAll();
  }

  async findOne(uid: string): Promise<Rule> {
    const rule = await this.ruleRepository.findOne(uid);
    if (!rule) {
      throw new NotFoundException(`Rule with uid ${uid} not found`);
    }
    return rule;
  }

  async findActive(): Promise<Rule[]> {
    return await this.ruleRepository.findActive();
  }

  async update(uid: string, updateRuleDto: UpdateRuleDto): Promise<Rule> {
    const existingRule = await this.ruleRepository.findOne(uid);
    if (!existingRule) {
      throw new NotFoundException(`Rule with uid ${uid} not found`);
    }

    const updatedRule: Rule = {
      ...existingRule,
      ...updateRuleDto,
    };

    await this.ruleRepository.update(uid, updatedRule);
    this.logger.log(`Rule ${uid} updated`);
    return updatedRule;
  }

  async remove(uid: string): Promise<void> {
    const rule = await this.ruleRepository.findOne(uid);
    if (!rule) {
      throw new NotFoundException(`Rule with uid ${uid} not found`);
    }

    await this.ruleRepository.delete(uid);
    this.logger.log(`Rule ${uid} deleted`);
  }
}
