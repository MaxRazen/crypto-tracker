import { OrderCreationData } from '../types';
import { OrderManagerClient } from './client';

export interface IOrderManager {
    createOrder(orderCreateData: any): Promise<void>;
}

export class OrderManager implements IOrderManager {
    private client: OrderManagerClient;

    constructor(endpoint: string) {
        this.client = new OrderManagerClient(endpoint);
    }

    public async createOrder(orderCreateData: OrderCreationData): Promise<void> {
        try {
            await this.client.createOrder(orderCreateData);
            console.log('OrderManager: order placed');
        } catch (e) {
            console.error('OrderManager client error:', e.message);
        }
    }
}
