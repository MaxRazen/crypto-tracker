import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiOrdersService } from './orders/api.orders.service';
import { ApiOrderController } from './orders/api.orders.controller';
import { ApiRulesService } from './rules/api.rules.service';
import { ApiRulesController } from './rules/api.rules.controller';
import { ApiBacktestController } from './backtest/api.backtest.controller';
import { ExchangeModule } from '../exchange/exchange.module';
import { RuleModule } from '../rule/rule.module';
import { BacktestModule } from '../backtest/backtest.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [ExchangeModule, RuleModule, BacktestModule, AuthModule],
  controllers: [ApiOrderController, ApiRulesController, ApiBacktestController],
  providers: [
    ApiOrdersService,
    ApiRulesService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class ApiModule {}
