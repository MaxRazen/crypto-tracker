import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionCooldownEntity } from './position-cooldown.entity';

export interface PositionCooldown {
  pair: string;
  actionType: 'buy' | 'sell';
  lastActionAt: number;
  cooldownPeriod: number;
}

@Injectable()
export class PositionCooldownRepository {
  constructor(
    @InjectRepository(PositionCooldownEntity)
    private readonly repository: Repository<PositionCooldownEntity>,
  ) {}

  async findCooldown(
    pair: string,
    actionType: 'buy' | 'sell',
  ): Promise<PositionCooldown | null> {
    const entity = await this.repository.findOne({
      where: { pair, actionType },
    });
    return entity ? this.entityToCooldown(entity) : null;
  }

  async isInCooldown(
    pair: string,
    actionType: 'buy' | 'sell',
    cooldownPeriod?: number,
  ): Promise<boolean> {
    const cooldown = await this.findCooldown(pair, actionType);
    if (!cooldown) {
      return false;
    }

    const period = cooldownPeriod || cooldown.cooldownPeriod;
    const now = Date.now();
    return now - cooldown.lastActionAt < period;
  }

  async updateCooldown(
    pair: string,
    actionType: 'buy' | 'sell',
    cooldownPeriod: number = 300000, // Default 5 minutes
  ): Promise<void> {
    const now = Date.now();
    const existing = await this.repository.findOne({
      where: { pair, actionType },
    });

    if (existing) {
      await this.repository.update(
        { pair, actionType },
        { lastActionAt: now, cooldownPeriod },
      );
    } else {
      const entity = this.repository.create({
        pair,
        actionType,
        lastActionAt: now,
        cooldownPeriod,
      });
      await this.repository.save(entity);
    }
  }

  private entityToCooldown(entity: PositionCooldownEntity): PositionCooldown {
    return {
      pair: entity.pair,
      actionType: entity.actionType,
      lastActionAt: entity.lastActionAt,
      cooldownPeriod: entity.cooldownPeriod,
    };
  }
}
