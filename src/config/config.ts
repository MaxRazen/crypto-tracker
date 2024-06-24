import dotenv from 'dotenv';

export type RuntimeConfig = {
    port: string
}
export type EnvVariables = {
    TICK_TIMEOUT: number
    GCP_KEYFILE: string
    GCP_PROJECT_ID: string
    BINANCE_API_KEY: string
    BINANCE_SECRET_KEY: string
    ORDER_MANAGER_ENDPOINT: string
};

const castMap = {
    // arg: 'number|bool'
}

export function initConfig(args: string[]): RuntimeConfig {
    const config = {
        port: '3000',
    }

    args.forEach((arg) => {
        if (!arg.startsWith('--')) {
            return;
        }

        const param = arg.split('=');

        if (param.length === 0) {
            return;
        }

        const name = param[0]
            .replace('--', '')
            .split('-')
            .filter((t: string) => t.length > 0)
            .map((t: string, idx: number) => idx === 0 ? t : t[0].toUpperCase() + t.substring(1))
            .join('');

        if (config.hasOwnProperty(name)) {
            config[name] = param.length > 1 ? castArgument(name, param[1]) : true;
        }
    })

    return config;
}

export function loadEnv(): EnvVariables {
    const parsedEnv = dotenv.parse('.env');

    return {
        TICK_TIMEOUT: +(parsedEnv.TICK_TIMEOUT || '60'),
        GCP_KEYFILE: parsedEnv.GCP_KEYFILE || 'gcp.json',
        GCP_PROJECT_ID: parsedEnv.GCP_PROJECT_ID || '',
        BINANCE_API_KEY: parsedEnv.BINANCE_API_KEY || '',
        BINANCE_SECRET_KEY: parsedEnv.BINANCE_SECRET_KEY || '',
        ORDER_MANAGER_ENDPOINT: parsedEnv.ORDER_MANAGER_ENDPOINT || 'localhost:50051',
    }
}

function castArgument(key: string, value: string): number | boolean | string {
    switch (castMap[key] || null) {
        case 'number': return +value;
        case 'bool': return !!value;
    }
    return value;
}
