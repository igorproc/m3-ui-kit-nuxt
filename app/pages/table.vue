<script setup lang="ts">
import type { SortState } from '~/layers/ui/components/ui/table/types'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
}

const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor', status: 'inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'active' },
  { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'Admin', status: 'inactive' },
]

const columns = [
  { key: 'id', label: 'ID', width: '60rem', sortable: true },
  { key: 'name', label: 'Full Name', sortable: true },
  { key: 'email', label: 'Email Address', sortable: true },
  { key: 'role', label: 'Role', width: '200rem', sortable: true },
  { key: 'status', label: 'Status', width: '120rem', sortable: true },
  { key: 'actions', label: 'Actions', width: '120rem' },
]

const roleOptions = [
  { label: 'Admin', value: 'Admin' },
  { label: 'User', value: 'User' },
  { label: 'Editor', value: 'Editor' },
]

const usersList = ref([...users])
const editingRowId = ref<number | null>(null)

const selectedUsers = ref<User[]>([])
const isSelectable = ref(true)
const hasPagination = ref(true)
const currentPage = ref(1)
const pageSize = ref(3)
const sortState = ref<SortState<User> | null>(null)

const sortedUsers = computed(() => {
  if (!sortState.value) return usersList.value

  const { key, direction } = sortState.value
  return [...usersList.value].sort((a, b) => {
    const aValue = a[key as keyof User]
    const bValue = b[key as keyof User]

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
})

const paginatedUsers = computed(() => {
  if (!hasPagination.value) return sortedUsers.value
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedUsers.value.slice(start, end)
})

function toggleEdit(row: User) {
  if (editingRowId.value === row.id) {
    editingRowId.value = null
  } else {
    editingRowId.value = row.id
  }
}

function deleteRow(row: User) {
  usersList.value = usersList.value.filter(u => u.id !== row.id)
}

function onRowClick(row: User) {
  useConsole().log('[ui-test/table] row click', row)
}
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-table
      </h2>

      <p class="ui-test-section__description">
        Data table with generics, slots, selection, and pagination.
      </p>

      <div class="ui-test-section__controls">
        <label class="ui-test-toggle">
          <input
            v-model="isSelectable"
            type="checkbox"
          >
          <span>selectable</span>
        </label>
        <label class="ui-test-toggle">
          <input
            v-model="hasPagination"
            type="checkbox"
          >
          <span>pagination</span>
        </label>
      </div>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__row">
        <h3 class="ui-test-grid__row-title">
          Selected: {{ selectedUsers.length }} users
        </h3>

        <ui-table
          v-model:selected-rows="selectedUsers"
          v-model:current-page="currentPage"
          v-model:sort="sortState"
          :data="paginatedUsers"
          :columns="columns"
          :selectable="isSelectable"
          :pagination="hasPagination"
          :page-size="pageSize"
          :total-items="usersList.length"
        >
          <!-- Custom cell for Role with Edit mode -->
          <template #cell-role="{ value, row }">
            <div v-if="editingRowId === row.id">
              <ui-dropdown
                v-model="row.role"
                :options="roleOptions"
                variant="outlined"
                style="

--ui-text-field-height: 40rem;"
              />
            </div>
            <span v-else>{{ value }}</span>
          </template>

          <!-- Actions -->
          <template #cell-actions="{ row }">
            <div style="display: flex; gap: 8rem; justify-content: flex-end;">
              <ui-button
                variant="text"
                color="primary"
                style="min-width: unset; padding-inline: 8rem;"
                @click="toggleEdit(row)"
              >
                <ui-icon :name="editingRowId === row.id ? 'baseline-check' : 'baseline-edit'" />
              </ui-button>
              <ui-button
                variant="text"
                color="warn"
                style="min-width: unset; padding-inline: 8rem;"
                @click="deleteRow(row)"
              >
                <ui-icon name="baseline-close" />
              </ui-button>
            </div>
          </template>

          <!-- Custom header for Status -->
          <template #header-status="{ column }">
            <div style="display: flex; align-items: center; gap: 4rem;">
              <ui-icon
                name="baseline-info"
                style="font-size: 14rem;"
              />
              {{ column.label }}
            </div>
          </template>

          <!-- Custom cell for Status -->
          <template #cell-status="{ value }">
            <ui-chip
              :variant="value === 'active' ? 'filled' : 'outlined'"
              :color="value === 'active' ? 'primary' : 'warn'"
              style="

--ui-chip-height: 24rem;

 font-size: 12rem;"
            >
              {{ value }}
            </ui-chip>
          </template>

          <!-- Custom cell for Name -->
          <template #cell-name="{ value, row }">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 600;">{{ value }}</span>
              <span style="font-size: 12rem; opacity: 0.7;">ID: {{ row.id }}</span>
            </div>
          </template>
        </ui-table>
      </div>
    </div>
  </section>
</template>
