<template>
  <div class="json-editor-wrap">
    <div
      v-for="(item, i) in modelValue"
      :key="i"
      class="editor-item card p-3 mb-2"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-muted">Activator {{ i + 1 }}</span>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          @click="remove(i)"
        >
          Remove
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Type</label>
          <select v-model="item.type" class="input">
            <option v-for="t in INDICATOR_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Side</label>
          <select v-model="item.side" class="input">
            <option v-for="s in SIDES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Value</label>
          <input v-model="item.value" class="input" placeholder="50000" type="text" />
        </div>
        <div class="form-group">
          <label>Timeframe</label>
          <select v-model="item.timeframe" class="input">
            <option v-for="t in TIMEFRAMES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-secondary btn-sm" @click="add">
      + Add Activator
    </button>
  </div>
</template>

<script setup>
import { INDICATOR_TYPES, SIDES, TIMEFRAMES } from './constants';

const props = defineProps({
  modelValue: { type: Array, required: true },
});

const emit = defineEmits(['update:modelValue']);

function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    { type: 'price', side: 'lte', value: '', timeframe: '1h' },
  ]);
}

function remove(i) {
  const next = props.modelValue.filter((_, idx) => idx !== i);
  emit('update:modelValue', next);
}
</script>

<style scoped>
.editor-item {
  background: var(--bg-700);
}
</style>
