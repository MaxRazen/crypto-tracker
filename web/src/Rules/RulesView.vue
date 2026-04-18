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
    <div v-else>
      <!-- Mobile: card layout -->
      <div class="block md:hidden space-y-3">
        <div
          v-for="rule in rules"
          :key="rule.uid"
          class="rounded-lg border border-design bg-card p-3"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium text-default">{{ rule.uid }}</span>
            <span
              :class="[
                'inline-block px-2 py-0.5 text-xs font-medium rounded-full',
                rule.active ? 'bg-[#2c84db]/20 text-[#2c84db]' : 'bg-semi-dark text-secondary',
              ]"
            >
              {{ rule.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="text-sm text-secondary mb-3">
            {{ rule.pair }}
            · {{ rule.market }} · {{ rule.timeframe }}
          </div>
          <div class="flex gap-2 flex-wrap">
            <button
              class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
              @click="openEdit(rule)"
            >
              Edit
            </button>
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
      <!-- Desktop: table -->
      <div class="hidden md:block overflow-x-auto rounded-lg border border-design bg-card">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th
                class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
              >
                UID
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
              >
                Pair
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
              >
                Market
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
              >
                Status
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
              >
                Timeframe
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-header bg-semi-dark whitespace-nowrap border-b border-design"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rule in rules"
              :key="rule.uid"
              class="border-b border-design table-row-hover"
            >
              <td class="px-4 py-3">
                <span class="font-medium text-default">{{ rule.uid }}</span>
              </td>
              <td class="px-4 py-3 text-default">{{ rule.pair }}</td>
              <td class="px-4 py-3 text-default">{{ rule.market }}</td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-block px-2 py-0.5 text-xs font-medium rounded-full',
                    rule.active ? 'bg-[#2c84db]/20 text-[#2c84db]' : 'bg-semi-dark text-secondary',
                  ]"
                >
                  {{ rule.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-3 text-default">{{ rule.timeframe }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex gap-2">
                  <button
                    class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded btn-secondary transition-colors"
                    @click="openEdit(rule)"
                  >
                    Edit
                  </button>
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
              </td>
            </tr>
          </tbody>
        </table>
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
import { ref, onMounted } from 'vue';
import { api } from '../api/api';
import RuleFormModal from './RuleFormModal.vue';

const rules = ref([]);
const loading = ref(true);
const error = ref('');
const showModal = ref(false);
const editingRule = ref(null);
const deleteTarget = ref(null);

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

onMounted(fetchRules);
</script>
