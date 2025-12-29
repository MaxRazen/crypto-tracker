# Backtesting Module

## Overview

The backtesting module allows you to test trading rules against historical market data without risking real money. It simulates time progression and executes orders at historical prices.

## Features

- **Historical Data Loading**: Uses CCXT to fetch OHLCV (candlestick) data from exchanges
- **Time Simulation**: Iterates through historical time periods at configurable intervals
- **Virtual Exchange**: Simulates exchange operations (orders, balances) without real API calls
- **Position Tracking**: Tracks open positions and calculates unrealized P&L
- **Performance Metrics**: Calculates returns, win rate, profit factor, max drawdown, etc.

## Usage

### API Endpoint

```bash
POST /api/backtest/run
Content-Type: application/json

{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "interval": "1h",           // Timeframe: 1m, 5m, 15m, 1h, 4h, 1d, etc.
  "startBalance": 10000,      // Starting balance in quote currency
  "quoteCurrency": "USDT",    // Quote currency (USDT, USD, etc.)
  "exchangeId": "binance",    // Optional, defaults to 'binance'
  "rules": ["rule-uid-1"]     // Optional, array of rule UIDs to test (empty = all active rules)
}
```

### Response

```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.000Z",
  "startBalance": 10000,
  "endBalance": 10500,
  "totalReturn": 500,
  "totalReturnPercent": 5.0,
  "totalTrades": 25,
  "winningTrades": 15,
  "losingTrades": 10,
  "winRate": 60.0,
  "averageWin": 50.0,
  "averageLoss": -30.0,
  "profitFactor": 2.5,
  "maxDrawdown": 200,
  "maxDrawdownPercent": 2.0,
  "trades": [...],
  "positions": [...],
  "equityCurve": [...]
}
```

## Architecture

### Components

1. **HistoricalDataService**: Loads OHLCV data from exchanges via CCXT
2. **BacktestExchangeService**: Simulates exchange operations (orders, balances)
3. **BacktestPriceFetcherService**: Provides historical prices at specific timestamps
4. **BacktestService**: Orchestrates the backtest simulation

### How It Works

1. **Data Loading**: Fetches historical candles for all symbols in the rules
2. **Time Iteration**: Steps through time at the specified interval
3. **Rule Evaluation**: At each time step, evaluates rules against historical prices
4. **Order Execution**: Executes orders immediately at historical prices (market orders) or waits for price (limit orders)
5. **Position Tracking**: Maintains virtual positions and calculates P&L
6. **Metrics Calculation**: Computes performance metrics from trades and equity curve

## Limitations

- **Simplified Position Tracking**: Entry prices are tracked, but complex position management (partial fills, multiple entries) is simplified
- **No Cooldown**: Cooldown periods from live trading are not enforced (can be added)
- **Immediate Execution**: Market orders execute instantly; limit orders execute if price is favorable
- **No Slippage**: Orders execute at exact prices (no spread simulation)
- **Fixed Fees**: Uses 0.1% fee rate (can be configured)

## Future Enhancements

- Add cooldown period simulation
- Implement slippage and spread simulation
- Support for partial fills
- More sophisticated position management
- Export results to CSV/JSON
- Visualization of equity curve
- Comparison of multiple strategies

