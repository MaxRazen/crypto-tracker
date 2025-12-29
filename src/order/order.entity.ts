import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Quantity } from './order.types';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn()
  uid: string;

  @Column()
  pair: string;

  @Column()
  price: string;

  @Column({ type: 'text' })
  side: 'buy' | 'sell';

  @Column({ type: 'text' })
  type: 'market' | 'limit';

  @Column('json')
  quantity: Quantity;

  @Column({ nullable: true, type: 'bigint' })
  placedAt?: number;

  @Column({ nullable: true, type: 'bigint' })
  submittedAt?: number;

  @Column({ type: 'text', default: 'new' })
  status: 'new' | 'pending' | 'failed' | 'completed' | 'cancelled';

  @Column({ nullable: true, type: 'text' })
  errorMessage?: string;

  @Column({ nullable: true, type: 'text' })
  externalUid?: string;

  @Column({ nullable: true, type: 'text' })
  actionId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
