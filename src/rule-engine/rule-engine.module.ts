import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import modeConfig from '../config/mode.config';
import { DataProviderModule } from '../data-provider/data-provider.module';
import { RuleModule } from '../rule/rule.module';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [
    ConfigModule.forFeature(modeConfig),
    DataProviderModule,
    RuleModule,
  ],
  providers: [RuleEngineService],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
