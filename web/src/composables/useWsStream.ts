import { ref, reactive, readonly } from 'vue';

export type WsStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface WsCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface WsMarketUpdate {
  wsSymbol: string;
  timeframe: string;
  candle: WsCandle;
}

export interface WsRuleTriggered {
  rule: { uid: string; pair: string; market: string };
  price: number;
  timestamp: number;
}

export type WsMessageMap = {
  market_update: WsMarketUpdate;
  rule_triggered: WsRuleTriggered;
};

type Handler<T> = (data: T) => void;

// Module-level singleton — one shared connection across all consumers
const status = ref<WsStatus>('closed');

// Reactive price map: wsSymbol → latest close price
// Components read from this directly via computed() — no subscribe/unsubscribe needed
const prices = reactive<Record<string, number>>({});

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let refCount = 0;

const handlers = new Map<string, Set<Handler<unknown>>>();

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const token = localStorage.getItem('access_token');
  const base = `${proto}//${window.location.host}/api/ws`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

function dispatch(raw: string): void {
  let msg: { type: string; data: unknown };
  try {
    msg = JSON.parse(raw) as { type: string; data: unknown };
  } catch {
    return;
  }

  // Update the reactive price map for market_update messages
  if (msg.type === 'market_update') {
    const data = msg.data as WsMarketUpdate;
    prices[data.wsSymbol] = data.candle.close;
  }

  // Notify any additional subscribers
  const hSet = handlers.get(msg.type);
  if (hSet) {
    hSet.forEach((h) => {
      h(msg.data);
    });
  }
}

function openConnection(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(getWsUrl());
  status.value = 'connecting';

  ws.onopen = () => {
    status.value = 'open';
  };
  ws.onmessage = (e: MessageEvent<string>) => dispatch(e.data);
  ws.onerror = () => {
    status.value = 'error';
  };
  ws.onclose = (e: CloseEvent) => {
    status.value = 'closed';
    if (e.code !== 1000 && e.code !== 1008) {
      reconnectTimer = setTimeout(openConnection, 3000);
    }
  };
}

function closeConnection(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close(1000);
  ws = null;
  status.value = 'closed';
}

export function useWsStream() {
  function connect(): void {
    if (++refCount === 1) openConnection();
  }

  function disconnect(): void {
    if (--refCount <= 0) {
      refCount = 0;
      closeConnection();
    }
  }

  function subscribe<K extends keyof WsMessageMap>(
    type: K,
    handler: Handler<WsMessageMap[K]>,
  ): void {
    if (!handlers.has(type)) {
      handlers.set(type, new Set());
    }
    handlers.get(type)?.add(handler as Handler<unknown>);
  }

  function unsubscribe<K extends keyof WsMessageMap>(
    type: K,
    handler: Handler<WsMessageMap[K]>,
  ): void {
    handlers.get(type)?.delete(handler as Handler<unknown>);
  }

  return {
    status: readonly(status),
    prices: readonly(prices),
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}
