import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule } from '@nestjs/config';
import storageConfig from './storage.config';

@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
