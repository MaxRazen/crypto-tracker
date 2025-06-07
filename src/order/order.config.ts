import { registerAs } from '@nestjs/config';

export type OrderConfig = {
  stake: number;
};

export default registerAs(
  'order',
  (): OrderConfig => ({
    stake: parseInt(process.env.ORDER_STAKE || '1000'),
  }),
);
