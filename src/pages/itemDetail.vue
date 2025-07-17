<template>
  <q-page class="q-pa-md">
    <!-- Item Name at the Top Center -->
    <div v-if="item" class="text-h4 q-mb-md text-center full-width">
      {{ item.type || 'Item' }}: {{ item.title || 'Untitled' }}
    </div>
    <div v-else class="text-h4 q-mb-md text-center full-width text-negative">Item not found (ID: {{ route.params.id }})</div>

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

    <!-- Debug Banner for toggleSubitemForm -->
    <!-- <q-banner
      v-if="item"
      dense
      class="bg-blue text-white q-mb-md"
      aria-live="polite"
      role="status"
    >
      Subitem Form Status: {{ toggleSubitemForm ? 'Open' : 'Closed' }}
    </q-banner> -->

    <!-- Selected Report Display (Editable) -->
    <div v-if="item && selectedReport" class="q-mb-md">
      <div class="text-subtitle1">Editing Report:</div>
      <textarea
        v-model="selectedReport.details"
        placeholder="Edit your report here..."
        class="resizable-note custom-textarea"
      />
      <div class="row q-mt-sm">
        <q-btn label="Save Report" color="positive" @click="saveEditedReport" class="q-mr-sm" />
        <q-btn label="Cancel" color="negative" flat @click="cancelEditReport" />
      </div>
    </div>

    <!-- Note Display -->
    <div v-if="item && item.note && !isEditingNote" class="q-mb-md">
      <div class="text-subtitle1">Note:</div>
      <div class="q-pa-sm bg-grey-2 rounded-borders resizable-note" v-html="item.note.replace(/\n/g, '<br>')"></div>
      <div class="row q-mt-sm">
        <q-btn label="Edit Note" color="primary" @click="toggleNoteEdit(true)" class="q-mr-sm" />
        <q-btn label="Delete Note" color="negative" flat @click="deleteNote" />
      </div>
    </div>

    <!-- Note Edit Form -->
    <div v-if="item && isEditingNote" class="q-mb-md">
      <div class="text-subtitle1">Edit Note:</div>
      <textarea
        v-model="item.note"
        placeholder="Enter your note here..."
        class="resizable-note custom-textarea"
      />
      <div class="row q-mt-sm">
        <q-btn label="Save Note" color="positive" @click="saveNote" class="q-mr-sm" />
        <q-btn label="Cancel" color="negative" flat @click="cancelNoteEdit" />
      </div>
    </div>
    <q-btn v-if="item && !item.note && !isEditingNote" label="Add Note" color="secondary" @click="toggleNoteEdit(true)" class="q-mb-md" />

    <!-- Report Form -->
    <div v-if="item && isAddingReport && !selectedReport" class="q-mb-md">
      <div class="text-subtitle1">New Report:</div>
      <q-input
        v-model="newReportDetails"
        placeholder="Enter what you have done..."
        dense
        :error="!newReportDetails && reportFormSubmitted"
        error-message="Details are required"
        class="q-mb-md"
      />
      <div class="row">
        <q-btn label="Save Report" color="positive" @click="saveReport" class="q-mr-sm" />
        <q-btn label="Cancel" color="negative" flat @click="cancelReport" />
      </div>
    </div>

    <!-- Parent Chain Info -->
    <div v-if="parentChain.length" class="text-subtitle1 q-mb-md">
      <span>
        <span v-for="(parent, index) in parentChain" :key="parent.id">
          {{ parent.type }}: {{ parent.title }}{{ index < parentChain.length - 1 ? ' -> ' : '' }}
        </span>
        -> <strong>{{ item.type }}: {{ item.title }}</strong>
      </span>
    </div>

    <!-- Main layout -->
    <div v-if="item" class="row" style="height: calc(100vh - 180px)">
      <!-- Left Side Box (Item Details) -->
      <div class="col-2 bg-grey-2 rounded-borders q-pa-md" style="margin-right: 10px; height: 100%;">
        <div class="bg-white" style="padding: 15px">
          <div class="text-subtitle2 q-mb-xs">Details</div>
          <div>Type: {{ item.type || 'N/A' }}</div>
          <q-input v-model="item.title" label="Title" dense :error="!item.title && formSubmitted" :disable="!isEditing" error-message="Title is required" class="q-mt-md" />
          <q-input v-model="item.deadline" label="Deadline" dense type="datetime-local" :disable="!isEditing" :max="directParent?.deadline || undefined" class="q-mt-md" />
          <q-select v-model="item.status" :options="statusOptions" label="Status" dense :disable="!isEditing" class="q-mt-md" />
          <q-select v-model="item.priority" :options="['Low', 'Medium', 'High']" label="Priority" dense :disable="!isEditing" class="q-mt-md" />
          <q-select v-model="item.category" :options="categoryOptions" use-input use-chips label="Category" multiple dense :disable="!isEditing" class="q-mt-md" />
          <q-btn v-if="!isEditing" label="Edit" color="primary" class="full-width q-mt-md" @click="toggleEdit(true)" />
          <q-btn v-else label="Save" color="positive" class="full-width q-mt-md" @click="saveDetails" />
        </div>
      </div>

      <!-- Main Content Area (Subitems Kanban) -->
      <div class="col-7 bg-grey-2 rounded-borders q-pa-md overflow-y-auto" style="height: 100%;">
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
            <div class="text-center text-subtitle2 q-mb-md">In Progress</div>
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
            <div class="text-center text-subtitle2 q-mb-md">Done</div>
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
        <!-- Add New Report Button (Plus Icon) -->
        <q-btn
          v-if="item && !isAddingReport && !selectedReport"
          round
          color="secondary"
          icon="add"
          @click="toggleReportForm(true)"
          class="q-mb-md"
          size="sm"
        />

        <!-- Reports Box -->
        <div v-if="item && item.reports && item.reports.length" class="q-mb-md">
          <div class="text-subtitle1">Reports:</div>
          <div class="bg-grey-2 rounded-borders q-pa-sm reports-box">
            <div
              v-for="(report, index) in sortedReports"
              :key="index"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs row items-center justify-between cursor-pointer"
              @click="selectReport(report, index)"
            >
              <div class="text-ellipsis single-line">{{ report.date }} - {{ truncateText(report.details) }}</div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteReportFromBox(report, index)" />
            </div>
          </div>
        </div>

        <!-- Subitem Form and Buttons -->
        <div class="bg-white" style="padding: 15px">
          <div v-if="!toggleSubitemForm" class="q-my-md flex flex-center">
            <q-circular-progress show-value :value="completionPercent" size="80px" color="green" track-color="grey-3">
              {{ completionPercent }}%
            </q-circular-progress>
          </div>
          <div v-if="!toggleSubitemForm">
            <q-btn label="Save Changes" color="secondary" class="full-width q-mb-xs" @click="saveItem" />
            <q-btn label="New Subitem" color="secondary" class="full-width q-mb-xs" @click="openSubitemForm" />
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
                :max="item.deadline || undefined"
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
              <div class="row q-mt-sm">
                <q-btn type="submit" label="Save Subitem" color="secondary" class="full-width q-mr-sm" />
                <q-btn flat label="Cancel" color="negative" class="full-width" @click="cancelSubitemForm" />
              </div>
            </q-form>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center q-mt-lg text-negative">Loading item reports...</div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' })
const item = ref(null)
const directParent = ref(null)
const sortByPriority = ref(false)
const draggedItem = ref(null)
const formSubmitted = ref(false)
const subitemFormSubmitted = ref(false)
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
const itemId = ref(0)
const isEditingNote = ref(false)
const originalNote = ref('')
const isAddingReport = ref(false)
const newReportDetails = ref('')
const reportFormSubmitted = ref(false)
const selectedReport = ref(null)
const selectedReportIndex = ref(null)
const isEditing = ref(false)

const setEditingState = (id, state) => {
  localStorage.setItem(`isEditing_${id}`, JSON.stringify(state))
}

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
  itemId.value = parseInt(route.params.id)
  console.log('Loading item with id:', itemId.value, 'from items:', items)
  item.value = findItemById(items, itemId.value)
  if (!item.value) {
    console.error('Item not found for id:', itemId.value, 'in items:', items)
    errorMessage.value = 'Item not found.'
    setTimeout(() => {
      router.push('/home')
    }, 3000)
    return
  }

  if (item.value.parentId) {
    directParent.value = findItemById(items, item.value.parentId)
  } else {
    directParent.value = null
  }

  isEditing.value = false
  setEditingState(itemId.value, false)
  toggleSubitemForm.value = false
  isEditingNote.value = false
  isAddingReport.value = false
  selectedReport.value = null
  selectedReportIndex.value = null
  resetSubitemForm()
  if (!item.value.note) item.value.note = ''
  if (!item.value.reports) item.value.reports = []
  console.log('Loaded item reports:', item.value.reports)
}

watch(() => route.params.id, (newId) => {
  console.log('Route changed to id:', newId)
  loadItems()
})

const openSubitemForm = () => {
  console.log('Opening subitem form, setting toggleSubitemForm to true, subitemForm:', subitemForm.value)
  toggleSubitemForm.value = true
  errorMessage.value = ''
}

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
      router.push('/home')
    }
  } else {
    console.warn('Item with id', id, 'not found for deletion')
  }
}

const viewItem = (id) => {
  console.log('Clicking subitem with id:', id)
  if (id) {
    router.push(`/itemDetail/${id}`)
  } else {
    console.error('No valid id provided for viewItem')
  }
}

const addSubitem = () => {
  subitemFormSubmitted.value = true
  if (!subitemForm.value.type || !subitemForm.value.title || !subitemForm.value.deadline || !subitemForm.value.status || !subitemForm.value.priority) {
    errorMessage.value = 'Please fill all required fields'
    return
  }

  if (item.value.deadline && subitemForm.value.deadline) {
    if (new Date(subitemForm.value.deadline) > new Date(item.value.deadline)) {
      errorMessage.value = 'Subitem deadline cannot be after the parent item deadline.'
      return
    }
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
      movedToDoneAt: subitemForm.value.status === 'Done' ? Date.now() : null,
      note: ''
    }
    console.log('Adding subitem with id:', newSubitem.id)
    item.value.subitems = item.value.subitems || []
    item.value.subitems.push(newSubitem)
    saveItem()
    resetSubitemForm()
    toggleSubitemForm.value = false
    errorMessage.value = ''
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
  if (item.value) {
    updateItem(items, item.value)
    localStorage.setItem('kanbanItems', JSON.stringify(items))
    console.log('Item saved with reports:', item.value.reports)
    loadItems()
  }
}

const saveDetails = () => {
  formSubmitted.value = true
  if (!item.value.title) {
    errorMessage.value = 'Please fill all required fields'
    return
  }

  if (directParent.value?.deadline && item.value.deadline) {
    if (new Date(item.value.deadline) > new Date(directParent.value.deadline)) {
      errorMessage.value = 'Item deadline cannot be after the direct parent item deadline.'
      return
    }
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
  setEditingState(itemId.value, value)
  if (!value) {
    formSubmitted.value = true
  }
}

const cancelSubitemForm = () => {
  resetSubitemForm()
  toggleSubitemForm.value = false
  errorMessage.value = ''
}

const toggleNoteEdit = (value) => {
  if (value) {
    originalNote.value = item.value.note
  }
  isEditingNote.value = value
  if (!value && !item.value.note) {
    item.value.note = ''
  }
}

const cancelNoteEdit = () => {
  item.value.note = originalNote.value
  isEditingNote.value = false
  errorMessage.value = ''
}

const saveNote = () => {
  if (item.value.note && item.value.note.trim()) {
    saveItem()
    isEditingNote.value = false
    errorMessage.value = ''
  } else {
    errorMessage.value = 'Note cannot be empty.'
  }
}

const deleteNote = () => {
  item.value.note = ''
  saveItem()
  errorMessage.value = ''
}

const toggleReportForm = (value) => {
  if (value) {
    newReportDetails.value = ''
    reportFormSubmitted.value = false
  }
  isAddingReport.value = value
  if (value) {
    selectedReport.value = null
    selectedReportIndex.value = null
  }
}

const cancelReport = () => {
  isAddingReport.value = false
  errorMessage.value = ''
}

const saveReport = () => {
  reportFormSubmitted.value = true
  if (!newReportDetails.value || !newReportDetails.value.trim()) {
    errorMessage.value = 'Report details cannot be empty.'
    return
  }

  const currentDateTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' })
  const newReport = {
    date: currentDateTime,
    details: newReportDetails.value
  }

  item.value.reports = item.value.reports || []
  item.value.reports.unshift(newReport)
  console.log('New report added:', newReport)
  saveItem()
  isAddingReport.value = false
  newReportDetails.value = ''
  errorMessage.value = ''
}

const selectReport = (report, index) => {
  selectedReport.value = { ...report }
  selectedReportIndex.value = index
  isAddingReport.value = false
}

const cancelEditReport = () => {
  selectedReport.value = null
  selectedReportIndex.value = null
  errorMessage.value = ''
}

const saveEditedReport = () => {
  if (!selectedReport.value || !selectedReport.value.details || !selectedReport.value.details.trim()) {
    errorMessage.value = 'Report details cannot be empty.'
    return
  }
  if (selectedReportIndex.value !== null && item.value.reports && item.value.reports.length > selectedReportIndex.value) {
    item.value.reports[selectedReportIndex.value] = { ...selectedReport.value, date: item.value.reports[selectedReportIndex.value].date }
    console.log('Report updated at index:', selectedReportIndex.value, 'new details:', selectedReport.value.details)
    saveItem()
  } else {
    console.error('Invalid report index:', selectedReportIndex.value, 'or reports array:', item.value.reports)
    errorMessage.value = 'Error updating report.'
  }
  selectedReport.value = null
  selectedReportIndex.value = null
  errorMessage.value = ''
}

const deleteReportFromBox = (report, index) => {
  if (item.value.reports && item.value.reports.length > index) {
    item.value.reports.splice(index, 1)
    console.log('Report deleted at index:', index)
    saveItem()
  } else {
    console.error('Invalid report index or reports array:', index, item.value.reports)
  }
  errorMessage.value = ''
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

const sortedReports = computed(() => {
  return [...(item.value?.reports || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('kanbanItems')
  router.push('/login')
  console.log('User logged out')
}

const openProfile = () => {
  router.push('/profile')
  console.log('Navigating to profile')
}

watch(() => localStorage.getItem('kanbanItems'), (newValue) => {
  if (newValue) {
    loadItems()
  }
})

const truncateText = (text) => {
  const maxLength = 30
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>

<style scoped>
.resizable-note {
  resize: both;
  overflow: auto;
  min-height: 50px;
  max-height: 200px;
  min-width: 200px;
  max-width: 100%;
  width: 50%;
  word-wrap: break-word;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.custom-textarea {
  resize: both;
  overflow: auto;
  min-height: 50px;
  max-height: 200px;
  min-width: 200px;
  max-width: 100%;
  width: 50%;
  word-wrap: break-word;
  padding: 8px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
  height: calc(100vh - 255px);
}

.reports-box {
  max-height: 100px;
  overflow-y: auto;
  width: 100%;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.full-width {
  width: 100%;
}
</style>
