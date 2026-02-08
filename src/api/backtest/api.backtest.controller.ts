import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BacktestService } from '../../backtest/backtest.service';
import { RunBacktestDto } from './dto/run-backtest.dto';
import { BacktestResult } from '../../backtest/backtest.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('backtest')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/backtest')
export class ApiBacktestController {
  constructor(private readonly backtestService: BacktestService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run a backtest',
    description:
      'Executes a backtest simulation using historical market data for the specified rules',
  })
  @ApiResponse({
    status: 200,
    description: 'Backtest completed successfully',
    schema: {
      example: {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.000Z',
        startBalance: 10000,
        endBalance: 10500,
        totalReturn: 500,
        totalReturnPercent: 5.0,
        totalTrades: 25,
        winningTrades: 15,
        losingTrades: 10,
        winRate: 60.0,
        averageWin: 50.0,
        averageLoss: -30.0,
        profitFactor: 2.5,
        maxDrawdown: 200,
        maxDrawdownPercent: 2.0,
        trades: [],
        positions: [],
        equityCurve: [],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
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
