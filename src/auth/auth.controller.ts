import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from './auth.config';

class LoginDto {
  username: string;
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const authConfig =
      this.configService.get<AuthConfig>('auth');

    if (!authConfig?.webUser || !authConfig?.webPassword) {
      throw new UnauthorizedException('Auth not configured');
    }

    if (
      dto.username !== authConfig.webUser ||
      dto.password !== authConfig.webPassword
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: authConfig.webUser, username: authConfig.webUser };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      expires_in: 3600,
    };
  }
}
