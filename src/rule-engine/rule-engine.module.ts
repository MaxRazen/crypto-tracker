import { Module } from '@nestjs/common';
import { DataProviderModule } from '../data-provider/data-provider.module';
import { RuleModule } from '../rule/rule.module';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [DataProviderModule, RuleModule],
  providers: [RuleEngineService],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
