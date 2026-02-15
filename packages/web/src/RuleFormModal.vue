<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" style="max-width: 42rem">
      <div class="modal-header">{{ isEdit ? 'Edit Rule' : 'Create Rule' }}</div>
      <form @submit.prevent="submit" class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>UID</label>
            <div class="flex gap-2">
              <input
                v-model="form.uid"
                class="input"
                placeholder="rule-btc-buy-low"
                required
                :readonly="isEdit"
                style="flex: 1"
              />
              <button
                v-if="!isEdit"
                type="button"
                class="btn btn-secondary btn-sm"
                @click="generateUid"
              >
                Generate
              </button>
            </div>
            <span v-if="isEdit" class="text-xs text-muted">Cannot change UID when editing</span>
          </div>
          <div class="form-group">
            <label>Pair</label>
            <select v-model="form.pair" class="input" required>
              <option value="">Select pair</option>
              <option v-for="p in PAIRS" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Market</label>
            <select v-model="form.market" class="input" required>
              <option v-for="m in MARKETS" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Timeframe</label>
            <select v-model="form.timeframe" class="input" required>
              <option v-for="t in TIMEFRAMES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fetch Type</label>
            <input v-model="form.fetchType" class="input" placeholder="ticker" required />
          </div>
          <div class="form-group" v-if="isEdit">
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="form.active" />
              Active
            </label>
          </div>
        </div>

        <div class="form-group full-width mt-4">
          <label>Activators</label>
          <ActivatorsEditor v-model="form.activators" />
        </div>

        <div class="form-group full-width mt-4">
          <label>Actions</label>
          <ActionsEditor v-model="form.actions" />
        </div>

        <p v-if="formError" class="error mt-3">{{ formError }}</p>
      </form>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="saving" @click="submit">
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { PAIRS, MARKETS, TIMEFRAMES } from './constants';
import ActivatorsEditor from './ActivatorsEditor.vue';
import ActionsEditor from './ActionsEditor.vue';

const props = defineProps({
  rule: { type: Object, default: null },
});

const emit = defineEmits(['save', 'close']);

const isEdit = computed(() => !!props.rule?.uid);

const form = ref({
  uid: '',
  active: true,
  pair: '',
  market: 'binance',
  timeframe: '1h',
  fetchType: 'ticker',
  activators: [],
  actions: [],
});

const formError = ref('');
const saving = ref(false);

function normalizeActivator(a) {
  return {
    type: a.type || 'price',
    side: a.side || 'lte',
    value: a.value ?? '',
    timeframe: a.timeframe || '1h',
  };
}

function normalizeAction(a) {
  const base = { type: a.type || 'notification', context: a.context || {} };
  if (['activate', 'deactivate'].includes(base.type)) {
    base.context = { ruleUid: base.context.ruleUid || '' };
  } else if (['buy', 'sell'].includes(base.type)) {
    base.context = {
      type: base.context.type || 'market',
      price: base.context.price ?? '',
      quantity: base.context.quantity || { type: 'percent', value: '50' },
    };
  } else {
    base.context = { channel: base.context.channel || 'telegram' };
  }
  return base;
}

watch(
  () => props.rule,
  (r) => {
    if (r) {
      form.value = {
        uid: r.uid,
        active: r.active ?? true,
        pair: r.pair,
        market: r.market,
        timeframe: r.timeframe,
        fetchType: r.fetchType,
        activators: (Array.isArray(r.activators) ? r.activators : []).map(normalizeActivator),
        actions: (Array.isArray(r.actions) ? r.actions : []).map(normalizeAction),
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
  { immediate: true }
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
  const invalidActivator = form.value.activators.find((a) => !a.type || !a.value);
  if (invalidActivator) {
    formError.value = 'All activators need type and value';
    return;
  }

  saving.value = true;
  try {
    await emit('save', { ...form.value });
  } catch (e) {
    formError.value = e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.error {
  color: var(--danger);
  font-size: 0.875rem;
}
</style>
