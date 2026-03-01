import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { NotificationService } from './notification.service';
import notificationConfig from './notification.config';
import modeConfig from '../config/mode.config';

@Module({
  imports: [
    ConfigModule.forFeature(notificationConfig),
    ConfigModule.forFeature(modeConfig),
    HttpModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
