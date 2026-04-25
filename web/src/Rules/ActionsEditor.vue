<template>
  <div>
    <div
      v-for="(item, i) in modelValue"
      :key="i"
      class="rounded-lg border border-design bg-semi-dark p-3 mb-2"
    >
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-medium text-secondary"
            >Action {{ i + 1 }}: {{ item.type }}</span
          >
          <span
            v-if="calcCost(item) !== null"
            class="text-xs font-mono px-2 py-0.5 rounded bg-semi-dark border border-design text-default"
          >
            ≈ {{ calcCost(item) }} USDT
          </span>
        </div>
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
        <select v-model="item.type" class="w-full input-field" @change="ensureContext(item)">
          <option v-for="t in ACTION_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <!-- Activate / Deactivate -->
      <div
        v-if="['activate', 'deactivate'].includes(item.type) && item.context"
        class="flex flex-col gap-1 mt-2"
      >
        <label class="text-sm font-medium text-secondary">Rule UID</label>
        <input
          v-model="asActivationCtx(item).ruleUid"
          class="w-full input-field"
          placeholder="rule-xxx"
        >
      </div>

      <!-- Buy / Sell -->
      <template v-if="['buy', 'sell'].includes(item.type) && item.context">
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Order Type</label>
            <select v-model="asBuySellCtx(item).type" class="w-full input-field">
              <option v-for="t in ORDER_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Price</label>
            <input
              v-model="asBuySellCtx(item).price"
              class="w-full input-field"
              placeholder="50000"
            >
          </div>
        </div>
        <div v-if="asBuySellCtx(item).quantity" class="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Quantity Type</label>
            <select v-model="asBuySellCtx(item).quantity.type" class="w-full input-field">
              <option v-for="t in QUANTITY_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-secondary">Quantity Value</label>
            <input
              v-model="asBuySellCtx(item).quantity.value"
              class="w-full input-field"
              placeholder="50"
            >
          </div>
        </div>
      </template>

      <!-- Notification / Alert -->
      <div v-if="['notification', 'alert'].includes(item.type)" class="flex flex-col gap-1 mt-2">
        <label class="text-sm font-medium text-secondary">Channel</label>
        <input
          v-model="asNotificationCtx(item).channel"
          class="w-full input-field"
          placeholder="telegram"
        >
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
import { ACTION_TYPES, ORDER_TYPES, QUANTITY_TYPES } from '../constants';
import type { RuleActionDto } from '../api/gen/types.gen';

interface BuySellContext {
  type: string;
  price: string;
  quantity: { type: string; value: string };
}

interface ActivationContext {
  ruleUid: string;
}

interface NotificationContext {
  channel: string;
}

const props = defineProps<{
  modelValue: Array<RuleActionDto>;
}>();

const emit = defineEmits<(e: 'update:modelValue', value: Array<RuleActionDto>) => void>();

function asBuySellCtx(item: RuleActionDto): BuySellContext {
  return item.context as unknown as BuySellContext;
}

function asActivationCtx(item: RuleActionDto): ActivationContext {
  return item.context as unknown as ActivationContext;
}

function asNotificationCtx(item: RuleActionDto): NotificationContext {
  return item.context as unknown as NotificationContext;
}

function calcCost(item: RuleActionDto): string | null {
  if (!['buy', 'sell'].includes(item.type)) return null;
  const ctx = asBuySellCtx(item);
  const price = parseFloat(ctx.price ?? '');
  if (!ctx.quantity || ctx.quantity.type !== 'fixed') return null;
  const amount = parseFloat(ctx.quantity.value);
  if (!Number.isFinite(price) || !Number.isFinite(amount) || price <= 0 || amount <= 0) return null;
  return (price * amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ensureContext(item: RuleActionDto): void {
  const ctx = item.context as Record<string, unknown>;
  if (['activate', 'deactivate'].includes(item.type)) {
    item.context = { ruleUid: (ctx?.ruleUid as string) || '' };
  } else if (['buy', 'sell'].includes(item.type)) {
    item.context = {
      type: (ctx?.type as string) || 'market',
      price: (ctx?.price as string) ?? '',
      quantity: (ctx?.quantity as { type: string; value: string }) || {
        type: 'percent',
        value: '50',
      },
    } satisfies BuySellContext;
  } else if (['notification', 'alert'].includes(item.type)) {
    item.context = { channel: (ctx?.channel as string) || 'telegram' };
  }
}

function add(): void {
  emit('update:modelValue', [
    ...props.modelValue,
    { type: 'notification', context: { channel: 'telegram' } },
  ]);
}

function remove(i: number): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, idx) => idx !== i),
  );
}
</script>
