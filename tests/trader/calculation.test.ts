import { assert } from 'chai';
import { describe, it } from 'mocha';
import { calculateSeriesChange } from '../../src/trader/calculation';
import { Candle } from '../../src/types';
import jsonCandles from '../stub/candles.grow.json';

describe('calculation module', () => {
    it('calculateSeriesChange - growing trend', () => {
        const candles: Candle[] = jsonCandles;
        assert.equal('4.3732', calculateSeriesChange(candles).toFixed(4));
    }),
    it('calculateSeriesChange - failing trend', () => {
        const candles: Candle[] = jsonCandles.reverse();
        assert.equal('-4.2903', calculateSeriesChange(candles).toFixed(4));
    }),
    it('calculateSeriesChange - single candle', () => {
        const candles: Candle[] = jsonCandles;
        const candle: Candle = {
            open: candles[candles.length-1].open,
            close: candles[0].close,
            closeTime: 0,
        }
        assert.equal('0.0000', calculateSeriesChange([candle]).toFixed(4));
    }),
    it('calculateSeriesChange - no candles', () => {
        assert.equal('0.0000', calculateSeriesChange([]).toFixed(4));
    })
});
