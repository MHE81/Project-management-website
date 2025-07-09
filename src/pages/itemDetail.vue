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

    <!-- Item Type and Name -->
    <div v-if="item" class="text-h5 q-mb-md">
      {{ item.type || 'Item' }}: {{ item.title || 'Untitled' }}
    </div>
    <div v-else class="text-h5 q-mb-md text-negative">Item not found (ID: {{ route.params.id }})</div>

    <!-- Parent Chain Info -->
    <div v-if="parentChain.length" class="text-subtitle1 q-mb-md">
      <span v-for="(parent, index) in parentChain" :key="parent.id">
        Parent: {{ parent.type }}: {{ parent.title }}{{ index < parentChain.length - 1 ? ' > ' : '' }}
      </span>
    </div>

    <!-- Main layout -->
    <div v-if="item" class="row" style="height: calc(100vh - 180px)">
      <!-- Left Side Box (Item Details) -->
      <div class="col-3 bg-grey-2 rounded-borders q-pa-md" style="margin-right: 10px; height: 100%;">
        <div class="bg-white" style="padding: 15px">
          <div class="text-subtitle2 q-mb-xs">Details</div>
          <div>Type: {{ item.type || 'N/A' }}</div>
          <q-input v-model="item.title" label="Title" dense :error="!item.title && formSubmitted" :disable="!isEditing" error-message="Title is required" class="q-mt-md" />
          <q-input v-model="item.deadline" label="Deadline" dense type="datetime-local" :disable="!isEditing" class="q-mt-md" />
          <q-select v-model="item.status" :options="statusOptions" label="Status" dense :disable="!isEditing" class="q-mt-md" />
          <q-select v-model="item.priority" :options="['Low', 'Medium', 'High']" label="Priority" dense :disable="!isEditing" class="q-mt-md" />
          <q-select v-model="item.category" :options="categoryOptions" use-input use-chips label="Category" multiple dense :disable="!isEditing" class="q-mt-md" />
          <q-btn v-if="!isEditing" label="Edit" color="primary" class="full-width q-mt-md" @click="toggleEdit(true)" />
          <q-btn v-else label="Save" color="positive" class="full-width q-mt-md" @click="saveDetails" />
        </div>
      </div>

      <!-- Main Content Area (Subitems Kanban) -->
      <div class="col-6 bg-grey-2 rounded-borders q-pa-md overflow-y-auto" style="height: 100%;">
        <q-toggle
          v-model="sortByPriority"
          label="Sort by"
          left-label
          checked-icon="sort"
          unchecked-icon="event"
          color="primary"
          class="q-mb-md"
          @update:model-value="sortSubitems"
        />
        <div class="row" style="height: 100%; flex-wrap: nowrap;">
          <!-- Backlog Column -->
          <div class="col-4" @dragover.prevent @drop="handleDrop('backlog')">
            <div class="text-center text-subtitle2 q-mb-sm">Backlog</div>
            <div
              v-for="subitem in sortedSubitems('backlog')"
              :key="subitem.id"
              class="q-mb-xs bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(subitem)"
              @click="viewItem(subitem.id)"
            >
              <div @click="console.log('Rendering subitem:', subitem)">
                <strong>{{ subitem.type }}</strong>: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(subitem.id)" />
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('in progress')">
            <div class="text-center text-subtitle2 q-mb-sm">In Progress</div>
            <div
              v-for="subitem in sortedSubitems('in progress')"
              :key="subitem.id"
              class="q-mb-xs bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(subitem)"
              @click="viewItem(subitem.id)"
            >
              <div @click="console.log('Rendering subitem:', subitem)">
                <strong>{{ subitem.type }}</strong>: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(subitem.id)" />
            </div>
          </div>

          <!-- Done Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('done')">
            <div class="text-center text-subtitle2 q-mb-sm">Done</div>
            <div
              v-for="subitem in sortedSubitems('done')"
              :key="subitem.id"
              class="q-mb-xs bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(subitem)"
              @click="viewItem(subitem.id)"
            >
              <div @click="console.log('Rendering subitem:', subitem)">
                <strong>{{ subitem.type }}</strong>: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(subitem.id)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Box -->
      <div class="col-2 bg-grey-2 rounded-borders q-pa-md" style="margin-left: 10px; width: 350px; height: 100%;">
        <div class="bg-white" style="padding: 15px">
          <div v-if="!toggleSubitemForm" class="q-my-md flex flex-center">
            <q-circular-progress show-value :value="completionPercent" size="80px" color="green" track-color="grey-3">
              {{ completionPercent }}%
            </q-circular-progress>
          </div>
          <div v-if="!toggleSubitemForm">
            <q-btn label="Save Changes" color="secondary" class="full-width q-mb-xs" @click="saveItem" />
            <q-btn label="New Subitem" color="secondary" class="full-width q-mb-xs" @click="toggleSubitemForm = true" />
            <q-btn label="New Report" color="secondary" class="full-width q-mb-xs" />
            <q-btn label="Share With" color="secondary" class="full-width q-mb-xs" />
            <q-btn label="Call" color="secondary" class="full-width q-mb-xs" />
          </div>
          <div v-if="toggleSubitemForm" class="bg-white q-pa-md">
            <q-form @submit.prevent="addSubitem" style="padding: 5px 15px">
              <q-select
                v-model="subitemForm.type"
                :options="['Task', 'Project', 'Portfolio', 'Other']"
                label="Subitem Type (select or type)"
                dense
                use-input
                input-debounce="0"
                :error="!subitemForm.type && subitemFormSubmitted"
                error-message="Subitem Type is required"
              />
              <q-input
                v-model="subitemForm.title"
                label="Subitem Title"
                dense
                :error="!subitemForm.title && subitemFormSubmitted"
                error-message="Title is required"
              />
              <q-input
                v-model="subitemForm.deadline"
                label="Deadline"
                dense
                type="datetime-local"
                :error="!subitemForm.deadline && subitemFormSubmitted"
                error-message="Deadline is required"
              />
              <q-select
                v-model="subitemForm.status"
                :options="statusOptions"
                label="Status"
                dense
                :error="!subitemForm.status && subitemFormSubmitted"
                error-message="Status is required"
              />
              <q-select
                v-model="subitemForm.priority"
                :options="['Low', 'Medium', 'High']"
                label="Priority"
                dense
                :error="!subitemForm.priority && subitemFormSubmitted"
                error-message="Priority is required"
              />
              <q-btn type="submit" label="Save Sub-item" color="secondary" class="q-mt-sm full-width" />
              <q-btn flat label="Cancel" color="negative" class="q-mt-sm full-width" @click="cancelSubitemForm" />
            </q-form>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center q-mt-lg text-negative">Loading item details...</div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' })
const item = ref(null)
const parentItem = ref(null)
const sortByPriority = ref(false)
const draggedItem = ref(null)
const formSubmitted = ref(false)
const subitemFormSubmitted = ref(false)
const isEditing = ref(false)
const toggleSubitemForm = ref(false)
const subitemForm = ref({
  type: '',
  title: '',
  deadline: '',
  status: '',
  priority: ''
})
const statusOptions = ref(['Backlog', 'In Progress', 'Done'])
const categoryOptions = ref(['Development', 'Design', 'Marketing', 'Research', 'Others'])
const errorMessage = ref('')

const findItemById = (items, id) => {
  for (let item of items) {
    if (item.id === id) return item
    if (item.subitems) {
      const found = findItemById(item.subitems, id)
      if (found) return found
    }
  }
  return null
}

onMounted(() => {
  loadItems()
})

const loadItems = () => {
  const items = JSON.parse(localStorage.getItem('kanbanItems') || '[]')
  const itemId = parseInt(route.params.id)
  console.log('Loading item with id:', itemId, 'from items:', items)
  item.value = findItemById(items, itemId)
  if (!item.value) {
    console.error('Item not found for id:', itemId, 'in items:', items)
    return
  }

  // Build parent chain
  const parentChainTemp = []
  let currentParentId = item.value.parentId
  while (currentParentId) {
    const parent = findItemById(items, currentParentId)
    if (parent) {
      parentChainTemp.unshift(parent)
      currentParentId = parent.parentId
    } else {
      break
    }
  }
  parentItem.value = parentChainTemp.length ? parentChainTemp[0] : null
}

watch(() => route.params.id, (newId) => {
  console.log('Route changed to id:', newId)
  loadItems()
})

const startDrag = (item) => {
  draggedItem.value = item
}

const handleDrop = (newStatus) => {
  if (draggedItem.value) {
    if (newStatus === 'done') {
      const allSubitemsDone = !draggedItem.value.subitems || draggedItem.value.subitems.every(sub => sub.status === 'done')
      if (!allSubitemsDone) {
        errorMessage.value = 'Cannot move to Done: All subitems must be in Done status.'
        return
      }
      draggedItem.value.movedToDoneAt = Date.now()
    }
    draggedItem.value.status = newStatus
    saveItem()
    errorMessage.value = ''
    draggedItem.value = null
  }
}

const deleteItem = (id) => {
  const items = JSON.parse(localStorage.getItem('kanbanItems') || '[]')
  const deleteRecursive = (items, itemId) => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        items.splice(i, 1)
        return true
      }
      if (items[i].subitems && deleteRecursive(items[i].subitems, itemId)) {
        return true
      }
    }
    return false
  }
  if (deleteRecursive(items, id)) {
    localStorage.setItem('kanbanItems', JSON.stringify(items))
    loadItems()
    if (item.value && item.value.id === id) {
      router.push('/homepage')
    }
  } else {
    console.warn('Item with id', id, 'not found for deletion')
  }
}

const viewItem = (id) => {
  console.log('Clicking subitem with id:', id)
  if (id) {
    router.push(`/itemDetail/${id}`);
  } else {
    console.error('No valid id provided for viewItem');
  }
}

const addSubitem = () => {
  subitemFormSubmitted.value = true
  if (!subitemForm.value.type || !subitemForm.value.title || !subitemForm.value.deadline || !subitemForm.value.status || !subitemForm.value.priority) {
    return
  }
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done'
  }
  if (item.value) {
    const newSubitem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: subitemForm.value.type,
      title: subitemForm.value.title,
      deadline: subitemForm.value.deadline,
      status: statusMap[subitemForm.value.status] || 'backlog',
      priority: subitemForm.value.priority,
      parentId: item.value.id,
      category: [],
      subitems: [],
      shareWith: [],
      backlog: [],
      movedToDoneAt: subitemForm.value.status === 'Done' ? Date.now() : null
    }
    console.log('Adding subitem with id:', newSubitem.id);
    item.value.subitems = item.value.subitems || []
    item.value.subitems.push(newSubitem)
    saveItem()
    resetSubitemForm()
    toggleSubitemForm.value = false
  }
}

const saveItem = () => {
  const items = JSON.parse(localStorage.getItem('kanbanItems') || '[]')
  const updateItem = (items, itemToUpdate) => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemToUpdate.id) {
        items[i] = { ...itemToUpdate }
        return true
      }
      if (items[i].subitems && updateItem(items[i].subitems, itemToUpdate)) {
        return true
      }
    }
    return false
  }
  if (item.value) updateItem(items, item.value)
  localStorage.setItem('kanbanItems', JSON.stringify(items))
  console.log('Item saved with status:', item.value.status)
  loadItems() // رفرش دستی بعد از ذخیره
}

const saveDetails = () => {
  formSubmitted.value = true
  if (!item.value.title) {
    return
  }
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done'
  }
  const newStatus = statusMap[item.value.status] || item.value.status.toLowerCase()
  if (newStatus === 'done') {
    const allSubitemsDone = !item.value.subitems || item.value.subitems.every(sub => sub.status === 'done')
    if (!allSubitemsDone) {
      errorMessage.value = 'Cannot set to Done: All subitems must be in Done status.'
      return
    }
    item.value.movedToDoneAt = Date.now()
  }
  item.value.status = newStatus
  saveItem()
  toggleEdit(false)
  errorMessage.value = ''
}

const toggleEdit = (value) => {
  isEditing.value = value
  if (!value) {
    formSubmitted.value = true
  }
}

const cancelSubitemForm = () => {
  resetSubitemForm()
  toggleSubitemForm.value = false
}

function resetSubitemForm() {
  subitemForm.value = {
    type: '',
    title: '',
    deadline: '',
    status: '',
    priority: ''
  }
  subitemFormSubmitted.value = false
}

const completionPercent = computed(() => {
  if (!item.value?.subitems?.length) return 0
  const doneSubitems = item.value.subitems.filter((s) => s.status === 'done').length
  return Math.round((doneSubitems / item.value.subitems.length) * 100)
})

const sortSubitems = () => {
  console.log('Sort by Priority toggled to:', sortByPriority.value)
}

const sortedSubitems = (status) => {
  let subitems = item.value?.subitems?.filter((s) => s.status.toLowerCase() === status.toLowerCase()) || []
  if (sortByPriority.value) {
    subitems.sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  } else {
    subitems.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  }
  return subitems
}

const parentChain = computed(() => {
  const chain = []
  let currentParentId = item.value?.parentId
  const items = JSON.parse(localStorage.getItem('kanbanItems') || '[]')
  while (currentParentId) {
    const parent = findItemById(items, currentParentId)
    if (parent) {
      chain.unshift(parent)
      currentParentId = parent.parentId
    } else {
      break
    }
  }
  return chain
})

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('kanbanItems')
  window.location.href = 'http://localhost:9000/#/login'
}

const openProfile = () => {
  window.location.href = 'http://localhost:9000/#/profile'
}

watch(() => localStorage.getItem('kanbanItems'), (newValue) => {
  if (newValue) {
    loadItems()
  }
})
</script>

<style scoped>
.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
  height: calc(100vh - 255px)
}
</style>
