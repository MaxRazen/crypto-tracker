import { registerAs } from '@nestjs/config';

export type NotificationConfig = {
  telegram: {
    botToken: string;
    chatId: string;
  };
};

export default registerAs(
  'notification',
  (): NotificationConfig => ({
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
    },
  }),
);
