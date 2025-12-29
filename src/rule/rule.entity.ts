import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RuleActivator, RuleAction } from './rule.types';

@Entity('rules')
export class RuleEntity {
  @PrimaryColumn()
  uid: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column()
  pair: string;

  @Column({ type: 'text' })
  market: string;

  @Column({ type: 'text' })
  timeframe: string;

  @Column({ type: 'text' })
  fetchType: string;

  @Column('json')
  activators: RuleActivator[];

  @Column('json')
  actions: RuleAction[];

  @Column('json', { default: '[]' })
  deadlines: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
