<template>
  <div class="json-editor-wrap">
    <div
      v-for="(item, i) in modelValue"
      :key="i"
      class="editor-item card p-3 mb-2"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-muted">Action {{ i + 1 }}: {{ item.type }}</span>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          @click="remove(i)"
        >
          Remove
        </button>
      </div>
      <div class="form-group">
        <label>Type</label>
        <select v-model="item.type" class="input" @change="ensureContext(item)">
          <option v-for="t in ACTION_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <!-- Activate / Deactivate -->
      <div v-if="['activate', 'deactivate'].includes(item.type) && item.context" class="form-group mt-2">
        <label>Rule UID</label>
        <input v-model="item.context.ruleUid" class="input" placeholder="rule-xxx" />
      </div>

      <!-- Buy / Sell -->
      <template v-if="['buy', 'sell'].includes(item.type) && item.context">
        <div class="form-grid mt-2">
          <div class="form-group">
            <label>Order Type</label>
            <select v-model="item.context.type" class="input">
              <option v-for="t in ORDER_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Price</label>
            <input v-model="item.context.price" class="input" placeholder="50000" />
          </div>
        </div>
        <div class="form-grid mt-2" v-if="item.context?.quantity">
          <div class="form-group">
            <label>Quantity Type</label>
            <select v-model="item.context.quantity.type" class="input">
              <option v-for="t in QUANTITY_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Quantity Value</label>
            <input v-model="item.context.quantity.value" class="input" placeholder="50" />
          </div>
        </div>
      </template>

      <!-- Notification / Alert -->
      <div v-if="['notification', 'alert'].includes(item.type)" class="form-group mt-2">
        <label>Channel</label>
        <input v-model="item.context.channel" class="input" placeholder="telegram" />
      </div>
    </div>
    <button type="button" class="btn btn-secondary btn-sm" @click="add">
      + Add Action
    </button>
  </div>
</template>

<script setup>
import {
  ACTION_TYPES,
  ORDER_TYPES,
  QUANTITY_TYPES,
} from './constants';

const props = defineProps({
  modelValue: { type: Array, required: true },
});

const emit = defineEmits(['update:modelValue']);

function ensureContext(item) {
  if (!item.context) {
    item.context = {};
  }
  if (['activate', 'deactivate'].includes(item.type)) {
    item.context = { ruleUid: item.context?.ruleUid || '' };
  } else if (['buy', 'sell'].includes(item.type)) {
    item.context = {
      type: item.context?.type || 'market',
      price: item.context?.price || '',
      quantity: item.context?.quantity || { type: 'percent', value: '50' },
    };
  } else if (['notification', 'alert'].includes(item.type)) {
    item.context = { channel: item.context?.channel || 'telegram' };
  }
}

function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    { type: 'notification', context: { channel: 'telegram' } },
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
