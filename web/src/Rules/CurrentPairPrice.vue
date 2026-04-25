<template>
  <span>{{ displayPrice }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWsStream } from '../composables/useWsStream';

const props = defineProps<{ pair: string }>();

const { prices } = useWsStream();

const wsSymbol = computed(() => props.pair.replace('-', '').toLowerCase());

const displayPrice = computed(() => {
  const p = prices[wsSymbol.value];
  if (p === undefined) return '—';
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
});
</script>
