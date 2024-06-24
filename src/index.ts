import { Request, Response, Express, response } from 'express';
import express from 'express';
import { initConfig, loadEnv, RuntimeConfig } from './config';
import { Ticker } from './ticker';
import { BinanceClient } from './market';
import { Rule, MarketClient, MarketClients } from './types';
import { makeClient } from './datastore';
import { fetchAllActive } from './rules';
import { OrderManager } from './order-manager';

async function main() {
    const cfg = initConfig(process.argv.slice(2));
    const env = loadEnv();
    // dd(cfg, env);
    // const datastore = makeClient(cfg);

    // const recs = await fetchAllActive(datastore);
    // dd(recs);
    // dd(datastore.runQuery());
    const orderManager = new OrderManager(env.ORDER_MANAGER_ENDPOINT);

    const clients: MarketClients = {
        binance: new BinanceClient(env.BINANCE_API_KEY, env.BINANCE_SECRET_KEY),
    };

    const ticker = new Ticker([], env.TICK_TIMEOUT, clients, orderManager);
    ticker.start();

    process.on('SIGINT', onShutdown);
    initServer(cfg);
}

function initServer(cfg: RuntimeConfig) {
    const server: Express = express();

    server.get('/', (req: Request, res: Response) => {
        res.send('*** Server is working ***')
    });

    server.post('/rules', (req: Request, res: Response) => {
        response.sendStatus(201);
    })

    server.listen(cfg.port, () => {
        console.log('App is now running on: :' + cfg.port)
    });
}

function onShutdown() {
    console.log('\n*** Shutdown signal received ****');

    setTimeout(() => {
        console.log('*** App is finished ***');
        process.exit(0);
    }, 500);
}

function dd(...args: any[]) {
    console.log(...args);
    process.exit(0);
}

main();