import { Module } from '@nestjs/common';
import { TrackerModule } from './tracker/tracker.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RuleModule } from './rule/rule.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from './storage/storage.module';
import { ExchangeModule } from './exchange/exchange.module';
import { AppController } from './app.controller';
import { ApiModule } from './api/api.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order/order.entity';
import { RuleEntity } from './rule/rule.entity';
import { PositionEntity } from './order/position.entity';
import { PositionCooldownEntity } from './order/position-cooldown.entity';
import storageConfig from './storage/storage.config';
import authConfig from './auth/auth.config';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [storageConfig],
    }),
    ConfigModule.forFeature(authConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database:
          configService.get<string>('storage.DB_URL') || '.data/db.sqlite',
        entities: [
          OrderEntity,
          RuleEntity,
          PositionEntity,
          PositionCooldownEntity,
        ],
        synchronize: true, // Set to false in production and use migrations
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      OrderEntity,
      RuleEntity,
      PositionEntity,
      PositionCooldownEntity,
    ]),
    ScheduleModule.forRoot(),
    TrackerModule,
    RuleModule,
    OrderModule,
    StorageModule,
    ExchangeModule,
    ApiModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
