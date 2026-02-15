import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import WebSocket from 'ws';
import { Candle, KlineEvent } from './data-provider.types';

interface BinanceKlinePayload {
  stream: string;
  data: {
    e: string;
    E: number;
    s: string;
    k: {
      t: number;
      T: number;
      s: string;
      i: string;
      o: string;
      c: string;
      h: string;
      l: string;
      v: string;
      n: number;
      x: boolean;
      q: string;
      V: string;
      Q: string;
    };
  };
}

@Injectable()
export class BinanceWsService implements OnModuleDestroy {
  private readonly logger = new Logger(BinanceWsService.name);
  private readonly WS_BASE_URL = 'wss://stream.binance.com:9443/stream';

  private ws: WebSocket | null = null;
  private streams: string[] = [];
  private isDestroyed = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly MAX_RECONNECT_ATTEMPTS = 20;
  private readonly BASE_RECONNECT_DELAY_MS = 1000;
  private readonly MAX_RECONNECT_DELAY_MS = 30000;

  private readonly klineUpdate$ = new Subject<KlineEvent>();

  /**
   * Subscribe to Binance kline streams via combined WebSocket.
   * Returns an Observable that emits parsed KlineEvents.
   *
   * @param streams - Array of stream names, e.g. ['btcusdt@kline_1m', 'ethusdt@kline_1h']
   */
  subscribe(streams: string[]): Observable<KlineEvent> {
    if (streams.length === 0) {
      this.logger.warn('No streams to subscribe to');
      return this.klineUpdate$.asObservable();
    }

    this.streams = streams;
    this.logger.log(`Subscribing to ${streams.length} streams: ${streams.join(', ')}`);
    this.connect();

    return this.klineUpdate$.asObservable();
  }

  /**
   * Disconnect and reconnect with a new set of streams.
   */
  updateStreams(streams: string[]): void {
    this.streams = streams;
    this.disconnect();
    if (streams.length > 0) {
      this.connect();
    }
  }

  onModuleDestroy() {
    this.isDestroyed = true;
    this.disconnect();
    this.klineUpdate$.complete();
  }

  private connect(): void {
    if (this.isDestroyed) return;

    const url = `${this.WS_BASE_URL}?streams=${this.streams.join('/')}`;
    this.logger.debug(`Connecting to ${url}`);

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this.logger.error(`Failed to create WebSocket: ${err.message}`);
      this.scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      this.reconnectAttempts = 0;
      this.logger.log(
        `WebSocket connected (${this.streams.length} streams)`,
      );
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const payload = JSON.parse(data.toString()) as BinanceKlinePayload;

        if (payload.data?.e === 'kline') {
          const kline = this.parseKlinePayload(payload);
          this.klineUpdate$.next(kline);
        }
      } catch (err) {
        this.logger.warn(`Failed to parse WS message: ${err.message}`);
      }
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      this.logger.warn(
        `WebSocket closed (code: ${code}, reason: ${reason.toString() || 'none'})`,
      );
      if (!this.isDestroyed) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (err: Error) => {
      this.logger.error(`WebSocket error: ${err.message}`);
    });

    this.ws.on('ping', (data: Buffer) => {
      this.ws?.pong(data);
    });
  }

  private disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();

      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed) return;

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(
        `Max reconnection attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`,
      );
      return;
    }

    const delay = Math.min(
      this.BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      this.MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;

    this.logger.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private parseKlinePayload(payload: BinanceKlinePayload): KlineEvent {
    const k = payload.data.k;

    const candle: Candle = {
      timestamp: k.t,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      isClosed: k.x,
    };

    return {
      wsSymbol: k.s.toLowerCase(),
      timeframe: k.i,
      candle,
    };
  }
}
