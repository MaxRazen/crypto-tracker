<template>
  <label class="toggle-label">
    <div class="toggle-group">
      <input
        :checked="modelValue"
        type="checkbox"
        role="switch"
        class="toggle-input"
        :disabled="disabled"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <div class="toggle-track" />
      <div class="toggle-thumb" />
    </div>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  disabled?: boolean;
}>();

defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();
</script>

<style scoped>
.toggle-label {
  display: inline-flex;
  cursor: pointer;
}

.toggle-label:has(:disabled) {
  pointer-events: none;
}

.toggle-group {
  position: relative;
  width: 36px;
  height: 20px;
  user-select: none;
  cursor: pointer;
}

.toggle-input {
  position: absolute;
  width: 36px;
  height: 20px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.toggle-input:focus-visible {
  outline: 1px solid var(--bg-brand);
  outline-offset: 2px;
}

.toggle-input:disabled {
  opacity: 0.5;
}

.toggle-track {
  position: absolute;
  inset: 0;
  width: 36px;
  height: 20px;
  border-radius: 9999px;
  background-color: var(--bg-semi-dark);
  border: 0.5px solid var(--border-color);
  transition: all 0.2s;
}

.toggle-group:hover .toggle-track {
  border-width: 1px;
}

.toggle-input:checked + .toggle-track {
  background-color: var(--bg-brand);
  border-width: 0;
}

.toggle-group:hover .toggle-input:checked + .toggle-track {
  border: 1px solid var(--bg-brand);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background-color: #fff;
  border: 0.5px solid var(--border-color);
  box-sizing: border-box;
  transition: transform 0.2s;
  pointer-events: none;
}

.toggle-group:hover .toggle-thumb {
  border-width: 1px;
}

.toggle-input:checked ~ .toggle-thumb {
  transform: translateX(16px);
  border-width: 0;
}

.toggle-group:hover .toggle-input:checked ~ .toggle-thumb {
  border-width: 0;
}
</style>
