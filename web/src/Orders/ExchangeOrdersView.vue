<template>
  <div>
    <h2 class="text-lg font-semibold mb-4 text-header">Exchange Orders</h2>

    <!-- Filters -->
    <div class="rounded-lg border border-design bg-card p-4 mb-4">
      <form
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        @submit.prevent="fetchOrders"
      >
        <div>
          <label class="block text-xs font-medium text-secondary mb-1">Exchange</label>
          <select v-model="filters.exchange" class="input-field">
            <option value="binance">Binance</option>
            <option value="bybit">Bybit</option>
            <option value="coinbase">Coinbase</option>
            <option value="kraken">Kraken</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-secondary mb-1">Symbol</label>
          <select v-model="filters.pair" class="input-field">
            <option value="">— Select symbol —</option>
            <option v-for="pair in PAIRS" :key="pair" :value="pair">{{ pair }}</option>
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

    <!-- Empty state: no symbol selected yet -->
    <div
      v-if="!loading && !result && !error"
      class="rounded-lg border border-design bg-card p-8 text-center text-secondary"
    >
      <p>
        Select a symbol and click <span class="text-default font-medium">Fetch Orders</span> to load
        data.
      </p>
    </div>

    <template v-if="!loading && result">
      <!-- Performance board -->
      <div v-if="result.performance" class="rounded-lg border border-design bg-card p-4 mb-4">
        <h3 class="text-sm font-semibold text-header mb-3">Performance</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Profit</p>
            <p
              class="text-base font-semibold font-mono"
              :class="result.performance.profit >= 0 ? 'text-green-400' : 'text-red-400'"
            >
              {{ formatCost(result.performance.profit) }}
            </p>
            <p
              class="text-xs font-mono mt-0.5"
              :class="result.performance.profitPercent >= 0 ? 'text-green-400/70' : 'text-red-400/70'"
            >
              {{ result.performance.profitPercent >= 0 ? '+' : '' }}
              {{ result.performance.profitPercent.toFixed(2) }}%
            </p>
          </div>

          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Anticipated Profit</p>
            <p
              class="text-base font-semibold font-mono"
              :class="result.performance.anticipatedProfit >= 0 ? 'text-green-400' : 'text-red-400'"
            >
              {{ formatCost(result.performance.anticipatedProfit) }}
            </p>
          </div>

          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Volume</p>
            <p class="text-base font-semibold font-mono text-default">
              {{ formatCost(result.performance.volume) }}
            </p>
          </div>

          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Fees</p>
            <p class="text-base font-semibold font-mono text-default">
              {{ formatCost(result.performance.fees) }}
            </p>
          </div>

          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Avg Buy / Sell</p>
            <p class="text-sm font-mono text-default">
              <span class="text-green-400">{{ formatPrice(result.performance.avgBuyPrice) }}</span>
              <span class="text-secondary mx-1">/</span>
              <span class="text-red-400">{{ formatPrice(result.performance.avgSellPrice) }}</span>
            </p>
          </div>

          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Total Orders</p>
            <p class="text-base font-semibold text-default">{{ result.performance.totalOrders }}</p>
          </div>

          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Active</p>
            <p class="text-base font-semibold text-[#2c84db]">
              {{ result.performance.activeOrders }}
            </p>
          </div>

          <div class="rounded-md bg-semi-dark p-3">
            <p class="text-xs text-secondary mb-1">Cancelled</p>
            <p class="text-base font-semibold text-secondary">
              {{ result.performance.cancelledOrders }}
            </p>
          </div>
        </div>
      </div>

      <!-- Orders table -->
      <div class="rounded-lg border border-design bg-card overflow-hidden">
        <div v-if="result.orders.length === 0" class="p-8 text-center text-secondary">
          <p>No orders found</p>
          <p class="text-xs mt-1">Try adjusting the filters</p>
        </div>

        <template v-else>
          <!-- Mobile: card list -->
          <div class="block md:hidden divide-y divide-[var(--border-color)]">
            <div v-for="order in result.orders" :key="order.id" class="p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-default">{{ order.symbol }}</span>
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
                <span>{{ formatDate(order.timestamp) }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs font-mono mt-2">
                <div>
                  <p class="text-secondary">Price</p>
                  <p class="text-default">{{ formatPrice(order.price) }}</p>
                </div>
                <div>
                  <p class="text-secondary">Amount</p>
                  <p class="text-default">{{ formatAmount(order.amount) }}</p>
                </div>
                <div>
                  <p class="text-secondary">Cost</p>
                  <p class="text-default">{{ formatCost(order.cost) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop: table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th
                    class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Date
                  </th>
                  <th
                    class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Symbol
                  </th>
                  <th
                    class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Side
                  </th>
                  <th
                    class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Type
                  </th>
                  <th
                    class="px-4 py-3 text-right font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Price
                  </th>
                  <th
                    class="px-4 py-3 text-right font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Amount
                  </th>
                  <th
                    class="px-4 py-3 text-right font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Filled
                  </th>
                  <th
                    class="px-4 py-3 text-right font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Cost
                  </th>
                  <th
                    class="px-4 py-3 text-center font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in result.orders"
                  :key="order.id"
                  class="border-b border-design table-row-hover"
                >
                  <td class="px-4 py-3 whitespace-nowrap text-secondary">
                    {{ formatDate(order.timestamp) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap font-medium text-default">
                    {{ order.symbol }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span :class="sideClass(order.side)">{{ order.side.toUpperCase() }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-secondary capitalize">
                    {{ order.type }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-mono text-default">
                    {{ formatPrice(order.price) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-mono text-default">
                    {{ formatAmount(order.amount) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-mono text-default">
                    {{ formatAmount(order.filled) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-mono text-default">
                    {{ formatCost(order.cost) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      :class="['inline-flex px-2 py-0.5 text-xs font-medium rounded-full border', statusClass(order.status)]"
                    >
                      {{ order.status }}
                    </span>
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
import { reactive, ref } from 'vue';
import { api } from '../api/api';
import type { FetchExchangeOrdersDto, FetchExchangeOrdersResponseDto } from '../api/gen/types.gen';
import { PAIRS } from '../constants';

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const now = new Date();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const filters = reactive<FetchExchangeOrdersDto>({
  exchange: 'binance',
  pair: '',
  since: toLocalDatetimeString(sevenDaysAgo),
  until: toLocalDatetimeString(now),
  computePerformance: true,
});

const loading = ref(false);
const error = ref('');
const result = ref<FetchExchangeOrdersResponseDto | null>(null);

async function fetchOrders() {
  if (!filters.pair) return;
  loading.value = true;
  error.value = '';
  try {
    result.value = await api.orders.exchangeOrdersList({ ...filters });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch orders';
    if (msg === 'UNAUTHORIZED') {
      window.location.reload();
    } else {
      error.value = msg;
    }
  } finally {
    loading.value = false;
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: number): string {
  if (!price) return '—';
  return price >= 1
    ? price.toLocaleString('en-US', { maximumFractionDigits: 4 })
    : price.toFixed(8);
}

function formatAmount(amount: number): string {
  return amount?.toFixed(6) ?? '0';
}

function formatCost(cost: number): string {
  return (
    '$' +
    (cost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ??
      '0.00')
  );
}

function statusClass(status: string): string {
  switch (status) {
    case 'closed':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'open':
      return 'bg-[#2c84db]/10 text-[#2c84db] border-[#2c84db]/20';
    case 'canceled':
      return 'bg-semi-dark text-secondary border-design';
    case 'expired':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-semi-dark text-secondary border-design';
  }
}

function sideClass(side: string): string {
  return side === 'buy' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold';
}
</script>
