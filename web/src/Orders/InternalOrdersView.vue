<template>
  <div>
    <div class="flex items-center gap-3 mb-4 justify-between">
      <h2 class="text-lg font-semibold text-header">Internal Orders</h2>
      <button
        type="button"
        :class="[
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors',
          autoRefresh
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-semi-dark text-secondary border-design',
        ]"
        @click="toggleAutoRefresh"
      >
        <span
          :class="['inline-block w-1.5 h-1.5 rounded-full', autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-secondary']"
        ></span>
        {{ autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off' }}
      </button>
    </div>

    <!-- Filters -->
    <div class="rounded-lg border border-design bg-card p-4 mb-4">
      <form
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        @submit.prevent="fetchOrders"
      >
        <div>
          <label class="block text-xs font-medium text-secondary mb-1">Symbol</label>
          <select v-model="filters.pair" class="input-field">
            <option value="">— All symbols —</option>
            <option v-for="pair in PAIRS" :key="pair" :value="pair">{{ pair }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-secondary mb-1">Status</label>
          <select v-model="filters.status" class="input-field">
            <option value="">— All statuses —</option>
            <option value="new">New</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-secondary mb-1">Since</label>
          <input v-model="filters.since" type="date" class="input-field">
        </div>

        <div>
          <label class="block text-xs font-medium text-secondary mb-1">Until</label>
          <input v-model="filters.until" type="date" class="input-field">
        </div>

        <div class="flex items-end">
          <button
            type="submit"
            :disabled="loading"
            class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded btn-brand transition-colors disabled:opacity-50"
          >
            {{ loading ? 'Loading…' : 'Fetch Orders' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="rounded-lg border border-red-500/20 bg-red-500/10 p-3 mb-4 text-sm text-red-400"
    >
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="rounded-lg border border-design bg-card p-8 text-center text-secondary mb-4"
    >
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mb-3"
      ></div>
      <p>Loading orders…</p>
    </div>

    <template v-if="!loading && result">
      <!-- Orders table -->
      <div class="rounded-lg border border-design bg-card overflow-hidden">
        <div v-if="result.orders.length === 0" class="p-8 text-center text-secondary">
          <p>No orders found</p>
          <p class="text-xs mt-1">Try adjusting the filters</p>
        </div>

        <template v-else>
          <!-- Mobile: card list -->
          <div class="block md:hidden divide-y divide-[var(--border-color)]">
            <div v-for="order in result.orders" :key="order.uid" class="p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-default">{{ order.pair }}</span>
                <span
                  :class="['inline-flex px-2 py-0.5 text-xs font-medium rounded-full border', statusClass(order.status)]"
                >
                  {{ order.status }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-secondary mb-1">
                <span :class="sideClass(order.side)">{{ order.side.toUpperCase() }}</span>
                <span>·</span>
                <span class="capitalize">{{ order.type }}</span>
                <span>·</span>
                <span>{{ formatDate(order.placedAt) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs font-mono mt-2">
                <div>
                  <p class="text-secondary">Price</p>
                  <p class="text-default">{{ order.price || '—' }}</p>
                </div>
                <div>
                  <p class="text-secondary">Qty / Filled</p>
                  <p class="text-default">
                    {{ order.quantity.value }}{{ order.quantity.type === 'percent' ? '%' : '' }}
                    <span v-if="order.filledQuantity != null" class="text-secondary">
                      / {{ order.filledQuantity }}
                    </span>
                  </p>
                </div>
              </div>
              <div v-if="order.errorMessage" class="mt-2 text-xs text-red-400">
                {{ order.errorMessage }}
              </div>
            </div>
          </div>

          <!-- Desktop: table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th
                    v-for="col in columns"
                    :key="col"
                    class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                    :class="{ 'text-right': rightAlignedCols.has(col) }"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in result.orders"
                  :key="order.uid"
                  class="border-b border-design table-row-hover"
                >
                  <td class="px-4 py-3 whitespace-nowrap text-secondary">
                    {{ formatDate(order.placedAt) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap font-medium text-default">
                    {{ order.pair }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span :class="sideClass(order.side)">{{ order.side.toUpperCase() }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-secondary capitalize">
                    {{ order.type }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-mono text-default">
                    {{ order.price || '—' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-mono text-default">
                    {{ order.quantity.value }}{{ order.quantity.type === 'percent' ? '%' : '' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-mono text-default">
                    {{ order.filledQuantity ?? '—' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      :class="['inline-flex px-2 py-0.5 text-xs font-medium rounded-full border', statusClass(order.status)]"
                    >
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-secondary font-mono text-xs">
                    {{ order.externalUid || '—' }}
                  </td>
                  <td class="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate">
                    {{ order.errorMessage || '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-4 py-3 border-t border-design text-xs text-secondary">
            {{ result.orders.length }}
            order{{ result.orders.length !== 1 ? 's' : '' }}
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { api } from '../api/api';
import type { ListInternalOrdersDto, ListInternalOrdersResponseDto } from '../api/gen/types.gen';
import { PAIRS } from '../constants';

function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const now = new Date();
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

const filters = reactive({
  pair: '',
  status: '' as '' | 'new' | 'pending' | 'completed' | 'cancelled' | 'failed',
  since: toDateString(thirtyDaysAgo),
  until: toDateString(now),
});

const loading = ref(false);
const error = ref('');
const result = ref<ListInternalOrdersResponseDto | null>(null);

const columns = [
  'Placed At',
  'Pair',
  'Side',
  'Type',
  'Price',
  'Qty',
  'Filled',
  'Status',
  'Ext. ID',
  'Error',
];
const rightAlignedCols = new Set(['Price', 'Qty', 'Filled']);

async function fetchOrders() {
  loading.value = true;
  error.value = '';
  try {
    const dto: ListInternalOrdersDto = {
      since: Math.trunc(new Date(filters.since).getTime() / 1000),
      until: Math.trunc(new Date(`${filters.until}T23:59:59Z`).getTime()),
      pair: filters.pair || undefined,
      status: filters.status ? [filters.status] : undefined,
    };
    result.value = await api.orders.internalOrdersList(dto);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch orders';
  } finally {
    loading.value = false;
  }
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'pending':
      return 'bg-[#2c84db]/10 text-[#2c84db] border-[#2c84db]/20';
    case 'new':
      return 'bg-semi-dark text-secondary border-design';
    case 'cancelled':
      return 'bg-semi-dark text-secondary border-design';
    case 'failed':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-semi-dark text-secondary border-design';
  }
}

function sideClass(side: string): string {
  return side === 'buy' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold';
}

const AUTO_REFRESH_KEY = 'internal-orders:auto-refresh';
const autoRefresh = ref(localStorage.getItem(AUTO_REFRESH_KEY) === 'true');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value;
  localStorage.setItem(AUTO_REFRESH_KEY, String(autoRefresh.value));
  if (autoRefresh.value) {
    refreshTimer = setInterval(fetchOrders, 10_000);
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    refreshTimer = null;
  }
}

onMounted(() => {
  fetchOrders();
  if (autoRefresh.value) refreshTimer = setInterval(fetchOrders, 10_000);
});
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>
