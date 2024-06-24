/*
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_FILE_PATH = __dirname + '/../../order-manager/ordermanager/ordermanager.proto';
const SERVER_URL = 'localhost:50051';

const ordermanager = initOrderManagerClient();

function testGrpc() {
    const client = new ordermanager.OrderManager(SERVER_URL, grpc.credentials.createInsecure());

    client.CreateOrder({
        pair: 'BTC-USDT',
        market: 'binance',
        action: 'BUY',
        type: 'MARKET',
        amount: {
            type: 'SCALAR',
            value: '20.99',
        },
        deadlines: [
            {
                type: 'TIME',
                value: 120,
                action: 'CANCEL',
            },
        ],
    }, grpcHandler)
}

function grpcHandler(error, resp) {
    console.log('grpcHandler', {
        resp,
        error,
    });
}

function initOrderManagerClient() {
    const packageDefinition = protoLoader.loadSync(
        PROTO_FILE_PATH,
        {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        }
    );

    return grpc.loadPackageDefinition(packageDefinition).ordermanager;
}

testGrpc();
*/
