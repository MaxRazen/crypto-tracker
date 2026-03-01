<template>
  <div>
    <h2 class="text-lg font-semibold mb-4 text-header">Tools</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Percent Difference -->
      <div class="rounded-lg border border-design bg-card p-4">
        <h3 class="text-sm font-semibold text-header mb-3">Percent Difference</h3>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-secondary mb-1">Old</label>
            <input
              v-model.number="pctDiff.old"
              type="number"
              placeholder="0"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-secondary mb-1">New</label>
            <input
              v-model.number="pctDiff.new"
              type="number"
              placeholder="0"
              class="input-field"
            />
          </div>
        </div>
        <div class="rounded-md bg-semi-dark px-4 py-3 flex items-center justify-between">
          <span class="text-xs text-secondary">Result</span>
          <span
            v-if="pctDiffResult !== null"
            class="text-lg font-semibold font-mono"
            :class="pctDiffResult >= 0 ? 'text-green-400' : 'text-red-400'"
          >
            {{ pctDiffResult >= 0 ? '+' : '' }}{{ pctDiffResult.toFixed(2) }}%
          </span>
          <span v-else class="text-secondary text-sm">—</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';

const pctDiff = reactive({ old: null as number | null, new: null as number | null });

const pctDiffResult = computed<number | null>(() => {
  if (pctDiff.old === null || pctDiff.new === null || pctDiff.old === 0) return null;
  return (pctDiff.new - pctDiff.old) / pctDiff.old * 100;
});
</script>
