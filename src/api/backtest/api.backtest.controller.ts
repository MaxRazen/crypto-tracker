import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BacktestService } from '../../backtest/backtest.service';
import { RunBacktestDto } from './dto/run-backtest.dto';
import { BacktestResult } from '../../backtest/backtest.types';

@Controller('api/backtest')
export class ApiBacktestController {
  constructor(private readonly backtestService: BacktestService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runBacktest(@Body() dto: RunBacktestDto): Promise<BacktestResult> {
    return await this.backtestService.runBacktest({
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      interval: dto.interval,
      startBalance: dto.startBalance,
      quoteCurrency: dto.quoteCurrency,
      exchangeId: dto.exchangeId,
      rules: dto.rules,
    });
  }
}
