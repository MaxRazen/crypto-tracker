import { Module } from '@nestjs/common';
import { ApiOrdersService } from './orders/api.orders.service';
import { ApiOrderController } from './orders/api.orders.controller';
import { ApiRulesService } from './rules/api.rules.service';
import { ApiRulesController } from './rules/api.rules.controller';
import { ExchangeModule } from '../exchange/exchange.module';
import { RuleModule } from '../rule/rule.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ExchangeModule, RuleModule, AuthModule],
  controllers: [ApiOrderController, ApiRulesController],
  providers: [ApiOrdersService, ApiRulesService],
})
export class ApiModule {}
