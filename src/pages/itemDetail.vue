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

    <!-- Item Type and Name -->
    <div v-if="item" class="text-h5 q-mb-md">
      {{ item.type || 'Item' }}: {{ item.title || 'Untitled' }}
    </div>
    <div v-else class="text-h5 q-mb-md text-negative">Item not found</div>

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
          label="Sort by Priority"
          left-label
          checked-icon="sort"
          unchecked-icon="event"
          color="primary"
          class="q-mb-md"
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
              <div>
                <strong>{{ subitem.type }}</strong>: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(subitem.id)" />
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('inProgress')">
            <div class="text-center text-subtitle2 q-mb-sm">In Progress</div>
            <div
              v-for="subitem in sortedSubitems('inProgress')"
              :key="subitem.id"
              class="q-mb-xs bg-white q-pa-sm shadow-1 row justify-between items-center"
              draggable="true"
              @dragstart="startDrag(subitem)"
              @click="viewItem(subitem.id)"
            >
              <div>
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
              <div>
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
          <div class="q-my-md flex flex-center">
            <q-circular-progress show-value :value="completionPercent" size="80px" color="green" track-color="grey-3">
              {{ completionPercent }}%
            </q-circular-progress>
          </div>
          <q-btn label="Save Changes" color="secondary" class="full-width q-mb-xs" @click="saveItem" />
          <q-btn label="New Subitem" color="secondary" class="full-width q-mb-xs" @click="addNewSubitem" />
          <q-btn label="New Report" color="secondary" class="full-width q-mb-xs" />
          <q-btn label="Share With" color="secondary" class="full-width q-mb-xs" />
          <q-btn label="Call" color="secondary" class="full-width q-mb-xs" />
        </div>
      </div>
    </div>
    <div v-else class="text-center q-mt-lg text-negative">Loading item details...</div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' })
const item = ref(null)
const parentItem = ref(null)
const sortByPriority = ref(false)
const draggedItem = ref(null)
const formSubmitted = ref(false)
const statusOptions = ref(['Backlog', 'In Progress', 'Done'])
const categoryOptions = ref(['Development', 'Design', 'Marketing', 'Research', 'Others'])
const isEditing = ref(false)

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
  const token = localStorage.getItem('authToken')
  if (!token) {
    console.log('User not authenticated, redirecting to login')
    window.location.href = 'http://localhost:9000/#/login'
    return
  }

  const items = JSON.parse(localStorage.getItem('kanbanItems') || '[]')
  const itemId = parseInt(route.params.id)
  console.log('Loading item with id:', itemId, 'from', items)
  item.value = findItemById(items, itemId)
  if (!item.value) {
    console.error('Item not found for id:', itemId)
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
})

const startDrag = (item) => {
  draggedItem.value = item
}

const handleDrop = (newStatus) => {
  if (draggedItem.value) {
    if (newStatus === 'done' && draggedItem.value.status !== 'done') {
      draggedItem.value.movedToDoneAt = Date.now()
    }
    draggedItem.value.status = newStatus
    saveItem()
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
  deleteRecursive(items, id)
  localStorage.setItem('kanbanItems', JSON.stringify(items))
  if (item.value && item.value.id === id) {
    item.value = null
  }
}

const viewItem = (id) => {
  router.push(`/itemDetail/${id}`)
}

const addNewSubitem = () => {
  if (item.value) {
    const newSubitem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: 'Task',
      title: 'New Subitem',
      deadline: '',
      status: 'backlog',
      priority: 'Low',
      parentId: item.value.id,
      category: [],
      subitems: [],
      shareWith: [],
      backlog: [],
      movedToDoneAt: null
    }
    item.value.subitems.push(newSubitem)
    saveItem()
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
  updateItem(items, item.value)
  localStorage.setItem('kanbanItems', JSON.stringify(items))
  console.log('Item saved with status:', item.value.status)
}

const saveDetails = () => {
  saveItem()
  toggleEdit(false)
}

const toggleEdit = (value) => {
  isEditing.value = value
  if (!value) {
    formSubmitted.value = true
  }
}

// const completionPercent = computed(() => {
//   if (!item.value) return 0
//   const allItems = [item.value].concat(item.value.subitems || []) // فقط خود ایتم و زیرمورد‌های مستقیم
//   if (allItems.length === 0) return 0
//   const doneItems = allItems.filter(item => item.status === 'done').length
//   return Math.round((doneItems / allItems.length) * 100)
// })

const completionPercent = computed(() => {
  if (!item.value?.subitems?.length) return 0
  const doneSubitems = item.value.subitems.filter((s) => s.status === 'done').length
  return Math.round((doneSubitems / item.value.subitems.length) * 100)
})

const sortedSubitems = (status) => {
  const getAllSubitems = (item) => {
    let allSubitems = []
    if (item.subitems) {
      item.subitems.forEach(sub => {
        allSubitems.push(sub)
        allSubitems = allSubitems.concat(getAllSubitems(sub))
      })
    }
    return allSubitems
  }
  return getAllSubitems(item.value).filter((s) => s.status === status) || []
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
</script>

<style scoped>
.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
  height: calc(100vh - 255px)
}
</style>
