import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiOrdersService } from './orders/api.orders.service';
import { ApiOrderController } from './orders/api.orders.controller';
import { ApiRulesService } from './rules/api.rules.service';
import { ApiRulesController } from './rules/api.rules.controller';
import { ExchangeModule } from '../exchange/exchange.module';
import { RuleModule } from '../rule/rule.module';
import { AuthModule } from '../auth/auth.module';
import { OrderRepository } from '../order/order.repository';
import { PositionRepository } from '../order/position.repository';
import { OrderEntity } from '../order/entities/order.entity';
import { PositionEntity } from '../order/entities/position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, PositionEntity]),
    ExchangeModule,
    RuleModule,
    AuthModule,
  ],
  controllers: [ApiOrderController, ApiRulesController],
  providers: [
    ApiOrdersService,
    ApiRulesService,
    OrderRepository,
    PositionRepository,
  ],
})
export class ApiModule {}
