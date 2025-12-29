import { Module } from '@nestjs/common';
import { ApiOrdersService } from './orders/api.orders.service';
import { ApiOrderController } from './orders/api.orders.controller';
import { ApiRulesService } from './rules/api.rules.service';
import { ApiRulesController } from './rules/api.rules.controller';
import { ExchangeModule } from '../exchange/exchange.module';
import { RuleModule } from '../rule/rule.module';

@Module({
  imports: [ExchangeModule, RuleModule],
  controllers: [ApiOrderController, ApiRulesController],
  providers: [ApiOrdersService, ApiRulesService],
})
export class ApiModule {}
