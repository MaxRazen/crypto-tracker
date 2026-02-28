import { Module } from '@nestjs/common';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { RuleModule } from './rule/rule.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from './storage/storage.module';
import { ExchangeModule } from './exchange/exchange.module';
import { AppController } from './app.controller';
import { ApiModule } from './api/api.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order/entities/order.entity';
import { RuleEntity } from './rule/entities/rule.entity';
import { PositionEntity } from './order/entities/position.entity';
import { PositionCooldownEntity } from './order/entities/position-cooldown.entity';
import storageConfig from './storage/storage.config';
import authConfig from './auth/auth.config';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DataProviderModule } from './data-provider/data-provider.module';
import { RuleEngineModule } from './rule-engine/rule-engine.module';

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
    RuleModule,
    OrderModule,
    StorageModule,
    ExchangeModule,
    ApiModule,
    AuthModule,
    DataProviderModule,
    RuleEngineModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'packages', 'web', 'dist'),
      serveRoot: '/',
      exclude: ['/api/{*any}', '/auth/{*any}'],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
