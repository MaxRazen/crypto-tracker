<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="login-title">Crypto Tracker</h1>
      <p class="text-muted mb-4">Sign in to manage trading rules</p>

      <form @submit.prevent="submit" class="login-form">
        <div class="form-group mb-3">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="input"
            placeholder="Username"
            required
            autocomplete="username"
          />
        </div>
        <div class="form-group mb-4">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input"
            placeholder="Password"
            required
            autocomplete="current-password"
          />
        </div>
        <p v-if="error" class="error mb-3">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading" style="width: 100%">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { api } from './api';

const emit = defineEmits(['login']);

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
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      error.value = 'Invalid username or password';
    } else {
      error.value = e.message || 'Login failed';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 24rem;
  padding: 2rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.error {
  color: var(--danger);
  font-size: 0.875rem;
}
</style>
