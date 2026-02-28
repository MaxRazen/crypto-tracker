import { registerAs } from '@nestjs/config';

export type ModeConfig = {
  isIdleMode: boolean;
  isPlaneMode: boolean;
  isLiveMode: boolean;
};

export default registerAs(
  'mode',
  (): ModeConfig => {
    const mode = (process.env.MODE || 'idle').toLowerCase();
    return {
      isIdleMode: mode === 'idle',
      isPlaneMode: mode === 'plane',
      isLiveMode: mode === 'live',
    };
  },
);
