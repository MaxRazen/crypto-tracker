import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from './auth.config';

export interface JwtPayload {
  sub: string; // User ID or subject
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: any; // Allow additional claims
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const authConfig = configService.get<AuthConfig>('auth');

    if (!authConfig?.jwtSecret && !authConfig?.jwtPublicKey) {
      throw new Error(
        'JWT_SECRET or JWT_PUBLIC_KEY must be configured in environment variables',
      );
    }

    const isRS256 = authConfig.jwtAlgorithm === 'RS256';
    const secretOrKey = isRS256
      ? authConfig.jwtPublicKey || authConfig.jwtSecret
      : authConfig.jwtSecret;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretOrKey,
      algorithms: [authConfig.jwtAlgorithm || 'HS256'],
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
