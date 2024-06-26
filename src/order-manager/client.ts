import { Deadline, OrderCreationData } from '../types';
import { ordermanager } from './grpc/ordermanager';
import grpc from '@grpc/grpc-js';

export class OrderManagerClient {
    constructor(private endpoint: string) {
    }

    public async createOrder(data: OrderCreationData): Promise<void> {
        const client = new ordermanager.OrderManagerClient(this.endpoint, grpc.credentials.createInsecure());

        const deadlines: ordermanager.Deadline[] = data.deadlines.map((d: Deadline): ordermanager.Deadline => {
            return new ordermanager.Deadline({
                type: ordermanager.DeadlineType[d.type.toUpperCase()],
                value: d.value,
                action: ordermanager.DeadlineAction[d.action.toUpperCase()],
            });
        });

        const req: ordermanager.CreateOrderRequest = new ordermanager.CreateOrderRequest({
            pair: data.pair,
            market: data.market,
            action: ordermanager.ActionType[data.action.toUpperCase()],
            behavior: ordermanager.Behavior[data.behavior.toUpperCase()],
            price: data.price,
            quantity: new ordermanager.Quantity({
                type: ordermanager.QuantityType[data.quantity.type.toUpperCase()],
                value: data.quantity.value,
            }),
            deadlines: deadlines,
        });

        const metadata = new grpc.Metadata();
        metadata.add('authorization', 'some-secret-token');

        const resp: ordermanager.CreateOrderResponse = await client.CreateOrder(req, metadata);

        if (!resp.success) {
            console.error('OrderManagerClient', resp.message);
        }
    }
}
