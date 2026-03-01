<template>
  <div>
    <div
      v-for="(item, i) in modelValue"
      :key="i"
      class="rounded-lg border border-design bg-semi-dark p-3 mb-2"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-secondary">Activator {{ i + 1 }}</span>
        <button
          type="button"
          class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
          @click="remove(i)"
        >
          Remove
        </button>
      </div>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Type</label>
          <select
            v-model="item.type"
            class="w-full input-field"
          >
            <option v-for="t in INDICATOR_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Side</label>
          <select
            v-model="item.side"
            class="w-full input-field"
          >
            <option v-for="s in SIDES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Value</label>
          <input
            v-model="item.value"
            class="w-full input-field"
            placeholder="50000"
            type="text"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-secondary">Timeframe</label>
          <select
            v-model="item.timeframe"
            class="w-full input-field"
          >
            <option v-for="t in TIMEFRAMES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </div>
    </div>
    <button
      type="button"
      class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
      @click="add"
    >
      + Add Activator
    </button>
  </div>
</template>

<script setup lang="ts">
import { INDICATOR_TYPES, SIDES, TIMEFRAMES } from './constants';

const props = defineProps<{
  modelValue: Array<Record<string, unknown>>;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: Array<Record<string, unknown>>): void }>();

function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    { type: 'price', side: 'lte', value: '', timeframe: '1h' },
  ]);
}

function remove(i: number) {
  const next = props.modelValue.filter((_, idx) => idx !== i);
  emit('update:modelValue', next);
}
</script>
