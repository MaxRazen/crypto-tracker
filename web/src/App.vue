<template>
  <div>
    <template v-if="!authenticated"> <LoginView @login="handleLogin" /> </template>
    <template v-else>
      <header class="py-4 border-b border-design bg-semi-dark">
        <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <h1 class="hidden lg:block text-lg font-semibold text-header">Crypto Tracker</h1>
            <nav class="hidden sm:flex items-center gap-2">
              <button
                :class="['px-3 py-1.5 text-sm font-medium rounded transition-colors', currentView === 'rules' ? 'bg-active-menu text-default' : 'nav-btn-inactive']"
                @click="currentView = 'rules'"
              >
                Rules
              </button>
              <button
                :class="['px-3 py-1.5 text-sm font-medium rounded transition-colors', currentView === 'internal-orders' ? 'bg-active-menu text-default' : 'nav-btn-inactive']"
                @click="currentView = 'internal-orders'"
              >
                Orders
              </button>
              <button
                :class="['px-3 py-1.5 text-sm font-medium rounded transition-colors', currentView === 'orders' ? 'bg-active-menu text-default' : 'nav-btn-inactive']"
                @click="currentView = 'orders'"
              >
                Exchange Orders
              </button>
              <button
                :class="['px-3 py-1.5 text-sm font-medium rounded transition-colors', currentView === 'tools' ? 'bg-active-menu text-default' : 'nav-btn-inactive']"
                @click="currentView = 'tools'"
              >
                Tools
              </button>
            </nav>
            <!-- Mobile: current view label -->
            <span class="sm:hidden text-sm font-medium text-default capitalize"
              >{{ navLabel }}</span
            >
          </div>
          <button
            class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded btn-secondary transition-colors"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </header>

      <main class="py-6 pb-24 sm:pb-6 min-h-[calc(100vh-4rem)]">
        <div class="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <RulesView v-show="currentView === 'rules'" />
          <OrdersView v-show="currentView === 'orders'" />
          <InternalOrdersView v-show="currentView === 'internal-orders'" />
          <ToolsView v-show="currentView === 'tools'" />
        </div>
      </main>

      <!-- Mobile bottom nav -->
      <nav
        class="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-semi-dark border-t border-design flex items-stretch"
      >
        <button
          v-for="item in mobileNav"
          :key="item.view"
          :class="['flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors', currentView === item.view ? 'text-default' : 'text-secondary']"
          @click="currentView = item.view"
        >
          <span class="text-base font-bold font-mono leading-none">{{ item.shortcut }}</span>
          <span>{{ item.label }}</span>
        </button>
        <button
          class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-secondary transition-colors"
          @click="handleLogout"
        >
          <span class="text-base font-bold font-mono leading-none">L</span>
          <span>Logout</span>
        </button>
      </nav>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from './api/api';
import LoginView from './Login/LoginView.vue';
import RulesView from './Rules/RulesView.vue';
import OrdersView from './Orders/ExchangeOrdersView.vue';
import InternalOrdersView from './Orders/InternalOrdersView.vue';
import ToolsView from './Tools/ToolsView.vue';

const authenticated = ref(false);
const currentView = ref<'rules' | 'orders' | 'internal-orders' | 'tools'>('rules');

const mobileNav = [
  { view: 'rules' as const, shortcut: 'R', label: 'Rules' },
  { view: 'internal-orders' as const, shortcut: 'O', label: 'Orders' },
  { view: 'orders' as const, shortcut: 'EO', label: 'Exchange' },
  { view: 'tools' as const, shortcut: 'T', label: 'Tools' },
];

const navLabel = computed(() => mobileNav.find((n) => n.view === currentView.value)?.label ?? '');

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
