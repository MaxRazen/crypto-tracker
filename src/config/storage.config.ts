import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  DB_URL: process.env.DB_URL || '.data/db.sqlite',
}));
