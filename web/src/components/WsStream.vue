<template>
  <slot :messages="messages" :status="status" :clear="clear" />
</template>

<script setup lang="ts" generic="T = unknown">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue';

const props = defineProps<{
  url: string;
  token: string;
  /** Keep only the last N messages in the buffer (default: 100) */
  bufferSize?: number;
}>();

const emit = defineEmits<{
  message: [data: T];
  open: [];
  close: [code: number, reason: string];
  error: [];
}>();

type Status = 'connecting' | 'open' | 'closed' | 'error';

const status = ref<Status>('closed');
const messages = shallowRef<T[]>([]);

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
  const wsUrl = `${props.url}?token=${encodeURIComponent(props.token)}`;
  ws = new WebSocket(wsUrl);
  status.value = 'connecting';

  ws.onopen = () => {
    status.value = 'open';
    emit('open');
  };

  ws.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data) as T;
    const limit = props.bufferSize ?? 100;
    if (messages.value.length >= limit) {
      messages.value.shift();
    }
    messages.value.push(data);
    emit('message', data);
  };

  ws.onerror = () => {
    status.value = 'error';
    emit('error');
  };

  ws.onclose = (event: CloseEvent) => {
    status.value = 'closed';
    emit('close', event.code, event.reason);
    // Reconnect on unexpected close (not 1000 normal / 1008 policy violation)
    if (event.code !== 1000 && event.code !== 1008) {
      reconnectTimer = setTimeout(connect, 3000);
    }
  };
}

function disconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close(1000);
  ws = null;
}

function clear() {
  messages.value = [];
}

watch(
  () => props.token,
  () => {
    disconnect();
    connect();
  },
);

onMounted(connect);
onUnmounted(disconnect);
</script>
