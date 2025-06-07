import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import storageConfig from './storage.config';
import { ConfigType } from '@nestjs/config';
import { DatabaseSync } from 'node:sqlite';

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);

  private db: DatabaseSync;

  constructor(
    @Inject(storageConfig.KEY)
    private config: ConfigType<typeof storageConfig>,
  ) {}

  onModuleInit() {
    this.db = new DatabaseSync(this.config.DB_URL);
    this.migrateSchema();
  }

  onModuleDestroy() {
    if (this.db.isOpen) {
      this.db.close();
    }
  }

  connection() {
    return this.db;
  }

  private migrateSchema() {
    const query = this.db.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    );
    const orderTbl = query.get('orders');

    if (orderTbl) {
      return;
    }

    this.logger.log('Migrating DB schema');

    this.db.exec(`
      CREATE TABLE orders (
        uid TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        data TEXT NOT NULL
      ) STRICT
    `);
  }
}
