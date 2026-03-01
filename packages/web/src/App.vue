<template>
  <div>
    <template v-if="!authenticated">
      <LoginView @login="handleLogin" />
    </template>
    <template v-else>
      <header class="py-4 border-b border-design bg-semi-dark">
        <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <h1 class="text-lg font-semibold text-header">Crypto Tracker</h1>
            <nav class="flex items-center gap-2">
              <button
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                  currentView === 'rules'
                    ? 'bg-active-menu text-default'
                    : 'nav-btn-inactive',
                ]"
                @click="currentView = 'rules'"
              >
                Rules
              </button>
              <button
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                  currentView === 'orders'
                    ? 'bg-active-menu text-default'
                    : 'nav-btn-inactive',
                ]"
                @click="currentView = 'orders'"
              >
                Orders
              </button>
            </nav>
          </div>
          <button
            class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded btn-secondary transition-colors"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </header>
      <main class="py-6 min-h-[calc(100vh-4rem)]">
        <div class="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <RulesView v-show="currentView === 'rules'" />
          <OrdersView v-show="currentView === 'orders'" />
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from './api';
import LoginView from './LoginView.vue';
import RulesView from './RulesView.vue';
import OrdersView from './OrdersView.vue';

const authenticated = ref(false);
const currentView = ref<'rules' | 'orders'>('rules');

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
