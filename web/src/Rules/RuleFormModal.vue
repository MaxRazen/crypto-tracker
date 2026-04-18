<template>
  <Drawer :open="true" :close-on-backdrop="false" @close="$emit('close')">
    <div class="px-5 py-4 border-b border-design flex items-center justify-between shrink-0">
      <span class="font-semibold text-lg text-header"
        >{{ isEdit ? 'Edit Rule' : 'Create Rule' }}</span
      >
      <button
        type="button"
        class="inline-flex items-center justify-center w-7 h-7 rounded text-secondary hover:text-default bg-semi-dark hover:bg-semi-dark transition-colors"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>

    <form id="rule-form" @submit.prevent="submit" class="flex-1 overflow-y-auto p-5">
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">UID</label>
          <div class="flex gap-2">
            <input
              v-model="form.uid"
              class="flex-1 input-field"
              placeholder="rule-btc-buy-low"
              required
              :readonly="isEdit"
            >
            <button
              v-if="!isEdit"
              type="button"
              class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
              @click="generateUid"
            >
              Generate
            </button>
          </div>
          <span v-if="isEdit" class="text-xs text-secondary">Cannot change UID when editing</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Pair</label>
          <select v-model="form.pair" class="w-full input-field" required>
            <option value="">Select pair</option>
            <option v-for="p in PAIRS" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Market</label>
          <select v-model="form.market" class="w-full input-field" required>
            <option v-for="m in MARKETS" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Timeframe</label>
          <select v-model="form.timeframe" class="w-full input-field" required>
            <option v-for="t in TIMEFRAMES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Fetch Type</label>
          <input v-model="form.fetchType" class="w-full input-field" placeholder="ticker" required>
        </div>
        <div v-if="isEdit" class="flex flex-col gap-1">
          <label class="flex items-center gap-2 text-sm font-medium text-secondary">
            <Toggle v-model="form.active" />
            Active
          </label>
        </div>
      </div>

      <div class="flex flex-col gap-1 mt-4">
        <label class="text-sm font-medium text-secondary">Activators</label>
        <ActivatorsEditor v-model="form.activators" />
      </div>

      <div class="flex flex-col gap-1 mt-4">
        <label class="text-sm font-medium text-secondary">Actions</label>
        <ActionsEditor v-model="form.actions" />
      </div>

      <p v-if="formError" class="text-delete text-sm mt-3">{{ formError }}</p>
    </form>

    <div class="px-5 py-4 border-t border-design flex gap-2 justify-end shrink-0">
      <button
        type="button"
        class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded btn-secondary transition-colors"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="rule-form"
        class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded btn-brand disabled:opacity-50 transition-colors"
        :disabled="saving"
      >
        {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
      </button>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { PAIRS, MARKETS, TIMEFRAMES } from '../constants';
import ActivatorsEditor from './ActivatorsEditor.vue';
import ActionsEditor from './ActionsEditor.vue';
import Toggle from '../components/Toggle.vue';
import Drawer from '../components/Drawer.vue';

const props = defineProps<{
  rule: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: 'save', rule: Record<string, unknown>): void;
  (e: 'close'): void;
}>();

const isEdit = computed(() => !!props.rule?.uid);

const form = ref({
  uid: '',
  active: true,
  pair: '',
  market: 'binance',
  timeframe: '1h',
  fetchType: 'ticker',
  activators: [] as Record<string, unknown>[],
  actions: [] as Record<string, unknown>[],
});

const formError = ref('');
const saving = ref(false);

function normalizeActivator(a: Record<string, unknown>) {
  return {
    type: a.type || 'price',
    side: a.side || 'lte',
    value: a.value ?? '',
    timeframe: a.timeframe || '1h',
  };
}

function normalizeAction(a: Record<string, unknown>) {
  const base = { type: a.type || 'notification', context: a.context || {} } as Record<
    string,
    unknown
  >;
  if (['activate', 'deactivate'].includes(base.type as string)) {
    base.context = { ruleUid: (base.context as Record<string, string>)?.ruleUid || '' };
  } else if (['buy', 'sell'].includes(base.type as string)) {
    base.context = {
      type: (base.context as Record<string, string>)?.type || 'market',
      price: (base.context as Record<string, string>)?.price ?? '',
      quantity: (base.context as Record<string, unknown>)?.quantity || {
        type: 'percent',
        value: '50',
      },
    };
  } else {
    base.context = { channel: (base.context as Record<string, string>)?.channel || 'telegram' };
  }
  return base;
}

watch(
  () => props.rule,
  (r) => {
    if (r) {
      form.value = {
        uid: r.uid as string,
        active: (r.active as boolean) ?? true,
        pair: r.pair as string,
        market: r.market as string,
        timeframe: r.timeframe as string,
        fetchType: r.fetchType as string,
        activators: (Array.isArray(r.activators) ? r.activators : []).map((a) =>
          normalizeActivator(a as Record<string, unknown>),
        ),
        actions: (Array.isArray(r.actions) ? r.actions : []).map((a) =>
          normalizeAction(a as Record<string, unknown>),
        ),
      };
    } else {
      form.value = {
        uid: '',
        active: true,
        pair: 'BTC-USDT',
        market: 'binance',
        timeframe: '1h',
        fetchType: 'ticker',
        activators: [{ type: 'price', side: 'lte', value: '', timeframe: '1h' }],
        actions: [{ type: 'notification', context: { channel: 'telegram' } }],
      };
    }
    formError.value = '';
  },
  { immediate: true },
);

function generateUid() {
  const pair = form.value.pair || 'btc';
  const slug = pair.toLowerCase().replace('-', '');
  form.value.uid = `rule-${slug}-${Date.now().toString(36)}`;
}

async function submit() {
  formError.value = '';
  if (form.value.activators.length === 0) {
    formError.value = 'At least one activator is required';
    return;
  }
  if (form.value.actions.length === 0) {
    formError.value = 'At least one action is required';
    return;
  }
  const invalidActivator = form.value.activators.find(
    (a) => !(a as Record<string, unknown>).type || !(a as Record<string, unknown>).value,
  );
  if (invalidActivator) {
    formError.value = 'All activators need type and value';
    return;
  }

  saving.value = true;
  try {
    await emit('save', { ...form.value });
  } catch (e: unknown) {
    formError.value = (e as Error)?.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}
</script>
