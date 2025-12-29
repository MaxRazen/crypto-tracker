import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleEntity } from './rule.entity';
import { Rule } from './rule.types';

@Injectable()
export class RuleRepository {
  constructor(
    @InjectRepository(RuleEntity)
    private readonly repository: Repository<RuleEntity>,
  ) {}

  async findAll(): Promise<Rule[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => this.entityToRule(entity));
  }

  async findActive(): Promise<Rule[]> {
    const entities = await this.repository.find({
      where: { active: true },
    });
    return entities.map((entity) => this.entityToRule(entity));
  }

  async findOne(uid: string): Promise<Rule | null> {
    const entity = await this.repository.findOne({ where: { uid } });
    return entity ? this.entityToRule(entity) : null;
  }

  async save(rule: Rule): Promise<void> {
    const entityData = this.ruleToEntity(rule);
    const entity = this.repository.create(entityData);
    await this.repository.save(entity);
  }

  async update(uid: string, rule: Partial<Rule>): Promise<void> {
    const entityData = this.ruleToEntity(rule as Rule);
    await this.repository.update({ uid }, entityData);
  }

  async delete(uid: string): Promise<void> {
    await this.repository.delete({ uid });
  }

  private ruleToEntity(rule: Rule): Partial<RuleEntity> {
    return {
      uid: rule.uid,
      active: rule.active,
      pair: rule.pair,
      market: rule.market,
      timeframe: rule.timeframe,
      fetchType: rule.fetchType,
      activators: rule.activators,
      actions: rule.actions,
      deadlines: JSON.stringify(rule.deadlines || []),
    };
  }

  private entityToRule(entity: RuleEntity): Rule {
    return {
      uid: entity.uid,
      active: entity.active,
      pair: entity.pair,
      market: entity.market,
      timeframe: entity.timeframe,
      fetchType: entity.fetchType,
      activators: entity.activators,
      actions: entity.actions,
      deadlines:
        typeof entity.deadlines === 'string'
          ? JSON.parse(entity.deadlines)
          : [],
    };
  }
}
