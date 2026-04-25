<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 class="text-lg font-semibold m-0 text-header">Trading Rules</h2>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded btn-secondary transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="fetchRules"
        >
          ↺ Refresh
        </button>
        <button
          class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded btn-brand transition-colors"
          @click="openCreate"
        >
          + Add Rule
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-secondary p-4 text-center">Loading rules...</div>
    <div v-else-if="error" class="text-delete p-4">{{ error }}</div>
    <div
      v-else-if="rules.length === 0"
      class="rounded-lg border border-design bg-card p-4 text-center text-secondary"
    >
      No rules yet. Create one to get started.
    </div>

    <div v-else class="space-y-6">
      <div v-for="group in grouped" :key="group.key">
        <div class="flex items-center gap-2 mb-3">
          <span class="px-2 py-0.5 rounded bg-semi-dark text-sm font-semibold text-header"
            >{{ group.pair }}</span
          >
          <span class="px-2 py-0.5 rounded bg-semi-dark text-sm text-secondary"
            >{{ group.market }}</span
          >
          <CurrentPairPrice
            class="px-2 py-0.5 rounded bg-semi-dark text-sm text-secondary"
            :pair="group.pair"
          />
          <div class="flex-1 border-t border-design"></div>
          <span class="text-xs text-secondary whitespace-nowrap"
            >{{ group.rules.length }}
            rule{{ group.rules.length !== 1 ? 's' : '' }}</span
          >
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="rule in group.rules"
            :key="rule.uid"
            class="rounded-lg border border-design bg-card p-3 cursor-pointer transition-colors hover:border-[#2c84db]/60"
            @click="openEdit(rule)"
          >
            <div class="flex justify-between items-start gap-2 mb-2">
              <button
                class="font-mono text-sm text-default border-b border-dashed border-gray-500 hover:border-brand transition-colors leading-tight truncate max-w-[70%]"
                @click.stop="copyUid(rule.uid)"
                :title="rule.uid"
              >
                {{ rule.uid }}
              </button>
              <span
                :class="['inline-block px-2 py-0.5 text-xs font-medium rounded-full shrink-0', statusBadgeClass(rule.status)]"
              >
                {{ rule.status }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mb-3 min-h-[2.5rem]">
              <div>
                <div class="text-xs font-medium text-secondary mb-1">Conditions</div>
                <div
                  v-for="(a, i) in rule.activators"
                  :key="i"
                  class="text-sm text-default leading-tight"
                >
                  {{ activatorStr(a) }}
                </div>
              </div>
              <div>
                <div class="text-xs font-medium text-secondary mb-1">Actions</div>
                <div
                  v-for="(a, i) in rule.actions"
                  :key="i"
                  class="text-sm text-default leading-tight"
                >
                  {{ a.type }}
                </div>
              </div>
            </div>

            <div class="flex gap-2" @click.stop>
              <button
                v-if="rule.active"
                class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
                @click="deactivate(rule)"
              >
                Deactivate
              </button>
              <button
                v-else
                class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-brand transition-colors"
                @click="activate(rule)"
              >
                Activate
              </button>
              <button
                class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-delete transition-colors"
                @click="confirmDelete(rule)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RuleFormModal v-if="showModal" :rule="editingRule" @save="handleSave" @close="closeModal" />

    <div
      v-if="deleteTarget"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="deleteTarget = null"
    >
      <div
        class="w-full max-w-md rounded-lg border border-design bg-card overflow-hidden shadow-xl"
      >
        <div class="px-5 py-4 border-b border-design font-semibold text-lg text-header">
          Delete Rule
        </div>
        <div class="p-5 text-default">
          Are you sure you want to delete <strong>{{ deleteTarget?.uid }}</strong>? This cannot be
          undone.
        </div>
        <div class="px-5 py-4 border-t border-design flex gap-2 justify-end">
          <button
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded btn-secondary transition-colors"
            @click="deleteTarget = null"
          >
            Cancel
          </button>
          <button
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded btn-delete transition-colors"
            @click="doDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api } from '../api/api';
import { useWsStream } from '../composables/useWsStream';
import RuleFormModal from './RuleFormModal.vue';
import CurrentPairPrice from './CurrentPairPrice.vue';

const { connect, disconnect } = useWsStream();

const rules = ref([]);
const loading = ref(true);
const error = ref('');
const showModal = ref(false);
const editingRule = ref(null);
const deleteTarget = ref(null);

const STATUS_ORDER = { active: 0, activated: 1 };

const grouped = computed(() => {
  const map = new Map();
  for (const rule of rules.value) {
    const key = `${rule.pair}::${rule.market}`;
    if (!map.has(key)) map.set(key, { key, pair: rule.pair, market: rule.market, rules: [] });
    map.get(key).rules.push(rule);
  }
  for (const group of map.values()) {
    group.rules.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 2;
      const sb = STATUS_ORDER[b.status] ?? 2;
      return sa - sb;
    });
  }
  return [...map.values()];
});

function statusBadgeClass(status) {
  if (status === 'active') return 'bg-green-500/20 text-green-400';
  if (status === 'activated') return 'bg-[#2c84db]/20 text-[#2c84db]';
  return 'bg-semi-dark text-secondary';
}

function activatorStr(a) {
  const parts = [a.type, a.side, a.value];
  if (a.timeframe) parts.push(`[${a.timeframe}]`);
  return parts.join(' ');
}

async function fetchRules() {
  loading.value = true;
  error.value = '';
  try {
    rules.value = await api.rules.list();
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      window.location.reload();
    } else {
      error.value = e.message || 'Failed to load rules';
    }
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingRule.value = null;
  showModal.value = true;
}

function openEdit(rule) {
  editingRule.value = { ...rule };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingRule.value = null;
}

async function handleSave(rule) {
  if (editingRule.value?.uid) {
    const { uid, ...payload } = rule;
    await api.rules.update(uid, payload);
  } else {
    await api.rules.create(rule);
  }
  closeModal();
  await fetchRules();
}

async function activate(rule) {
  try {
    await api.rules.update(rule.uid, { active: true });
    await fetchRules();
  } catch (e) {
    error.value = e.message || 'Failed to activate';
  }
}

async function deactivate(rule) {
  try {
    await api.rules.update(rule.uid, { active: false });
    await fetchRules();
  } catch (e) {
    error.value = e.message || 'Failed to deactivate';
  }
}

function confirmDelete(rule) {
  deleteTarget.value = rule;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await api.rules.delete(deleteTarget.value.uid);
    deleteTarget.value = null;
    await fetchRules();
  } catch (e) {
    error.value = e.message || 'Failed to delete';
  }
}

function copyUid(uid) {
  navigator.clipboard.writeText(uid);
}

onMounted(() => {
  connect();
  fetchRules();
});

onUnmounted(disconnect);
</script>
