import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Repository } from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { Order } from './order.types';

export interface OrderFilters {
  since?: number;
  until?: number;
  status?: Order['status'] | Order['status'][];
  pair?: string;
  ruleId?: string;
}

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findActive(): Promise<Order[]> {
    const entities = await this.repository.find({
      where: [{ status: 'new' }, { status: 'pending' }],
    });

    return entities.map((entity) => this.entityToOrder(entity));
  }

  async findByFilters(filters: OrderFilters): Promise<Order[]> {
    const where: Record<string, unknown> = {};

    if (filters.pair) where.pair = filters.pair;

    if (filters.ruleId) where.actionId = Like(`${filters.ruleId}-%`);

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? In(filters.status)
        : filters.status;
    }

    if (filters.since !== undefined || filters.until !== undefined) {
      where.placedAt = Between(filters.since ?? 0, filters.until ?? Date.now());
    }

    const entities = await this.repository.find({ where });
    return entities.map((entity) => this.entityToOrder(entity));
  }

  async findActiveByActionId(actionId: string): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { actionId, status: In(['new', 'pending']) },
    });
    return entity ? this.entityToOrder(entity) : null;
  }

  async create(order: Order): Promise<void> {
    const entity = this.orderToEntity(order);
    await this.repository.save(entity);
  }

  async update(order: Order): Promise<void> {
    const entity = this.orderToEntity(order);
    await this.repository.update({ uid: order.uid }, entity);
  }

  private orderToEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.uid = order.uid;
    entity.pair = order.pair;
    entity.price = order.price;
    entity.side = order.side;
    entity.type = order.type;
    entity.quantity = order.quantity;
    entity.placedAt = order.placedAt;
    entity.submittedAt = order.submittedAt;
    entity.status = order.status || 'new';
    entity.errorMessage = order.errorMessage;
    entity.externalUid = order.externalUid;
    entity.actionId = order.actionId;
    entity.filledQuantity = order.filledQuantity;
    entity.completedAt = order.completedAt;
    return entity;
  }

  private entityToOrder(entity: OrderEntity): Order {
    return {
      uid: entity.uid,
      pair: entity.pair,
      price: entity.price,
      side: entity.side,
      type: entity.type,
      quantity: entity.quantity,
      placedAt: entity.placedAt,
      submittedAt: entity.submittedAt,
      status: entity.status,
      errorMessage: entity.errorMessage,
      externalUid: entity.externalUid,
      actionId: entity.actionId,
      filledQuantity: entity.filledQuantity,
      completedAt: entity.completedAt,
    };
  }
}
