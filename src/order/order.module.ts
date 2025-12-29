import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { ConfigModule } from '@nestjs/config';
import orderConfig from './order.config';
import { OrderRepository } from './order.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';
import { ExchangeModule } from '../exchange/exchange.module';
import { PositionEntity } from './position.entity';
import { PositionCooldownEntity } from './position-cooldown.entity';
import { PositionRepository } from './position.repository';
import { PositionCooldownRepository } from './position-cooldown.repository';

@Module({
  imports: [
    ConfigModule.forFeature(orderConfig),
    TypeOrmModule.forFeature([
      OrderEntity,
      PositionEntity,
      PositionCooldownEntity,
    ]),
    ExchangeModule,
  ],
  providers: [
    OrderRepository,
    PositionRepository,
    PositionCooldownRepository,
    OrderService,
  ],
  exports: [OrderService, PositionRepository, PositionCooldownRepository],
})
export class OrderModule {}
