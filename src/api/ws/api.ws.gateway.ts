import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Subscription } from 'rxjs';
import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { EventService } from '../../event/event.service';
import { JwtPayload } from '../../auth/jwt.strategy';
import { WsOutboundMessage } from './ws.types';

type AuthedClient = WebSocket & { userId: string; isAlive: boolean };

@Injectable()
export class ApiWsGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiWsGateway.name);
  private wss: WebSocketServer;
  private readonly subscriptions: Subscription[] = [];
  private heartbeat: NodeJS.Timeout;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService,
  ) {}

  onModuleInit() {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/api/ws',
      verifyClient: ({ req }, done) => this.verifyClient(req, done),
    });

    this.wss.on('connection', (ws: AuthedClient, req: IncomingMessage) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const payload = this.jwtService.verify<JwtPayload>(
        url.searchParams.get('token')!,
      );
      ws.userId = payload.sub;
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });
      ws.on('error', (err) =>
        this.logger.warn(`Client ${ws.userId} error: ${err.message}`),
      );

      this.logger.log(`Client connected: ${ws.userId}`);
    });

    this.subscribeToEvents();
    this.startHeartbeat();

    this.logger.log('WebSocket gateway active at /api/ws');
  }

  onModuleDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    clearInterval(this.heartbeat);
    this.wss?.close();
  }

  private verifyClient(
    req: IncomingMessage,
    done: (result: boolean, code?: number, message?: string) => void,
  ) {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) return done(false, 401, 'Missing token');

    try {
      this.jwtService.verify(token);
      done(true);
    } catch {
      done(false, 401, 'Invalid token');
    }
  }

  private subscribeToEvents() {
    this.subscriptions.push(
      this.eventService.onMarketUpdate$.subscribe((data) =>
        this.broadcast({ type: 'market_update', data }),
      ),
      this.eventService.onRuleTriggered$.subscribe((data) =>
        this.broadcast({ type: 'rule_triggered', data }),
      ),
    );
  }

  private broadcast(message: WsOutboundMessage) {
    const payload = JSON.stringify(message);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
  }

  private startHeartbeat() {
    this.heartbeat = setInterval(() => {
      (this.wss.clients as Set<AuthedClient>).forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30_000);
  }
}
