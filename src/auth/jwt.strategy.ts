import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from './auth.config';

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const authConfig = configService.get<AuthConfig>('auth');

    if (!authConfig?.jwtSecret && !authConfig?.jwtPublicKey) {
      throw new Error(
        'JWT_SECRET or JWT_PUBLIC_KEY must be configured in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify token is not expired (handled by passport-jwt)
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject');
    }

    // Return the payload - this will be available in request.user
    return payload;
  }
}
