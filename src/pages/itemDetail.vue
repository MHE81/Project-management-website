```vue
<template>
  <q-page class="q-pa-md bg-primary" style="min-height: 100vh; overflow-y: auto;">
    <!-- Loading State -->
    <div v-if="!item && !errorMessage" class="text-center q-mt-lg">
      <q-spinner color="primary" size="3em" />
      <div>Loading item...</div>
    </div>
    <!-- Item Name and User Role -->
    <div v-if="item" class="text-h4 q-mb-md text-center full-width">
      {{ item.type || 'Item' }}: {{ item.title || 'Untitled' }}
    </div>
    <div v-if="item" class="text-subtitle1 q-mb-md text-center">
      Your Role: {{ currentUserRole }}
    </div>
    <div v-else-if="errorMessage" class="text-h4 q-mb-md text-center full-width text-negative">{{ errorMessage }} (ID: {{ route.params.id }})</div>

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

    <!-- New Report Form -->
    <div v-if="item && isAddingReport && !selectedReport" class="q-mb-md">
      <div class="text-subtitle1">New Report:</div>
      <q-input
        v-model="newReportDetails"
        placeholder="Enter what you have done..."
        dense
        :error="!newReportDetails && reportFormSubmitted"
        error-message="Details are required"
        class="q-mb-md"
        :disable="!canEdit"
      />
      <div class="row">
        <q-btn label="Save Report" color="positive" @click="saveReport" class="q-mr-sm" :disable="!canEdit" />
        <q-btn label="Cancel" color="negative" flat @click="cancelReport" />
      </div>
    </div>

    <!-- Selected Report Display (Editable) -->
    <div v-if="item && selectedReport" class="q-mb-md">
      <div class="text-subtitle1">Editing Report:</div>
      <textarea
        v-model="selectedReport.details"
        placeholder="Edit your report here..."
        class="resizable-note custom-textarea"
        :disabled="!canEdit"
      />
      <div class="row q-mt-sm">
        <q-btn label="Save Report" color="positive" @click="saveEditedReport" class="q-mr-sm" :disable="!canEdit" />
        <q-btn label="Cancel" color="negative" flat @click="cancelEditReport" />
      </div>
    </div>

    <!-- Note Display -->
    <div v-if="item && item.note && !isEditingNote" class="q-mb-md">
      <div class="text-subtitle1">Note:</div>
      <div class="q-pa-sm bg-grey-2 rounded-borders resizable-note" v-html="item.note.replace(/\n/g, '<br>')"></div>
      <div class="row q-mt-sm">
        <q-btn label="Edit Note" color="primary" @click="toggleNoteEdit(true)" class="q-mr-sm" :disable="!isOwner" />
        <q-btn label="Delete Note" color="negative" flat @click="deleteNote" :disable="!isOwner" />
      </div>
    </div>

    <!-- Note Edit Form -->
    <div v-if="item && isEditingNote" class="q-mb-md">
      <div class="text-subtitle1">Edit Note:</div>
      <textarea
        v-model="item.note"
        placeholder="Enter your note here..."
        class="resizable-note custom-textarea"
        :disabled="!isOwner"
      />
      <div class="row q-mt-sm">
        <q-btn label="Save Note" color="positive" @click="saveNote" class="q-mr-sm" :disable="!isOwner" />
        <q-btn label="Cancel" color="negative" flat @click="cancelNoteEdit" />
      </div>
    </div>
    <q-btn v-if="item && !item.note && !isEditingNote" label="Add Note" color="secondary" @click="toggleNoteEdit(true)" class="q-mb-md" :disable="!isOwner" />

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
    <div v-if="item" class="row equal-height-row">
      <!-- Left Side Box (Item Details) -->
      <div class="col-2 bg-grey-2 rounded-borders q-pa-md column-box" style="margin-right: 10px;">
        <div class="bg-white" style="padding: 15px;">
          <div class="text-subtitle2 q-mb-xs">Details</div>
          <div>Type: {{ item.type || 'N/A' }}</div>
          <q-input v-model="item.title" label="Title" dense :error="!item.title && formSubmitted" :disable="!isEditing || !isOwner" error-message="Title is required" class="q-mt-md" />
          <q-input v-model="item.deadline" label="Deadline" dense type="datetime-local" :disable="!isEditing || !isOwner" :max="directParent?.deadline || undefined" class="q-mt-md" />
          <q-select v-model="item.status" :options="statusOptions" label="Status" dense :disable="!isEditing || !isOwner" class="q-mt-md" />
          <q-select v-model="item.priority" :options="['Low', 'Medium', 'High']" label="Priority" dense :disable="!isEditing || !isOwner" class="q-mt-md" />
          <q-select v-model="item.category" :options="categoryOptions" use-input use-chips label="Category" multiple dense :disable="!isEditing || !isOwner" class="q-mt-md" />
          <q-btn v-if="!isEditing" label="Edit" color="primary" class="full-width q-mt-md" @click="toggleEdit(true)" :disable="!isOwner" />
          <q-btn v-else label="Save" color="positive" class="full-width q-mt-md" @click="saveDetails" :disable="!isOwner" />
        </div>
      </div>

      <!-- Main Content Area (Subitems Kanban) -->
      <div class="col-7 bg-grey-2 rounded-borders q-pa-md column-box" style="overflow-y: auto;">
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
        <div class="row" style="flex-wrap: nowrap; height: 100%;">
          <!-- Backlog Column -->
          <div class="col-4" @dragover.prevent @drop="handleDrop('backlog')">
            <div class="text-center text-subtitle2 q-mb-sm">Backlog</div>
            <div
              v-for="subitem in sortedSubitems('backlog')"
              :key="subitem.id"
              class="q-mb-xs bg-white q-pa-sm shadow-1 row justify-between items-center"
              :draggable="canEdit"
              @dragstart="startDrag(subitem)"
              @click="viewItem(subitem.id)"
            >
              <div>
                <strong>{{ subitem.type }}</strong>: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
                <div v-if="subitem.assignedTo" class="text-caption">
                  Assigned: {{ subitem.assignedTo.username }} ({{ subitem.assignedTo.role }})
                </div>
                <div v-if="subitem.shareWith && subitem.shareWith.length" class="text-caption">
                  Shared: {{ subitem.shareWith.map(s => `${s.username} (${s.role}${s.status ? ', ' + s.status : ''})`).join(', ') }}
                </div>
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(subitem.id)" :disable="!canEdit" />
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('in progress')">
            <div class="text-center text-subtitle2 q-mb-md">In Progress</div>
            <div
              v-for="subitem in sortedSubitems('in progress')"
              :key="subitem.id"
              class="q-mb-xs bg-white q-pa-sm shadow-1 row justify-between items-center"
              :draggable="canEdit"
              @dragstart="startDrag(subitem)"
              @click="viewItem(subitem.id)"
            >
              <div>
                <strong>{{ subitem.type }}</strong>: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
                <div v-if="subitem.assignedTo" class="text-caption">
                  Assigned: {{ subitem.assignedTo.username }} ({{ subitem.assignedTo.role }})
                </div>
                <div v-if="subitem.shareWith && subitem.shareWith.length" class="text-caption">
                  Shared: {{ subitem.shareWith.map(s => `${s.username} (${s.role}${s.status ? ', ' + s.status : ''})`).join(', ') }}
                </div>
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(subitem.id)" :disable="!canEdit" />
            </div>
          </div>

          <!-- Done Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('done')">
            <div class="text-center text-subtitle2 q-mb-md">Done</div>
            <div
              v-for="subitem in sortedSubitems('done')"
              :key="subitem.id"
              class="q-mb-xs bg-white q-pa-sm shadow-1 row justify-between items-center"
              :draggable="canEdit"
              @dragstart="startDrag(subitem)"
              @click="viewItem(subitem.id)"
            >
              <div>
                <strong>{{ subitem.type }}</strong>: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
                <div v-if="subitem.assignedTo" class="text-caption">
                  Assigned: {{ subitem.assignedTo.username }} ({{ subitem.assignedTo.role }})
                </div>
                <div v-if="subitem.shareWith && subitem.shareWith.length" class="text-caption">
                  Shared: {{ subitem.shareWith.map(s => `${s.username} (${s.role}${s.status ? ', ' + s.status : ''})`).join(', ') }}
                </div>
              </div>
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteItem(subitem.id)" :disable="!canEdit" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Box -->
      <div class="col-2 bg-grey-2 rounded-borders q-pa-md column-box" style="margin-left: 10px; width: 350px; max-height: calc(100vh - 200px); overflow-y: auto;">
        <!-- Shared With Section -->
        <div v-if="item" class="q-mb-md">
          <div class="text-subtitle1">Shared With:</div>
          <div class="q-pa-sm bg-grey-2 rounded-borders">
            <div v-if="item.shareWith && item.shareWith.length" class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs">
              <div v-for="(share, index) in item.shareWith" :key="index" class="row items-center q-mb-xs">
                {{ share.username }} <span class="text-weight-bold">({{ share.role }}{{ share.status ? ', ' + share.status : '' }})</span>
                <q-btn
                  v-if="isOwner && share.role !== 'owner' && (!share.status || share.status === 'accepted')"
                  flat
                  round
                  icon="remove"
                  color="negative"
                  size="sm"
                  @click="removeSharedUser(index)"
                />
              </div>
            </div>
            <div v-else class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative">
              Not shared with anyone
            </div>
          </div>
          <q-btn
            v-if="isOwner"
            label="Share With"
            color="secondary"
            class="full-width"
            @click="openShareDialog"
          />
        </div>

        <!-- Assignment Section -->
        <div v-if="item" class="q-mb-md">
          <div class="text-subtitle1">Assigned To:</div>
          <div class="q-pa-sm bg-grey-2 rounded-borders">
            <div v-if="item.assignedTo" class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs">
              {{ item.assignedTo.username }} <span class="text-weight-bold">({{ item.assignedTo.role }})</span>
              <q-btn
                v-if="canAssign"
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="removeAssignment"
              />
            </div>
            <div v-else class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative">
              Not assigned
            </div>
          </div>
          <q-btn
            v-if="canAssign"
            label="Assign Item"
            color="secondary"
            class="full-width"
            @click="openAssignDialog"
          />
        </div>

        <!-- Add New Report Button (Plus Icon) -->
        <q-btn
          v-if="item && !isAddingReport && !selectedReport"
          round
          color="secondary"
          icon="add"
          @click="toggleReportForm(true)"
          class="q-mb-md"
          size="sm"
          :disable="!canEdit"
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
              <q-btn flat round icon="delete" color="negative" size="sm" @click.stop="deleteReportFromBox(report, index)" :disable="!canEdit" />
            </div>
          </div>
        </div>
        <div v-else-if="item && item.reports && !item.reports.length" class="q-mb-md text-center text-negative">
          No reports available.
        </div>

        <!-- Subitem Form and Buttons -->
        <div class="bg-white" style="padding: 15px;">
          <div v-if="!toggleSubitemForm" class="q-my-md flex flex-center">
            <q-circular-progress show-value :value="completionPercent" size="80px" color="green" track-color="grey-3">
              {{ completionPercent }}%
            </q-circular-progress>
          </div>
          <div v-if="!toggleSubitemForm">
            <q-btn label="Save Changes" color="secondary" class="full-width q-mb-xs" @click="saveItem" :disable="!canEdit && !isOwner" />
            <q-btn label="New Subitem" color="secondary" class="full-width q-mb-xs" @click="openSubitemForm" :disable="!canEdit" />
            <q-btn label="Call" color="secondary" class="full-width q-mb-xs" />
          </div>
          <div v-if="toggleSubitemForm" class="bg-white q-pa-md subitem-form">
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
                :disable="!canEdit"
              />
              <q-input
                v-model="subitemForm.title"
                label="Subitem Title"
                dense
                :error="!subitemForm.title && subitemFormSubmitted"
                error-message="Title is required"
                :disable="!canEdit"
              />
              <q-input
                v-model="subitemForm.deadline"
                label="Deadline"
                dense
                type="datetime-local"
                :max="item.deadline || undefined"
                :error="!subitemForm.deadline && subitemFormSubmitted"
                error-message="Deadline is required"
                :disable="!canEdit"
              />
              <q-select
                v-model="subitemForm.status"
                :options="statusOptions"
                label="Status"
                dense
                :error="!subitemForm.status && subitemFormSubmitted"
                error-message="Status is required"
                :disable="!canEdit"
              />
              <q-select
                v-model="subitemForm.priority"
                :options="['Low', 'Medium', 'High']"
                label="Priority"
                dense
                :error="!subitemForm.priority && subitemFormSubmitted"
                error-message="Priority is required"
                :disable="!canEdit"
              />
              <div class="row q-mt-sm">
                <q-btn type="submit" label="Save Subitem" color="secondary" class="full-width q-mr-sm" :disable="!canEdit" />
                <q-btn flat label="Cancel" color="negative" class="full-width" @click="cancelSubitemForm" />
              </div>
            </q-form>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Dialog -->
    <q-dialog v-model="showShareDialog" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Share With</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="addSharedUser">
            <div class="row items-center q-mb-md">
              <q-input
                v-model="searchUsername"
                label="Username"
                dense
                class="col-7 q-mr-sm"
                :error="usernameError"
                error-message="Invalid or already shared username"
                @input="searchUsers"
                aria-label="Enter username to share with"
                autocomplete="off"
                debounce="300"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-select
                v-model="selectedRole"
                :options="['admin', 'observer']"
                label="Role"
                dense
                class="col-4"
              />
            </div>
            <q-list bordered class="q-mb-md user-list" v-if="searchUsername && filteredUsers.value.length">
              <q-item
                v-for="user in filteredUsers.value"
                :key="user.username"
                clickable
                @click="selectUser(user)"
                class="user-item"
              >
                <q-item-section>{{ user.username }}</q-item-section>
              </q-item>
            </q-list>
            <q-item v-if="searchUsername && !filteredUsers.value.length && !isLoadingUsers" class="text-negative">
              <q-item-section>No users found</q-item-section>
            </q-item>
            <q-item v-if="isLoadingUsers" class="text-grey">
              <q-item-section>Loading users...</q-item-section>
            </q-item>
            <q-btn
              label="Add User"
              color="positive"
              type="submit"
              class="full-width q-mb-md"
              :disable="!searchUsername || usernameError || !isValidUsername"
            />
          </q-form>
          <div v-if="newSharedUsers.length" class="q-mt-md">
            <div class="text-subtitle2">Selected Users:</div>
            <div v-for="(share, index) in newSharedUsers" :key="index" class="row items-center q-mb-xs">
              <q-item-section>{{ share.username }} <span class="text-weight-bold">({{ share.role }})</span></q-item-section>
              <q-btn
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="newSharedUsers.splice(index, 1); searchUsers()"
              />
            </div>
          </div>
          <div v-if="item?.shareWith?.length" class="q-mt-md">
            <div class="text-subtitle2">Currently Shared With:</div>
            <div v-for="(share, index) in item.shareWith" :key="index" class="row items-center q-mb-xs">
              <q-item-section>{{ share.username }} <span class="text-weight-bold">({{ share.role }}{{ share.status ? ', ' + share.status : '' }})</span></q-item-section>
              <q-btn
                v-if="share.role !== 'owner' && (!share.status || share.status === 'accepted')"
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="removeSharedUser(index)"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup @click="closeShareDialog" />
          <q-btn label="Save" color="positive" @click="saveSharedUsers" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Assign Dialog -->
    <q-dialog v-model="showAssignDialog" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Assign Item</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="searchAssignUsername"
            label="Search Username"
            dense
            @input="searchAssignUsers"
            aria-label="Search for users to assign"
            autocomplete="off"
            debounce="300"
          />
          <q-list bordered class="q-mt-md user-list" v-if="filteredAssignUsers.value && filteredAssignUsers.value.length">
            <q-item
              v-for="user in filteredAssignUsers.value"
              :key="user.username"
              clickable
              @click="selectAssignee(user)"
              class="user-item"
            >
              <q-item-section>{{ user.username }} <span class="text-weight-bold">({{ user.role }})</span></q-item-section>
            </q-item>
          </q-list>
          <div v-if="!filteredAssignUsers.value || !filteredAssignUsers.value.length" class="q-mt-md text-negative">
            No eligible admin users found
          </div>
          <div v-if="selectedAssignee.value" class="q-mt-md">
            <div class="text-subtitle2">Selected Assignee:</div>
            <div class="row items-center q-mb-xs">
              <q-item-section>{{ selectedAssignee.value.username }} <span class="text-weight-bold">({{ selectedAssignee.value.role }})</span></q-item-section>
              <q-btn
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="selectedAssignee.value = null; searchAssignUsers()"
              />
            </div>
          </div>
          <div v-if="item?.assignedTo" class="q-mt-md">
            <div class="text-subtitle2">Currently Assigned To:</div>
            <div class="row items-center q-mb-xs">
              <q-item-section>{{ item.assignedTo.username }} <span class="text-weight-bold">({{ item.assignedTo.role }})</span></q-item-section>
              <q-btn
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="removeAssignment"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup @click="closeAssignDialog" />
          <q-btn label="Save" color="positive" :disable="!selectedAssignee.value" @click="saveAssignment" />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
const showShareDialog = ref(false)
const searchUsername = ref('')
const selectedRole = ref('observer')
const usernameError = ref(false)
const filteredUsers = ref([])
const newSharedUsers = ref([])
const showAssignDialog = ref(false)
const searchAssignUsername = ref('')
const filteredAssignUsers = ref([])
const availableUsers = ref([])
const isLoadingUsers = ref(false)
const selectedAssignee = ref(null)
const currentUser = ref(JSON.parse(localStorage.getItem('userProfile') || '{}')?.username || '')

// Compute current user's role
const currentUserRole = computed(() => {
  if (!item.value) return 'N/A'
  if (item.value.creator === currentUser.value) return 'owner'
  const userShare = item.value.shareWith?.find(share => share.username === currentUser.value && (!share.status || share.status === 'accepted'))
  return userShare ? userShare.role : 'observer'
})

const isOwner = computed(() => {
  return item.value?.creator === currentUser.value
})

const isValidUsername = computed(() => {
  if (!searchUsername.value || !Array.isArray(availableUsers.value)) {
    console.log('isValidUsername: Invalid input or availableUsers is not an array')
    return false
  }
  const isValid = availableUsers.value.some(user =>
    user.username && user.username.toLowerCase() === searchUsername.value.toLowerCase()
  )
  console.log('isValidUsername:', isValid, 'for username:', searchUsername.value)
  return isValid
})

const canEdit = computed(() => {
  if (isOwner.value) return true
  const userShare = item.value?.shareWith?.find(share => share.username === currentUser.value && (!share.status || share.status === 'accepted'))
  return userShare?.role === 'admin'
})

const canAssign = computed(() => {
  const result = isOwner.value || item.value?.shareWith?.find(share => share.username === currentUser.value && share.role === 'admin' && (!share.status || share.status === 'accepted'))?.role === 'admin'
  console.log('canAssign:', result, 'isOwner:', isOwner.value, 'shareWith:', item.value?.shareWith, 'currentUser:', currentUser.value)
  return result
})

watch(() => localStorage.getItem('kanbanUsers'), (newValue) => {
  const users = JSON.parse(newValue || '[]')
  availableUsers.value = Array.isArray(users) ? users : []
  console.log('kanbanUsers updated:', availableUsers.value)
})

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
  console.log('Initial kanbanUsers:', localStorage.getItem('kanbanUsers'))
  console.log('Initial userProfile:', localStorage.getItem('userProfile'))
  console.log('availableUsers on mount:', availableUsers.value)
})

const loadItems = () => {
  const items = JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]')
  itemId.value = Number(route.params.id)
  item.value = findItemById(items, itemId.value)
  if (!item.value) {
    errorMessage.value = 'Item not found.'
    setTimeout(() => {
      router.push('/home')
    }, 3000)
    return
  }
  if (!item.value.shareWith) item.value.shareWith = [{ username: currentUser.value, role: 'owner' }]
  if (!item.value.creator) item.value.creator = currentUser.value
  if (!item.value.assignedTo) item.value.assignedTo = null
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
  console.log('Loaded item:', item.value)
  console.log('shareWith data:', item.value.shareWith)
}

watch(() => route.params.id, () => {
  loadItems()
})

const openSubitemForm = () => {
  if (!canEdit.value) return
  toggleSubitemForm.value = true
  errorMessage.value = ''
}

const startDrag = (item) => {
  if (canEdit.value) {
    draggedItem.value = item
  }
}

const handleDrop = (newStatus) => {
  if (!canEdit.value) return
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
  if (!canEdit.value) return
  const items = JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]')
  const deleteRecursive = (items, itemId) => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        if (!isOwner.value && items[i].creator === currentUser.value) {
          errorMessage.value = 'Only the owner can delete this item.'
          return false
        }
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
    localStorage.setItem(`kanbanItems_${currentUser.value}`, JSON.stringify(items))
    loadItems()
    if (item.value && item.value.id === id) {
      router.push('/home')
    }
  }
}

const viewItem = (id) => {
  if (id) {
    router.push(`/itemDetail/${id}`)
  }
}

const addSubitem = () => {
  if (!canEdit.value) return
  subitemFormSubmitted.value = true
  if (
    !subitemForm.value.type ||
    !subitemForm.value.title ||
    !subitemForm.value.deadline ||
    !subitemForm.value.status ||
    !subitemForm.value.priority
  ) {
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
      shareWith: [...item.value.shareWith],
      backlog: [],
      movedToDoneAt: subitemForm.value.status === 'Done' ? Date.now() : null,
      note: '',
      creator: currentUser.value,
      assignedTo: null,
    }
    item.value.subitems = item.value.subitems || []
    item.value.subitems.push(newSubitem)
    saveItem()
    resetSubitemForm()
    toggleSubitemForm.value = false
    errorMessage.value = ''
  }
}

const saveItem = () => {
  const items = JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]')
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
    localStorage.setItem(`kanbanItems_${currentUser.value}`, JSON.stringify(items))
    loadItems()
  }
}

const saveDetails = () => {
  if (!isOwner.value) return
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
  if (!isOwner.value) return
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
  if (!isOwner.value) return
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
  if (!isOwner.value) return
  if (item.value.note && item.value.note.trim()) {
    saveItem()
    isEditingNote.value = false
    errorMessage.value = ''
  } else {
    errorMessage.value = 'Note cannot be empty.'
  }
}

const deleteNote = () => {
  if (!isOwner.value) return
  item.value.note = ''
  saveItem()
  errorMessage.value = ''
}

const toggleReportForm = (value) => {
  if (!canEdit.value && value) return
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
  if (!canEdit.value) return
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
  if (!canEdit.value) return
  if (!selectedReport.value || !selectedReport.value.details || !selectedReport.value.details.trim()) {
    errorMessage.value = 'Report details cannot be empty.'
    return
  }
  if (selectedReportIndex.value !== null && item.value.reports && item.value.reports.length > selectedReportIndex.value) {
    item.value.reports[selectedReportIndex.value] = { ...selectedReport.value, date: item.value.reports[selectedReportIndex.value].date }
    saveItem()
  }
  selectedReport.value = null
  selectedReportIndex.value = null
  errorMessage.value = ''
}

const deleteReportFromBox = (report, index) => {
  if (!canEdit.value) return
  if (item.value.reports && item.value.reports.length > index) {
    item.value.reports.splice(index, 1)
    saveItem()
  }
  errorMessage.value = ''
}

const openShareDialog = () => {
  if (!isOwner.value) return
  showShareDialog.value = true
  searchUsername.value = ''
  selectedRole.value = 'observer'
  usernameError.value = false
  filteredUsers.value = []
  newSharedUsers.value = []
  isLoadingUsers.value = true
  const users = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  availableUsers.value = Array.isArray(users) ? users : []
  isLoadingUsers.value = false
  console.log('Opening Share Dialog, availableUsers:', availableUsers.value)
}

const closeShareDialog = () => {
  showShareDialog.value = false
  searchUsername.value = ''
  selectedRole.value = 'observer'
  usernameError.value = false
  filteredUsers.value = []
  newSharedUsers.value = []
  isLoadingUsers.value = false
}

const searchUsers = () => {
  console.log('searchUsers called, searchUsername:', searchUsername.value)
  console.log('availableUsers:', availableUsers.value)
  console.log('currentUser:', currentUser.value)
  console.log('item.shareWith:', item.value?.shareWith)
  console.log('newSharedUsers:', newSharedUsers.value)

  if (!Array.isArray(availableUsers.value)) {
    console.log('Error: availableUsers is not an array:', availableUsers.value)
    filteredUsers.value = []
    usernameError.value = true
    console.log('filteredUsers set to:', filteredUsers.value)
    return
  }

  if (!searchUsername.value) {
    filteredUsers.value = []
    usernameError.value = false
    console.log('No search term, clearing filteredUsers:', filteredUsers.value)
    return
  }

  filteredUsers.value = availableUsers.value.filter(user => {
    if (!user.username) {
      console.log('Invalid user object:', user)
      return false
    }
    return user.username.toLowerCase().includes(searchUsername.value.toLowerCase())
  })
  usernameError.value = searchUsername.value && !filteredUsers.value.length
  console.log('filteredUsers set to:', filteredUsers.value)
  console.log('usernameError:', usernameError.value)
}

const selectUser = (user) => {
  console.log('Selected user:', user)
  searchUsername.value = user.username
  usernameError.value = false
  filteredUsers.value = availableUsers.value.filter(u =>
    u.username.toLowerCase().includes(searchUsername.value.toLowerCase())
  )
  console.log('After selectUser, searchUsername:', searchUsername.value)
  console.log('After selectUser, filteredUsers:', filteredUsers.value)
}

const addSharedUser = () => {
  console.log('Adding user:', searchUsername.value, 'Role:', selectedRole.value)
  if (!searchUsername.value) {
    errorMessage.value = 'لطفاً یک نام کاربری وارد کنید'
    usernameError.value = true
    console.log('No username entered')
    return
  }
  if (!isValidUsername.value) {
    errorMessage.value = 'لطفاً یک نام کاربری معتبر انتخاب کنید'
    usernameError.value = true
    console.log('Invalid username:', searchUsername.value)
    return
  }
  if (item.value.shareWith?.some(s => s.username === searchUsername.value) ||
      newSharedUsers.value.some(s => s.username === searchUsername.value)) {
    errorMessage.value = 'این کاربر قبلاً به اشتراک گذاشته شده است'
    usernameError.value = true
    console.log('User already shared:', searchUsername.value)
    return
  }
  newSharedUsers.value.push({ username: searchUsername.value, role: selectedRole.value, status: 'pending' })
  searchUsername.value = ''
  selectedRole.value = 'observer'
  usernameError.value = false
  filteredUsers.value = []
  console.log('newSharedUsers:', newSharedUsers.value)
  console.log('After addSharedUser, filteredUsers:', filteredUsers.value)
}

const removeSharedUser = (index) => {
  if (!isOwner.value) return
  const user = item.value.shareWith[index]
  if (user.status === 'pending') {
    const invitations = JSON.parse(localStorage.getItem(`kanbanInvitations_${user.username}`) || '[]')
    const inviteIndex = invitations.findIndex(inv => inv.itemId === item.value.id && inv.username === user.username)
    if (inviteIndex !== -1) {
      invitations.splice(inviteIndex, 1)
      localStorage.setItem(`kanbanInvitations_${user.username}`, JSON.stringify(invitations))
    }
  }
  item.value.shareWith.splice(index, 1)
  if (item.value.subitems) {
    item.value.subitems.forEach(subitem => {
      subitem.shareWith = [...item.value.shareWith]
    })
  }
  saveItem()
}

const saveSharedUsers = () => {
  if (!isOwner.value) return
  const shareUsernames = newSharedUsers.value
    .filter(share => share.username && share.username !== currentUser.value)
    .map(share => share.username)
  shareUsernames.forEach(username => {
    const invitations = JSON.parse(localStorage.getItem(`kanbanInvitations_${username}`) || '[]')
    const share = newSharedUsers.value.find(s => s.username === username)
    if (share) {
      invitations.push({
        itemId: item.value.id,
        username: username,
        role: share.role,
        status: 'pending',
        invitedAt: Date.now(),
        invitedBy: currentUser.value,
      })
      saveInvitations(invitations, username)
    }
  })
  item.value.shareWith = [...item.value.shareWith, ...newSharedUsers.value]
  if (item.value.subitems) {
    item.value.subitems.forEach(subitem => {
      subitem.shareWith = [...item.value.shareWith]
    })
  }
  saveItem()
  showShareDialog.value = false
  searchUsername.value = ''
  selectedRole.value = 'observer'
  usernameError.value = false
  filteredUsers.value = []
  newSharedUsers.value = []
}

const openAssignDialog = () => {
  if (!canAssign.value) {
    console.log('Cannot open Assign Dialog: canAssign is false')
    return
  }
  console.log('Assign Item button clicked, opening dialog')
  showAssignDialog.value = true
  searchAssignUsername.value = ''
  selectedAssignee.value = null
  if (!item.value || !Array.isArray(item.value.shareWith)) {
    console.log('Error: item.shareWith is not valid:', item.value?.shareWith)
    filteredAssignUsers.value = []
    return
  }
  filteredAssignUsers.value = item.value.shareWith.filter(share => {
    if (!share.username || !share.role) {
      console.log('Invalid share object:', share)
      return false
    }
    const isAdmin = share.role.toLowerCase() === 'admin'
    const isNotAssigned = !item.value.assignedTo || item.value.assignedTo.username !== share.username
    const isAccepted = !share.status || share.status === 'accepted'
    console.log(`Checking user: ${share.username}, isAdmin: ${isAdmin}, isNotAssigned: ${isNotAssigned}, isAccepted: ${isAccepted}`)
    return isAdmin && isNotAssigned && isAccepted
  })
  console.log('Opening Assign Dialog, shareWith:', item.value.shareWith)
  console.log('Initial filteredAssignUsers:', filteredAssignUsers.value)
}

const closeAssignDialog = () => {
  showAssignDialog.value = false
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
  selectedAssignee.value = null
  console.log('Closed Assign Dialog')
}

const searchAssignUsers = () => {
  console.log('searchAssignUsers called, searchAssignUsername:', searchAssignUsername.value)
  if (!item.value || !Array.isArray(item.value.shareWith)) {
    console.log('Error: item.shareWith is not valid:', item.value?.shareWith)
    filteredAssignUsers.value = []
    return
  }
  filteredAssignUsers.value = item.value.shareWith.filter(share => {
    if (!share.username || !share.role) {
      console.log('Invalid share object:', share)
      return false
    }
    const matchesSearch = !searchAssignUsername.value ||
      share.username.toLowerCase().includes(searchAssignUsername.value.toLowerCase())
    const isAdmin = share.role.toLowerCase() === 'admin'
    const isNotAssigned = !item.value.assignedTo || item.value.assignedTo.username !== share.username
    const isAccepted = !share.status || share.status === 'accepted'
    console.log(`Checking user: ${share.username}, matchesSearch: ${matchesSearch}, isAdmin: ${isAdmin}, isNotAssigned: ${isNotAssigned}, isAccepted: ${isAccepted}`)
    return matchesSearch && isAdmin && isNotAssigned && isAccepted
  })
  console.log('filteredAssignUsers:', filteredAssignUsers.value)
}

const selectAssignee = (user) => {
  console.log('Selecting assignee:', user)
  selectedAssignee.value = { username: user.username, role: user.role }
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
  console.log('Selected assignee:', selectedAssignee.value)
}

const saveAssignment = () => {
  if (!canAssign.value) {
    console.log('Cannot save assignment: canAssign is false')
    return
  }
  if (!selectedAssignee.value) {
    errorMessage.value = 'لطفاً یک کاربر را برای اختصاص دادن انتخاب کنید'
    return
  }
  item.value.assignedTo = { ...selectedAssignee.value }
  if (item.value.subitems) {
    item.value.subitems.forEach(subitem => {
      if (subitem.assignedTo && subitem.assignedTo.username === item.value.assignedTo?.username) {
        subitem.assignedTo = item.value.assignedTo
      }
    })
  }
  saveItem()
  showAssignDialog.value = false
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
  selectedAssignee.value = null
  console.log('Assignment saved, item:', item.value)
}

const removeAssignment = () => {
  if (!canAssign.value) {
    console.log('Cannot remove assignment: canAssign is false')
    return
  }
  item.value.assignedTo = null
  if (item.value.subitems) {
    item.value.subitems.forEach(subitem => {
      if (subitem.assignedTo && subitem.assignedTo.username === item.value.assignedTo?.username) {
        subitem.assignedTo = null
      }
    })
  }
  saveItem()
  console.log('Assignment removed, item:', item.value)
}

function saveInvitations(invitations, username) {
  localStorage.setItem(`kanbanInvitations_${username}`, JSON.stringify(invitations))
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
  const items = JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]')
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
  localStorage.removeItem('userProfile')
  router.push('/login')
}

const openProfile = () => {
  router.push('/profile')
}

watch(() => localStorage.getItem(`kanbanItems_${currentUser.value}`), (newValue) => {
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
  height: 100%;
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

.subitem-form {
  max-height: 400px;
  overflow-y: auto;
}

.equal-height-row {
  display: flex;
  align-items: stretch;
  min-height: calc(100vh - 200px);
}

.column-box {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow-y: auto;
}

.user-list {
  max-height: 200px;
  overflow-y: auto;
  z-index: 2000;
  background-color: white;
  border: 1px solid #ccc;
  position: relative;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.user-item {
  padding: 8px;
  cursor: pointer;
}

.user-item:hover {
  background-color: #f5f5f5;
}
</style>
```
