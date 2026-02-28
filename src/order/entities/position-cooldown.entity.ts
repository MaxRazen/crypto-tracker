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

  // Default 5 minutes in milliseconds
  @Column({ type: 'integer', default: 300_000 })
  cooldownPeriod: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
