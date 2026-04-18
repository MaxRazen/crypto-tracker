import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiAccountService } from './api.account.service';
import { BalanceDto } from './dto/balance.dto';
import { BalanceResponseDto } from './dto/balance.response.dto';

@ApiTags('account')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/account')
export class ApiAccountController {
  constructor(private readonly apiAccountService: ApiAccountService) {}

  @Post('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch account balance from exchange' })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    type: BalanceResponseDto,
  })
  async balance(@Body() dto: BalanceDto): Promise<BalanceResponseDto> {
    return this.apiAccountService.balance(dto);
  }
}
