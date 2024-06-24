import { sleep } from '../utils';

export interface IOrderManager {
    createOrder(orderCreateData: any): Promise<void>;
}

export class OrderManager implements IOrderManager {
    private endpoint: string

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    public async createOrder(orderCreateData: any): Promise<void> {
        // TODO: add a call to OrderManager service
        await sleep(1000);
    }
}
