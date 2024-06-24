import { Candle } from '../types';

export function calculateSeriesChange(candles: Candle[]): number {
    const avg = candles.map((c: Candle): number => (c.open + c.close) / 2);

    const changes: number[] = [];
    for (let i = 0; i < avg.length-1; i++) {
        const change: number = (avg[i] - avg[i+1]) / avg[i+1] * 100;
        changes.push(change);
    }
    return changes.reduce((acc, c: number) => acc + c, 0);
}
