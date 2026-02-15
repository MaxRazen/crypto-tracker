<template>
  <div class="app">
    <template v-if="!authenticated">
      <LoginView @login="handleLogin" />
    </template>
    <template v-else>
      <header class="header">
        <div class="container flex items-center justify-between">
          <h1 class="text-lg font-semibold">Crypto Tracker</h1>
          <button class="btn btn-secondary btn-sm" @click="handleLogout">Logout</button>
        </div>
      </header>
      <main class="main">
        <div class="container">
          <RulesView />
        </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from './api';
import LoginView from './LoginView.vue';
import RulesView from './RulesView.vue';

const authenticated = ref(false);

function checkAuth() {
  authenticated.value = api.isAuthenticated();
}

function handleLogin() {
  authenticated.value = true;
}

function handleLogout() {
  api.logout();
  authenticated.value = false;
}

onMounted(checkAuth);
</script>

<style scoped>
.header {
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
  background: var(--bg-800);
}

.main {
  padding: 1.5rem 0;
  min-height: calc(100vh - 4rem);
}
</style>
