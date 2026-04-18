<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm p-8 rounded-lg border border-design bg-card shadow">
      <h1 class="text-2xl font-semibold mb-4 text-header">Crypto Tracker</h1>

      <form @submit.prevent="submit">
        <div class="flex flex-col gap-1 mb-3">
          <label for="username" class="text-sm font-medium text-secondary">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="input-field"
            placeholder="Username"
            required
            autocomplete="off"
          >
        </div>
        <div class="flex flex-col gap-1 mb-4">
          <label for="password" class="text-sm font-medium text-secondary">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input-field"
            placeholder="Password"
            required
            autocomplete="current-password"
          >
        </div>
        <p v-if="error" class="text-delete text-sm mb-3">{{ error }}</p>
        <button
          type="submit"
          class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded btn-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="loading"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../api/api';

const emit = defineEmits<(e: 'login') => void>();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await api.login(username.value, password.value);
    emit('login');
  } catch (e: unknown) {
    const err = e as { message?: string };
    if (err?.message === 'UNAUTHORIZED') {
      error.value = 'Invalid username or password';
    } else {
      error.value = err?.message || 'Login failed';
    }
  } finally {
    loading.value = false;
  }
}
</script>
