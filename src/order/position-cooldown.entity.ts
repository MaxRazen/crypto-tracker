import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('position_cooldowns')
export class PositionCooldownEntity {
  @PrimaryColumn()
  pair: string;

  @Column({ type: 'text' })
  actionType: 'buy' | 'sell';

  @Column({ type: 'bigint' })
  lastActionAt: number;

  @Column({ type: 'integer', default: 300000 }) // Default 5 minutes in milliseconds
  cooldownPeriod: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
