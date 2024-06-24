import { Interval, RestMarketTypes, Spot } from '@binance/connector-typescript';
import { Candle, MarketClient, Pair, CandleGroup, PairPrice, TimeframeType } from '../types';

type PriceTickerOptions = {
    symbol?: string
    symbols?: string
}

type PriceTickerResult = {
    symbol: string
    price: string
}

type SymbolsMap = {
    [key: string]: Pair
}

function pairFormatter(p: Pair): string {
    return p.toUpperCase().replace('-', '');
}

export class BinanceClient implements MarketClient {
    private client: Spot;

    constructor(apiKey: string, secretKey: string) {
        this.client = new Spot(apiKey, secretKey);
    }

    public async getPrice(pairs: Pair[]): Promise<PairPrice[]> {
        if (pairs.length === 0) {
            return [];
        }

        const symbolsMap: SymbolsMap = this.getSymbolsMap(pairs);

        const options: PriceTickerOptions = {};
        if (pairs.length > 1) {
            options.symbols = this.serializePairs(pairs);
        } else {
            options.symbol = pairFormatter(pairs[0]);
        }

        const response: PriceTickerResult | PriceTickerResult[] = await this.client.symbolPriceTicker(options);

        const symbolPrices: PairPrice[] = [];

        (Array.isArray(response) ? response : [response]).forEach((res: PriceTickerResult) => {
            symbolPrices.push({
                pair: symbolsMap[res.symbol],
                price: res.price,
            })
        });

        return symbolPrices;
    }

    public async getCandles(pair: Pair, tf: TimeframeType, limit: number): Promise<Candle[]> {
        const result = await this.client.klineCandlestickData(pairFormatter(pair), Interval[tf], {limit});

        return result.map((c: RestMarketTypes.klineCandlestickDataResponse) => this.toCandle(c));
    }

    public async getCandleGroup(pairs: Pair[], tf: TimeframeType, limit: number): Promise<CandleGroup[]> {
        if (pairs.length === 0) {
            return [];
        }

        const results: RestMarketTypes.klineCandlestickDataResponse[][] = await Promise.all(
            pairs.map((p: string) => {
                return this.client.klineCandlestickData(pairFormatter(p), Interval[tf], {limit});
            })
        );

        const candleGroups: CandleGroup[] = results.map((r: RestMarketTypes.klineCandlestickDataResponse[], idx: number): CandleGroup => {
            return {
                symbol: pairs[idx],
                candles: r.map((c: RestMarketTypes.klineCandlestickDataResponse): Candle => this.toCandle(c)),
            }
        });

        return candleGroups;
    }

    private getSymbolsMap(pairs: Pair[]): SymbolsMap {
        const symbolsMap: {[key: string]: Pair} = {};
        pairs.forEach((p: Pair) => {
            symbolsMap[pairFormatter(p)] = p;
        });
        return symbolsMap;
    }

    private serializePairs(pairs: Pair[]): string {
        return JSON.stringify(
            pairs.map((p: Pair): string => pairFormatter(p))
        );
    }

    private toCandle(c: RestMarketTypes.klineCandlestickDataResponse): Candle {
        return {
            open: +c[1],
            close: +c[4],
            closeTime: +c[6],
        }
    }
}
