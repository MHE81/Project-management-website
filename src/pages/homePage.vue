<template>
  <q-page class="q-pa-md">
    <!-- Top bar -->
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6">Date: {{ currentDate }}</div>
      <div class="q-gutter-sm">
        <q-btn
          round
          color="primary"
          icon="account_circle"
          @click="openProfile"
          aria-label="Go to profile"
        />
        <q-btn round flat color="negative" icon="logout" @click="logout" aria-label="Log out" />
      </div>
    </div>
    <q-toggle
      v-model="sortByPriority"
      label="Sort by"
      left-label
      checked-icon="sort"
      unchecked-icon="event"
      color="primary"
    />

    <!-- Error Banner -->
    <q-banner
      v-if="errorMessage"
      dense
      class="bg-negative text-white q-mb-md"
      aria-live="polite"
      role="alert"
    >
      {{ errorMessage }}
    </q-banner>

    <!-- Main layout -->
    <div class="row" style="height: calc(100vh - 120px)">
      <!-- Main content area -->
      <div
        class="col bg-grey-2 rounded-borders q-pa-md overflow-y-auto"
        style="margin-right: 280px; margin-bottom: 10px; width: calc(100% - 280px)"
      >
        <div class="row" style="min-height: 100%; flex-wrap: nowrap">
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
                <strong>{{ item.type }}</strong
                >: {{ item.title }} (Due: {{ item.deadline }})
              </div>
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="deleteItem(item.id)"
              />
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('in progress')">
            <div class="text-center text-subtitle2 q-mb-sm">In Progress</div>
            <div
              v-for="item in sortedItems('In Progress')"
              :key="item.id"
              class="q-mb-sm bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(item)"
              @click="viewItem(item.id)"
            >
              <div>
                <strong>{{ item.type }}</strong
                >: {{ item.title }} (Due: {{ item.deadline }})
              </div>
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="deleteItem(item.id)"
              />
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
                <strong>{{ item.type }}</strong
                >: {{ item.title }} (Due: {{ item.deadline }})
              </div>
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="deleteItem(item.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right-side Form Panel -->
      <div
        class="fixed-top-right"
        style="
          width: 260px;
          top: 60px;
          right: 10px;
          bottom: 10px;
          overflow-y: auto;
          padding: 10px 0px;
        "
      >
        <q-btn
          label="Add Item"
          icon="add"
          color="secondary"
          class="full-width q-mb-md"
          @click="toggleForm = !toggleForm"
        />

        <div class="q-my-md flex flex-center">
          <q-circular-progress
            show-value
            :value="completionPercent"
            size="80px"
            color="green"
            track-color="grey-3"
          >
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
              <div class="text-subtitle2">Subitems</div>
              <div
                v-for="(subitem, index) in itemForm.subitems"
                :key="index"
                class="row items-center q-mb-xs"
              >
                <q-select
                  v-model="itemForm.subitems[index].type"
                  :options="['Task', 'Project', 'Portfolio', 'Other']"
                  label="Subitem Type"
                  dense
                  use-input
                  input-debounce="0"
                  :error="!itemForm.subitems[index].type && formSubmitted"
                  error-message="Subitem Type is required"
                />
                <q-input
                  v-model="itemForm.subitems[index].title"
                  label="Subitem Title"
                  dense
                  class="q-ml-sm"
                  :error="!itemForm.subitems[index].title && formSubmitted"
                  error-message="Subitem Title is required"
                />
                <q-input
                  v-model="itemForm.subitems[index].deadline"
                  label="Deadline"
                  dense
                  type="datetime-local"
                  :max="itemForm.deadline || undefined"
                  :error="!itemForm.subitems[index].deadline && formSubmitted"
                  error-message="Deadline is required"
                  class="q-ml-sm"
                />
                <q-select
                  v-model="itemForm.subitems[index].status"
                  :options="statusOptions"
                  label="Status"
                  dense
                  class="q-ml-sm"
                  :error="!itemForm.subitems[index].status && formSubmitted"
                  error-message="Status is required"
                />
                <q-select
                  v-model="itemForm.subitems[index].priority"
                  :options="['Low', 'Medium', 'High']"
                  label="Priority"
                  dense
                  class="q-ml-sm"
                  :error="!itemForm.subitems[index].priority && formSubmitted"
                  error-message="Priority is required"
                />
                <q-btn
                  flat
                  round
                  icon="remove"
                  color="negative"
                  size="sm"
                  @click="itemForm.subitems.splice(index, 1)"
                />
              </div>
              <q-btn
                flat
                icon="add"
                size="sm"
                color="secondary"
                @click="
                  itemForm.subitems.push({
                    type: '',
                    title: '',
                    deadline: '',
                    status: 'backlog',
                    priority: 'Low',
                  })
                "
              />
            </div>
            <div class="q-mt-sm">
              <div class="text-subtitle2">Share With</div>
              <div
                v-for="(email, index) in itemForm.shareWith"
                :key="index"
                class="row items-center q-mb-xs"
              >
                <q-input v-model="itemForm.shareWith[index]" dense class="col" type="email" />
                <q-btn
                  flat
                  round
                  icon="remove"
                  color="negative"
                  size="sm"
                  @click="itemForm.shareWith.splice(index, 1)"
                />
              </div>
              <q-btn
                flat
                icon="add"
                size="sm"
                color="secondary"
                @click="itemForm.shareWith.push('')"
              />
            </div>
            <div class="q-mt-sm">
              <div class="text-subtitle2">Backlog</div>
              <div
                v-for="(b, index) in itemForm.backlog"
                :key="index"
                class="row items-center q-mb-xs"
              >
                <q-input v-model="itemForm.backlog[index]" dense class="col" />
                <q-btn
                  flat
                  round
                  icon="remove"
                  color="negative"
                  size="sm"
                  @click="itemForm.backlog.splice(index, 1)"
                />
              </div>
              <q-btn
                flat
                icon="add"
                size="sm"
                color="secondary"
                @click="itemForm.backlog.push('')"
              />
            </div>
            <q-btn type="submit" label="Save Item" color="secondary" class="q-mt-sm full-width" />
          </q-form>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' })
const items = ref([])
const sortByPriority = ref(false)
const toggleForm = ref(false)
const formSubmitted = ref(false)
const errorMessage = ref('')

const categoryOptions = ref(['Development', 'Design', 'Marketing', 'Research', 'Others'])
const statusOptions = ref(['Backlog', 'In Progress', 'Done'])

const itemForm = ref({
  type: '',
  title: '',
  deadline: '',
  category: [],
  subitems: [],
  shareWith: [],
  backlog: [],
  priority: '',
  status: '',
})

onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    console.log('User not authenticated, redirecting to login')
    router.push('/login')
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
  router.push('/login')
  console.log('User logged out')
}

const addItem = () => {
  formSubmitted.value = true
  if (
    !itemForm.value.type ||
    !itemForm.value.title ||
    !itemForm.value.deadline ||
    !itemForm.value.status ||
    !itemForm.value.priority
  ) {
    // errorMessage.value = 'Please fill all required fields'
    return
  }

  // اعتبارسنجی تاریخ ساب‌ایتم‌ها نسبت به والد
  const hasInvalidSubitemDeadline = itemForm.value.subitems.some(subitem => {
    if (subitem.deadline && itemForm.value.deadline) {
      return new Date(subitem.deadline) > new Date(itemForm.value.deadline)
    }
    return false
  })
  if (hasInvalidSubitemDeadline) {
    errorMessage.value = 'Subitem deadline cannot be after the parent item deadline.'
    return
  }

  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done',
  }
  const parentId = Date.now()
  const newItem = {
    id: parentId,
    type: itemForm.value.type,
    title: itemForm.value.title,
    deadline: itemForm.value.deadline,
    status: statusMap[itemForm.value.status] || 'in progress',
    priority: itemForm.value.priority,
    category: itemForm.value.category,
    subitems: itemForm.value.subitems.map((subitem, index) => ({
      id: parentId + index + 1,
      type: subitem.type,
      title: subitem.title,
      deadline: subitem.deadline,
      status: subitem.status || 'backlog',
      priority: subitem.priority || 'Low',
      parentId: parentId,
      category: [],
      shareWith: [],
      backlog: [],
      movedToDoneAt: null,
    })),
    shareWith: itemForm.value.shareWith,
    backlog: itemForm.value.backlog,
    movedToDoneAt: itemForm.value.status === 'Done' ? Date.now() : null,
  }
  items.value.push(newItem)
  resetForm(itemForm)
  toggleForm.value = false
  formSubmitted.value = false
  saveItems()
  errorMessage.value = ''
}

const viewItem = (id) => {
  router.push(`/itemDetail/${id}`)
}

function resetForm(form) {
  Object.keys(form.value).forEach(
    (key) => (form.value[key] = Array.isArray(form.value[key]) ? [] : ''),
  )
}

const deleteItem = (id) => {
  items.value = items.value.filter(
    (item) => item.id !== id && (!item.subitems || item.subitems.every((s) => s.id !== id)),
  )
  saveItems()
}

function openProfile() {
  router.push('/profile')
  console.log('Navigating to profile')
}

// Drag & Drop
const draggedItem = ref(null)
const startDrag = (item) => {
  draggedItem.value = item
}

const handleDrop = (newStatus) => {
  if (draggedItem.value) {
    if (newStatus === 'done') {
      const allSubitemsDone =
        !draggedItem.value.subitems ||
        draggedItem.value.subitems.every((sub) => sub.status === 'done')
      if (!allSubitemsDone) {
        errorMessage.value = 'Cannot move to Done: All subitems must be in Done status.'
        return
      }
      draggedItem.value.movedToDoneAt = Date.now()
    }
    draggedItem.value.status = newStatus
    items.value = [...items.value]
    saveItems()
    errorMessage.value = ''
    draggedItem.value = null
  }
}

// Completion percentage
const completionPercent = computed(() => {
  const rootItems = items.value.filter((item) => !item.parentId)
  console.log('Root items:', rootItems)
  if (rootItems.length === 0) return 0
  const doneItems = rootItems.filter((item) => item.status?.toLowerCase() === 'done').length
  console.log('Done items count:', doneItems, 'Total root items:', rootItems.length)
  return Math.round((doneItems / rootItems.length) * 100)
})

// Priority mapping for sorting
const priorityMap = {
  High: 3,
  Medium: 2,
  Low: 1,
  '': 0,
}

// Sort items
const sortedItems = (status) => {
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done',
  }
  const normalizedStatus = statusMap[status] || status.toLowerCase()
  const filtered = items.value.filter((item) => {
    const itemStatus = item.status?.toLowerCase() || ''
    console.log(
      `Checking item - Column: ${status}, Item ID: ${item.id}, Item Status: ${item.status}, Normalized Item Status: ${itemStatus}, Normalized Status: ${normalizedStatus}`,
    )
    return !item.parentId && itemStatus === normalizedStatus
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

// Watch for localStorage changes with force refresh
watch(
  () => localStorage.getItem('kanbanItems'),
  async (newValue) => {
    if (newValue) {
      items.value = JSON.parse(newValue)
      console.log('kanbanItems updated, reloading items:', items.value)
      await nextTick()
    }
  },
)
</script>

<style scoped>
.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
}
</style>
