import { EnvVariables, RuntimeConfig, initConfig, loadEnv } from './config';
import { Ticker } from './ticker';
import { BinanceClient } from './market';
import { MarketClients } from './types';
import { RuleContainer, containerFactory } from './rules';
import { OrderManager } from './order-manager';
import { WebServer } from './webserver';

async function main() {
    const cfg: RuntimeConfig = initConfig(process.argv.slice(2));
    const env: EnvVariables = loadEnv();

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

    const server: WebServer = new WebServer(cfg.port);
    server.registerRoutes().start();
}

function onShutdown() {
    console.log('\n*** Shutdown signal received ****');


    setTimeout(() => {
        console.log('*** App is finished ***');
        process.exit(0);
    }, 500);
}

main();
