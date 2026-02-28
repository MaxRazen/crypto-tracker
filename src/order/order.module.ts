import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import orderConfig from './order.config';
import modeConfig from '../config/mode.config';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { ExchangeModule } from '../exchange/exchange.module';
import { PositionEntity } from './entities/position.entity';
import { PositionCooldownEntity } from './entities/position-cooldown.entity';
import { PositionRepository } from './position.repository';
import { PositionCooldownRepository } from './position-cooldown.repository';

@Module({
  imports: [
    ConfigModule.forFeature(orderConfig),
    ConfigModule.forFeature(modeConfig),
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
