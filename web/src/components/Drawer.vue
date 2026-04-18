<template>
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/60 z-40"
        @click="closeOnBackdrop && $emit('close')"
      />
    </Transition>
    <Transition name="drawer-panel">
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:max-w-2xl bg-card border-l border-design shadow-xl"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    closeOnBackdrop?: boolean;
  }>(),
  { closeOnBackdrop: true },
);

defineEmits<(e: 'close') => void>();
</script>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.25s ease;
}
.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateX(100%);
}
</style>
