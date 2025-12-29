import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionEntity } from './position.entity';

export interface Position {
  pair: string;
  side: 'buy' | 'sell';
  quantity: number;
  averagePrice: number;
  orderUid?: string;
  actionId?: string;
  openedAt: number;
  closedAt?: number;
  isOpen: boolean;
}

@Injectable()
export class PositionRepository {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly repository: Repository<PositionEntity>,
  ) {}

  async findOpenPosition(pair: string): Promise<Position | null> {
    const entity = await this.repository.findOne({
      where: { pair, isOpen: true },
    });
    return entity ? this.entityToPosition(entity) : null;
  }

  async findOpenPositions(): Promise<Position[]> {
    const entities = await this.repository.find({
      where: { isOpen: true },
    });
    return entities.map((entity) => this.entityToPosition(entity));
  }

  async create(position: Position): Promise<void> {
    const entity = this.positionToEntity(position);
    await this.repository.save(entity);
  }

  async closePosition(pair: string, closedAt: number): Promise<void> {
    await this.repository.update(
      { pair, isOpen: true },
      { isOpen: false, closedAt },
    );
  }

  async updatePosition(
    pair: string,
    updates: Partial<Position>,
  ): Promise<void> {
    const entity = this.positionToEntity(updates as Position);
    await this.repository.update({ pair, isOpen: true }, entity);
  }

  private positionToEntity(position: Position): Partial<PositionEntity> {
    return {
      pair: position.pair,
      side: position.side,
      quantity: position.quantity,
      averagePrice: position.averagePrice,
      orderUid: position.orderUid,
      actionId: position.actionId,
      openedAt: position.openedAt,
      closedAt: position.closedAt,
      isOpen: position.isOpen,
    };
  }

  private entityToPosition(entity: PositionEntity): Position {
    return {
      pair: entity.pair,
      side: entity.side,
      quantity: entity.quantity,
      averagePrice: entity.averagePrice,
      orderUid: entity.orderUid,
      actionId: entity.actionId,
      openedAt: entity.openedAt,
      closedAt: entity.closedAt,
      isOpen: entity.isOpen,
    };
  }
}
