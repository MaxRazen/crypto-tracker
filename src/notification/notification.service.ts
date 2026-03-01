import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import notificationConfig from './notification.config';
import modeConfig, { ModeConfig } from '../config/mode.config';
import { EventService } from '../event/event.service';
import { Rule } from '../rule/rule.types';

const TELEGRAM_API = 'https://api.telegram.org';

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private eventSub: Subscription | null = null;

  constructor(
    @Inject(notificationConfig.KEY)
    private readonly config: ConfigType<typeof notificationConfig>,
    @Inject(modeConfig.KEY)
    private readonly mode: ModeConfig,
    private readonly httpService: HttpService,
    private readonly eventService: EventService,
  ) {}

  onModuleInit() {
    this.eventSub = this.eventService.onNotificationAction$.subscribe({
      next: (event) => {
        this.notifyRuleTriggered(event.rule).catch((err) =>
          this.logger.error(
            `Failed to send notification for rule ${event.rule.uid}: ${err.message}`,
          ),
        );
      },
      error: (err) =>
        this.logger.error(`Notification event stream error: ${err.message}`),
    });
  }

  onModuleDestroy() {
    this.eventSub?.unsubscribe();
  }

  async sendMarkdown(text: string): Promise<void> {
    if (this.mode.isPlaneMode) {
      this.logger.log(`[plane] ${text}`);
      return;
    }

    if (!this.mode.isLiveMode) {
      return;
    }

    const { botToken, chatId } = this.config.telegram;

    if (!botToken || !chatId) {
      this.logger.warn(
        'Telegram credentials not configured — skipping notification',
      );
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
          chat_id: chatId,
          text,
          parse_mode: 'MarkdownV2',
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to send Telegram message: ${err.message}`,
        err.stack,
      );
    }
  }

  async notifyRuleTriggered(rule: Rule): Promise<void> {
    const header = `*Rule \\#${this.escape(rule.uid)} ${this.escape(rule.pair)} Executed*`;

    const body = rule.activators
      .map((a) => {
        const side = a.side === 'gte' ? '≥' : '≤';
        const tf = a.timeframe || rule.timeframe;
        return this.escape(`${a.type} ${side} ${a.value} [${tf}]`);
      })
      .join('\n');

    await this.sendMarkdown(`${header}\n${body}`);
  }

  private escape(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }
}
