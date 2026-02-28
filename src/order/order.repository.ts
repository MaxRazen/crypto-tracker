import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { Order } from './order.types';

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

  async findByActionId(actionId: string): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { actionId },
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
    };
  }
}
