<template>
  <div>
    <h2 class="text-lg font-semibold mb-4 text-header">Account</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="market in MARKETS"
        :key="market"
        class="rounded-lg border border-design bg-card p-4"
      >
        <h3 class="text-sm font-semibold text-header mb-3 capitalize">{{ market }}</h3>

        <div v-if="loading[market]" class="text-secondary text-sm">Loading…</div>
        <div v-else-if="errors[market]" class="text-red-400 text-sm">{{ errors[market] }}</div>
        <div v-else-if="balances[market]?.length" class="space-y-2">
          <div
            v-for="asset in balances[market]"
            :key="asset.asset"
            class="rounded-md bg-semi-dark px-4 py-2 flex items-center justify-between"
          >
            <span class="text-sm font-medium text-default font-mono">{{ asset.asset }}</span>
            <div class="text-right">
              <div class="text-sm font-semibold font-mono text-default">
                {{ asset.total.toFixed(6) }}
              </div>
              <div v-if="asset.used > 0" class="text-xs text-secondary font-mono">
                free {{ asset.free.toFixed(6) }} / used {{ asset.used.toFixed(6) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-secondary text-sm">No balance data.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/api';
import { MARKETS } from '../constants';
import type { AssetBalanceDto } from '../api/gen/types.gen';

const loading = ref<Record<string, boolean>>({});
const errors = ref<Record<string, string>>({});
const balances = ref<Record<string, AssetBalanceDto[]>>({});

async function fetchMarket(market: string) {
  loading.value[market] = true;
  errors.value[market] = '';
  try {
    const res = await api.account.balance({ exchange: market });
    balances.value[market] = res.assets.filter((a) => a.total > 0);
  } catch (e) {
    errors.value[market] = e instanceof Error ? e.message : 'Failed to load';
  } finally {
    loading.value[market] = false;
  }
}

onMounted(() => {
  for (const market of MARKETS) {
    fetchMarket(market);
  }
});
</script>
