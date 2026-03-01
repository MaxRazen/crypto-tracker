<template>
  <div>
    <div
      v-for="(item, i) in modelValue"
      :key="i"
      class="rounded-lg border border-design bg-semi-dark p-3 mb-2"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-secondary">Action {{ i + 1 }}: {{ item.type }}</span>
        <button
          type="button"
          class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
          @click="remove(i)"
        >
          Remove
        </button>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-secondary">Type</label>
        <select
          v-model="item.type"
          class="w-full input-field"
          @change="ensureContext(item)"
        >
          <option v-for="t in ACTION_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <!-- Activate / Deactivate -->
      <div v-if="['activate', 'deactivate'].includes(String(item.type)) && item.context" class="flex flex-col gap-1 mt-2">
        <label class="text-sm font-medium text-secondary">Rule UID</label>
        <input
          v-model="(item.context as Record<string, string>).ruleUid"
          class="w-full input-field"
          placeholder="rule-xxx"
        />
      </div>

      <!-- Buy / Sell -->
      <template v-if="['buy', 'sell'].includes(String(item.type)) && item.context">
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Order Type</label>
            <select
              v-model="(item.context as Record<string, string>).type"
              class="w-full input-field"
            >
              <option v-for="t in ORDER_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Price</label>
            <input
              v-model="(item.context as Record<string, string>).price"
              class="w-full input-field"
              placeholder="50000"
            />
          </div>
        </div>
        <div v-if="(item.context as Record<string, unknown>)?.quantity" class="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Quantity Type</label>
            <select
              v-model="(item.context as any).quantity.type"
              class="w-full input-field"
            >
              <option v-for="t in QUANTITY_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Quantity Value</label>
            <input
              v-model="(item.context as any).quantity.value"
              class="w-full input-field"
              placeholder="50"
            />
          </div>
        </div>
      </template>

      <!-- Notification / Alert -->
      <div v-if="['notification', 'alert'].includes(String(item.type))" class="flex flex-col gap-1 mt-2">
        <label class="text-sm font-medium text-secondary">Channel</label>
        <input
          v-model="(item.context as Record<string, string>).channel"
          class="w-full input-field"
          placeholder="telegram"
        />
      </div>
    </div>
    <button
      type="button"
      class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
      @click="add"
    >
      + Add Action
    </button>
  </div>
</template>

<script setup lang="ts">
import { ACTION_TYPES, ORDER_TYPES, QUANTITY_TYPES } from './constants';

const props = defineProps<{
  modelValue: Array<Record<string, unknown>>;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: Array<Record<string, unknown>>): void }>();

function ensureContext(item: Record<string, unknown>) {
  if (!item.context || typeof item.context !== 'object') {
    item.context = {};
  }
  const ctx = item.context as Record<string, unknown>;
  if (['activate', 'deactivate'].includes(String(item.type))) {
    item.context = { ruleUid: ctx?.ruleUid || '' };
  } else if (['buy', 'sell'].includes(String(item.type))) {
    item.context = {
      type: ctx?.type || 'market',
      price: ctx?.price ?? '',
      quantity: ctx?.quantity || { type: 'percent', value: '50' },
    };
  } else if (['notification', 'alert'].includes(String(item.type))) {
    item.context = { channel: ctx?.channel || 'telegram' };
  }
}

function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    { type: 'notification', context: { channel: 'telegram' } },
  ]);
}

function remove(i: number) {
  const next = props.modelValue.filter((_, idx) => idx !== i);
  emit('update:modelValue', next);
}
</script>
