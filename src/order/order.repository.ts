import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { Order } from './order.types';

@Injectable()
export class OrderRepository {
  constructor(private readonly storageService: StorageService) {}

  findActive() {
    const query = this.storageService
      .connection()
      .prepare(
        `SELECT * FROM orders WHERE status NOT IN ('completed', 'cancelled')`,
      );
    const result = query.all();

    return result.map(({ data }) => JSON.parse(data.toString()));
  }

  create(order: Order) {
    const query = this.storageService
      .connection()
      .prepare(`INSERT INTO orders (uid, status, data) VALUES (?, ?, ?)`);

    query.run(order.uid, order.status, JSON.stringify(order));
  }

  update(order: Order) {
    const query = this.storageService
      .connection()
      .prepare(`UPDATE orders SET status = ?, data = ? WHERE uid = ?`);

    query.run(order.status, JSON.stringify(order), order.uid);
  }
}
