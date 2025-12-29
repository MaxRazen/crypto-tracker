import { Module } from '@nestjs/common';
import { RuleService } from './rule.service';
import { RuleRepository } from './rule.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleEntity } from './rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RuleEntity])],
  providers: [RuleRepository, RuleService],
  exports: [RuleService, RuleRepository],
})
export class RuleModule {}
