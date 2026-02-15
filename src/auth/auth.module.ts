import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthController } from './auth.controller';
import authConfig from './auth.config';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const authCfg =
          configService.get<import('./auth.config').AuthConfig>('auth');
        return {
          secret: authCfg.jwtSecret,
          signOptions: {
            expiresIn: '1h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, PassportModule, JwtModule],
})
export class AuthModule {}
