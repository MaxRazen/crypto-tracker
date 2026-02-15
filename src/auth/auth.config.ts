import { registerAs } from '@nestjs/config';

export type AuthConfig = {
  jwtSecret: string;
  jwtPublicKey?: string; // For RS256, if using public key verification
  jwtAlgorithm?: string; // 'HS256' (default) or 'RS256'
  webUser?: string;
  webPassword?: string;
};

export default registerAs(
  'auth',
  (): AuthConfig => ({
    jwtSecret: process.env.JWT_SECRET || '',
    jwtPublicKey: process.env.JWT_PUBLIC_KEY,
    jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
    webUser: process.env.WEB_USER || 'admin',
    webPassword: process.env.WEB_PASSWORD || 'admin',
  }),
);
