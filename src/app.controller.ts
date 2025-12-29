import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('app')
export class AppController {
  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return {
      status: 'ok',
    };
  }
}
