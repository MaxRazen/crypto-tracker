import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('positions')
export class PositionEntity {
  @PrimaryColumn()
  pair: string;

  @Column({ type: 'text' })
  side: 'buy' | 'sell';

  @Column({ type: 'real' })
  quantity: number;

  @Column({ type: 'real' })
  averagePrice: number;

  @Column({ nullable: true, type: 'text' })
  orderUid?: string;

  @Column({ nullable: true, type: 'text' })
  actionId?: string;

  @Column({ type: 'bigint' })
  openedAt: number;

  @Column({ nullable: true, type: 'bigint' })
  closedAt?: number;

  @Column({ type: 'boolean', default: true })
  isOpen: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
