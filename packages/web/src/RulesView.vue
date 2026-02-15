<template>
  <div class="rules-view">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 class="text-lg font-semibold m-0">Trading Rules</h2>
      <button class="btn btn-primary" @click="openCreate">+ Add Rule</button>
    </div>

    <div v-if="loading" class="text-muted p-4 text-center">Loading rules...</div>
    <div v-else-if="error" class="error p-4">{{ error }}</div>
    <div v-else-if="rules.length === 0" class="empty-state card p-4 text-center text-muted">
      No rules yet. Create one to get started.
    </div>
    <div v-else>
      <!-- Mobile: card layout -->
      <div class="rules-cards">
        <div
          v-for="rule in rules"
          :key="rule.uid"
          class="rule-card card p-3 mb-3"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium">{{ rule.uid }}</span>
            <span :class="['badge', rule.active ? 'badge-success' : 'badge-muted']">
              {{ rule.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="text-sm text-muted mb-3">
            {{ rule.pair }} · {{ rule.market }} · {{ rule.timeframe }}
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-secondary btn-sm" @click="openEdit(rule)">Edit</button>
            <button
              v-if="rule.active"
              class="btn btn-secondary btn-sm"
              @click="deactivate(rule)"
            >
              Deactivate
            </button>
            <button v-else class="btn btn-primary btn-sm" @click="activate(rule)">
              Activate
            </button>
            <button class="btn btn-danger btn-sm" @click="confirmDelete(rule)">Delete</button>
          </div>
        </div>
      </div>
      <!-- Desktop: table -->
      <div class="rules-table card table-wrap">
        <table>
          <thead>
            <tr>
              <th>UID</th>
              <th>Pair</th>
              <th>Market</th>
              <th>Status</th>
              <th>Timeframe</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.uid">
              <td><span class="font-medium">{{ rule.uid }}</span></td>
              <td>{{ rule.pair }}</td>
              <td>{{ rule.market }}</td>
              <td>
                <span :class="['badge', rule.active ? 'badge-success' : 'badge-muted']">
                  {{ rule.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ rule.timeframe }}</td>
              <td class="actions">
                <div class="flex gap-2">
                  <button class="btn btn-secondary btn-sm" @click="openEdit(rule)">Edit</button>
                  <button
                    v-if="rule.active"
                    class="btn btn-secondary btn-sm"
                    @click="deactivate(rule)"
                  >
                    Deactivate
                  </button>
                  <button
                    v-else
                    class="btn btn-primary btn-sm"
                    @click="activate(rule)"
                  >
                    Activate
                  </button>
                  <button class="btn btn-danger btn-sm" @click="confirmDelete(rule)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <RuleFormModal
      v-if="showModal"
      :rule="editingRule"
      @save="handleSave"
      @close="closeModal"
    />

    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
      <div class="modal">
        <div class="modal-header">Delete Rule</div>
        <div class="modal-body">
          Are you sure you want to delete <strong>{{ deleteTarget?.uid }}</strong>? This cannot be undone.
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from './api';
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
  try {
    if (editingRule.value?.uid) {
      const { uid, ...payload } = rule;
      await api.rules.update(uid, payload);
    } else {
      await api.rules.create(rule);
    }
    closeModal();
    await fetchRules();
  } catch (e) {
    throw e;
  }
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

<style scoped>
.actions {
  white-space: nowrap;
}

.empty-state {
  background: var(--bg-800);
}

.error {
  color: var(--danger);
}
</style>
