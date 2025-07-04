<template>
  <q-page class="q-pa-md">
    <!-- Top bar -->
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6">Date: {{ currentDate }}</div>
      <div class="q-gutter-sm">
        <q-btn round color="primary" icon="account_circle" @click="openProfile" aria-label="Go to profile" />
        <q-btn round flat color="negative" icon="logout" @click="logout" aria-label="Log out" />
      </div>
    </div>
    <q-toggle
      v-model="sortByPriority"
      label="Sort by Priority"
      left-label
      checked-icon="sort"
      unchecked-icon="event"
      color="primary"
    />

    <!-- Main layout -->
    <div class="row" style="height: calc(100vh - 120px)">
      <!-- Main content area -->
      <div
        class="col bg-grey-2 rounded-borders q-pa-md overflow-y-auto"
        style="margin-right: 280px; margin-bottom: 10px; width: calc(100% - 280px)"
      >
        <div class="row" style="min-height: 100%; flex-wrap: nowrap;">
          <!-- Backlog Column -->
          <div class="col-4" @dragover.prevent @drop="handleDrop('backlog')">
            <div class="text-center text-subtitle2 q-mb-sm">Backlog</div>
            <div
              v-for="item in sortedItems('backlog')"
              :key="item.id"
              class="q-mb-sm bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(item)"
              @click="viewItem(item.id)"
            >
              <div>
                <strong>{{ item.type }}</strong>: {{ item.title }} (Due: {{ item.deadline }})
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(item.id)" />
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('inProgress')">
            <div class="text-center text-subtitle2 q-mb-sm">In Progress</div>
            <div
              v-for="item in sortedItems('inProgress')"
              :key="item.id"
              class="q-mb-sm bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(item)"
              @click="viewItem(item.id)"
            >
              <div>
                <strong>{{ item.type }}</strong>: {{ item.title }} (Due: {{ item.deadline }})
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(item.id)" />
            </div>
          </div>

          <!-- Done Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('done')">
            <div class="text-center text-subtitle2 q-mb-sm">Done</div>
            <div
              v-for="item in sortedItems('done')"
              :key="item.id"
              class="q-mb-sm bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(item)"
              @click="viewItem(item.id)"
            >
              <div>
                <strong>{{ item.type }}</strong>: {{ item.title }} (Due: {{ item.deadline }})
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(item.id)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right-side Form Panel -->
      <div
        class="fixed-top-right"
        style="width: 260px; top: 60px; right: 10px; bottom: 10px; overflow-y: auto; padding: 10px 0px;"
      >
        <q-btn label="Add Item" icon="add" color="secondary" class="full-width q-mb-md" @click="toggleForm = !toggleForm" />

        <div class="q-my-md flex flex-center">
          <q-circular-progress show-value :value="completionPercent" size="80px" color="green" track-color="grey-3">
            {{ completionPercent }}%
          </q-circular-progress>
        </div>

        <!-- Item Form -->
        <div v-if="toggleForm" class="bg-white">
          <q-form @submit.prevent="addItem" style="padding: 5px 15px">
            <q-select
              v-model="itemForm.type"
              :options="['Task', 'Project', 'Portfolio', 'Other']"
              label="Item Type (select or type)"
              dense
              use-input
              input-debounce="0"
              :error="!itemForm.type && formSubmitted"
              error-message="Item Type is required"
            />
            <q-input
              v-model="itemForm.title"
              label="Item Title"
              dense
              :error="!itemForm.title && formSubmitted"
              error-message="Title is required"
            />
            <q-input
              v-model="itemForm.deadline"
              label="Deadline"
              dense
              type="datetime-local"
              :error="!itemForm.deadline && formSubmitted"
              error-message="Deadline is required"
            />
            <q-select
              v-model="itemForm.status"
              :options="statusOptions"
              label="Status"
              dense
              :error="!itemForm.status && formSubmitted"
              error-message="Status is required"
            />
            <q-select
              v-model="itemForm.priority"
              :options="['Low', 'Medium', 'High']"
              label="Priority"
              dense
              :error="!itemForm.priority && formSubmitted"
              error-message="Priority is required"
            />
            <q-select
              v-model="itemForm.category"
              :options="categoryOptions"
              use-input
              use-chips
              label="Category"
              multiple
              dense
            />
            <div class="q-mt-sm">
              <div class="text-subtitle2">Subtasks</div>
              <div v-for="(subtask, index) in itemForm.subtasks" :key="index" class="row items-center q-mb-xs">
                <q-select
                  v-model="itemForm.subtasks[index].type"
                  :options="['Task', 'Project', 'Portfolio', 'Other']"
                  label="Subtask Type"
                  dense
                  use-input
                  input-debounce="0"
                  :error="!itemForm.subtasks[index].type && formSubmitted"
                  error-message="Subtask Type is required"
                />
                <q-input
                  v-model="itemForm.subtasks[index].title"
                  label="Subtask Title"
                  dense
                  class="q-ml-sm"
                  :error="!itemForm.subtasks[index].title && formSubmitted"
                  error-message="Subtask Title is required"
                />
                <q-btn flat round icon="remove" color="negative" size="sm" @click="itemForm.subtasks.splice(index, 1)" />
              </div>
              <q-btn flat icon="add" size="sm" color="secondary" @click="itemForm.subtasks.push({ type: '', title: '' })" />
            </div>
            <div class="q-mt-sm">
              <div class="text-subtitle2">Share With</div>
              <div v-for="(email, index) in itemForm.shareWith" :key="index" class="row items-center q-mb-xs">
                <q-input v-model="itemForm.shareWith[index]" dense class="col" type="email" />
                <q-btn flat round icon="remove" color="negative" size="sm" @click="itemForm.shareWith.splice(index, 1)" />
              </div>
              <q-btn flat icon="add" size="sm" color="secondary" @click="itemForm.shareWith.push('')" />
            </div>
            <div class="q-mt-sm">
              <div class="text-subtitle2">Backlog</div>
              <div v-for="(b, index) in itemForm.backlog" :key="index" class="row items-center q-mb-xs">
                <q-input v-model="itemForm.backlog[index]" dense class="col" />
                <q-btn flat round icon="remove" color="negative" size="sm" @click="itemForm.backlog.splice(index, 1)" />
              </div>
              <q-btn flat icon="add" size="sm" color="secondary" @click="itemForm.backlog.push('')" />
            </div>
            <q-btn type="submit" label="Save Item" color="secondary" class="q-mt-sm full-width" />
          </q-form>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentDate = new Date().toLocaleDateString()
const items = ref([])
const sortByPriority = ref(false)
const toggleForm = ref(false)
const formSubmitted = ref(false)

const categoryOptions = ref(['Development', 'Design', 'Marketing', 'Research', 'Others'])
const statusOptions = ref(['Backlog', 'In Progress', 'Done'])

const itemForm = ref({
  type: '',
  title: '',
  deadline: '',
  category: [],
  subtasks: [],
  shareWith: [],
  backlog: [],
  priority: '',
  status: ''
})

onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    console.log('User not authenticated, redirecting to login')
    window.location.href = 'http://localhost:9000/#/login'
  }
  const savedItems = localStorage.getItem('kanbanItems')
  if (savedItems) {
    items.value = JSON.parse(savedItems)
  }
})

const saveItems = () => {
  localStorage.setItem('kanbanItems', JSON.stringify(items.value))
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('kanbanItems')
  window.location.href = 'http://localhost:9000/#/login'
}

const addItem = () => {
  formSubmitted.value = true
  if (!itemForm.value.type || !itemForm.value.title || !itemForm.value.deadline || !itemForm.value.status || !itemForm.value.priority) {
    return
  }
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'inProgress',
    Done: 'done'
  }
  const parentId = Date.now()
  items.value.push({
    id: parentId,
    type: itemForm.value.type,
    title: itemForm.value.title,
    deadline: itemForm.value.deadline,
    status: statusMap[itemForm.value.status] || 'inProgress',
    priority: itemForm.value.priority,
    category: itemForm.value.category,
    subtasks: itemForm.value.subtasks.map((subtask, index) => ({
      id: parentId + index + 1,
      type: subtask.type,
      title: subtask.title,
      parentId: parentId,
      status: 'backlog'
    })),
    shareWith: itemForm.value.shareWith,
    backlog: itemForm.value.backlog,
    movedToDoneAt: itemForm.value.status === 'Done' ? Date.now() : null
  })
  resetForm(itemForm)
  toggleForm.value = false
  saveItems()
}

const viewItem = (id) => {
  router.push(`/itemDetail/${id}`)
}

function resetForm(form) {
  Object.keys(form.value).forEach((key) =>
    form.value[key] = Array.isArray(form.value[key]) ? [] : ''
  )
}

const deleteItem = (id) => {
  items.value = items.value.filter((item) => item.id !== id)
  saveItems()
}

function openProfile() {
  window.location.href = 'http://localhost:9000/#/profile'
}

// Drag & Drop
const draggedItem = ref(null)
const startDrag = (item) => { draggedItem.value = item }

const handleDrop = (newStatus) => {
  if (draggedItem.value) {
    if (newStatus === 'done' && draggedItem.value.status !== 'done') {
      draggedItem.value.movedToDoneAt = Date.now()
    }
    draggedItem.value.status = newStatus
    items.value = [...items.value]
    saveItems()
    draggedItem.value = null
  }
}

// Completion percentage
const completionPercent = computed(() => {
  if (items.value.length === 0) return 0
  const doneItems = items.value.filter((item) => item.status === 'done').length
  return Math.round((doneItems / items.value.length) * 100)
})

// Priority mapping for sorting
const priorityMap = {
  High: 3,
  Medium: 2,
  Low: 1,
  '': 0
}

// Sort items
const sortedItems = (status) => {
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'inProgress',
    Done: 'done'
  }
  const normalizedStatus = statusMap[status] || status.toLowerCase()
  const filtered = items.value.filter((item) => {
    const itemStatus = statusMap[item.status] || item.status.toLowerCase()
    return itemStatus === normalizedStatus
  })
  if (status === 'done') {
    return filtered.sort((a, b) => (a.movedToDoneAt || 0) - (b.movedToDoneAt || 0))
  }
  if (sortByPriority.value) {
    return filtered.sort((a, b) => {
      const priorityA = priorityMap[a.priority] || 0
      const priorityB = priorityMap[b.priority] || 0
      return priorityB - priorityA
    })
  }
  return filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
}
</script>

<style scoped>
.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
}
</style>
