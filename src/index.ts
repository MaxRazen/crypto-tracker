import express from 'express';
import { Request, Response, Express, response } from 'express';
import { initConfig, loadEnv, RuntimeConfig } from './config';
import { Ticker } from './ticker';
import { BinanceClient } from './market';
import { MarketClients } from './types';
import { RuleContainer, containerFactory } from './rules';
import { OrderManager } from './order-manager';

async function main() {
    const cfg = initConfig(process.argv.slice(2));
    const env = loadEnv();

    const orderManager = new OrderManager(env.ORDER_MANAGER_ENDPOINT);

    const clients: MarketClients = {
        binance: new BinanceClient(env.BINANCE_API_KEY, env.BINANCE_SECRET_KEY),
    };

    try {
        // TODO: GCP datastore can be used in production
        //const datastore: Datastore = datastoreFactory(env.GCP_PROJECT_ID, env.GCP_KEYFILE, env.GCP_NAMESPACE);
        const ruleContainer: RuleContainer = containerFactory(env.ACTIVATION_TIMEOUT);
        await ruleContainer.load();
        const ticker = new Ticker(ruleContainer, clients, orderManager, env.TICK_TIMEOUT);
        ticker.start();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

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

main();
