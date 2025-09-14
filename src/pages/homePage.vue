<template>
  <q-page class="q-pa-md login-bg fixed-page">
    <div class="login-navbar">
      <div class="brand">
        <img src="/logo.png" alt="PLANOVA logo" class="brand-logo" />
        <span class="brand-title">PLANOVA</span>
      </div>
    </div>
    <!-- Top bar: date left, centered search, actions right -->
    <div class="row items-center q-mb-md topbar">
      <div class="col-3">
        <div class="date-pill">
          <q-icon name="event" size="sm" class="q-mr-xs" />
          {{ currentDate }}
        </div>
      </div>
      <div class="col-6 flex flex-center">
        <div class="row items-center no-wrap">
          <q-input
            v-model="searchQuery"
            placeholder="Search items..."
            dense
            outlined
            rounded
            bg-color="grey-3"
            class="text-black big-search-input"
            aria-label="Search items"
          />
          <q-btn round color="primary" icon="search" class="q-ml-sm" aria-label="Perform search" />
        </div>
      </div>
      <div class="col-3 row justify-end items-center q-gutter-sm">
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
    <div class="row items-center q-gutter-sm fancy-toggle">
      <q-toggle
        v-model="sortByPriority"
        label="Sort by"
        left-label
        checked-icon="sort"
        unchecked-icon="event"
        color="primary"
      />
      <q-btn
        dense
        round
        flat
        icon="notifications"
        color="primary"
        @click="showMessagesDialog = true"
        aria-label="Open messages"
      >
        <q-badge v-if="messages.length" floating color="negative" :label="messages.length" />
      </q-btn>
    </div>

    <!-- Error Banner -->
    <q-banner
      v-if="errorMessage"
      dense
      class="bg-negative text-white q-mb-md"
      style="width: fit-content; max-width: 100%; border-radius: 16px"
      aria-live="polite"
      role="alert"
    >
      {{ errorMessage }}
    </q-banner>

    <!-- Messages moved to dialog -->

    <!-- Main layout -->
    <div class="row board-row">
      <!-- Main content area -->
      <div
        class="col rounded-borders q-pa-md overflow-y-auto board-scroll"
        style="margin-right: 280px; margin-bottom: 10px; width: calc(100% - 280px)"
      >
        <div class="row" style="min-height: 100%; flex-wrap: nowrap">
          <!-- Backlog Column -->
          <div class="col-4" @dragover.prevent @drop="handleDrop('backlog')">
            <q-card class="board-surface column-card">
              <q-card-section class="row items-center justify-between">
                <div class="text-subtitle2">Backlog</div>
                <q-badge color="warning" text-color="black">{{
                  sortedItems('backlog').length
                }}</q-badge>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pt-sm column-scroll">
                <div
                  v-for="item in sortedItems('backlog').filter(
                    (i) =>
                      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.type.toLowerCase().includes(searchQuery.toLowerCase()),
                  )"
                  :key="item.id"
                  class="item-card"
                  :class="priorityClass(item.priority)"
                  :draggable="canEdit(item)"
                  @dragstart="startDrag(item)"
                  @click="viewItem(item.id)"
                >
                  <div class="row items-center justify-between">
                    <div class="ellipsis">
                      <strong>{{ item.type }}</strong
                      >: {{ item.title }}
                    </div>
                    <div class="text-caption">
                      {{ formatItemDate(item.deadline) }}
                    </div>
                  </div>
                  <div class="row justify-end q-mt-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click.stop="deleteItem(item.id)"
                      :disable="!canEdit(item)"
                      aria-label="Delete item"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- In Progress Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('in progress')">
            <q-card class="board-surface column-card">
              <q-card-section class="row items-center justify-between">
                <div class="text-subtitle2">In Progress</div>
                <q-badge color="primary">{{ sortedItems('In Progress').length }}</q-badge>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pt-sm column-scroll">
                <div
                  v-for="item in sortedItems('In Progress').filter(
                    (i) =>
                      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.type.toLowerCase().includes(searchQuery.toLowerCase()),
                  )"
                  :key="item.id"
                  class="item-card"
                  :class="priorityClass(item.priority)"
                  :draggable="canEdit(item)"
                  @dragstart="startDrag(item)"
                  @click="viewItem(item.id)"
                >
                  <div class="row items-center justify-between">
                    <div class="ellipsis">
                      <strong>{{ item.type }}</strong
                      >: {{ item.title }}
                    </div>
                    <div class="text-caption">
                      {{ formatItemDate(item.deadline) }}
                    </div>
                  </div>
                  <div class="row justify-end q-mt-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click.stop="deleteItem(item.id)"
                      :disable="!canEdit(item)"
                      aria-label="Delete item"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Done Column -->
          <div class="col-4 divider-col" @dragover.prevent @drop="handleDrop('done')">
            <q-card class="board-surface column-card">
              <q-card-section class="row items-center justify-between">
                <div class="text-subtitle2">Done</div>
                <q-badge color="positive">{{ sortedItems('done').length }}</q-badge>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pt-sm column-scroll">
                <div
                  v-for="item in sortedItems('done').filter(
                    (i) =>
                      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.type.toLowerCase().includes(searchQuery.toLowerCase()),
                  )"
                  :key="item.id"
                  class="item-card"
                  :class="priorityClass(item.priority)"
                  :draggable="canEdit(item)"
                  @dragstart="startDrag(item)"
                  @click="viewItem(item.id)"
                >
                  <div class="row items-center justify-between">
                    <div class="ellipsis">
                      <strong>{{ item.type }}</strong
                      >: {{ item.title }}
                    </div>
                    <div class="text-caption">
                      {{ formatItemDate(item.deadline) }}
                    </div>
                  </div>
                  <div class="row justify-end q-mt-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click.stop="deleteItem(item.id)"
                      :disable="!canEdit(item)"
                      aria-label="Delete item"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Right-side Panel (no white background) -->
      <div
        class="fixed-top-right"
        style="width: 260px; top: 123px; right: 10px; bottom: 10px; overflow-y: hidden; padding: 0"
      >
        <!-- Progress Chart (no white background) -->
        <div class="q-mb-md flex flex-center">
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
        <!-- Invitations Banner (no white background) -->
        <q-banner
          dense
          class="bg-yellow-9 text-white full-width q-mb-md right-btn text-center"
          aria-live="polite"
          role="alert"
        >
          <template v-if="pendingInvitations.length">
            Invitations ({{ pendingInvitations.length }})
            <q-btn
              flat
              label="View"
              color="white"
              @click="showInvitationsDialog = true"
              aria-label="View pending invitations"
            />
          </template>
          <template v-else> Invitations </template>
        </q-banner>
        <!-- Add Item Button (no white background) -->
        <q-btn
          label="Add Item"
          icon="add"
          color="secondary"
          class="full-width q-mb-md right-btn"
          @click="toggleForm = !toggleForm"
        />

        <!-- Item Form (rounded like cards, no extra background) -->
        <div v-if="toggleForm" class="bg-grey-2 q-pb-md board-surface form-scroll form-surface">
          <q-form @submit.prevent="addItem" class="q-pa-sm">
            <q-select
              v-model="itemForm.type"
              :options="itemTypeOptions"
              label="Item Type (select or type)"
              dense
              outlined
              rounded
              use-input
              input-debounce="0"
              new-value-mode="add-unique"
              :error="!itemForm.type && formSubmitted"
              error-message="Item Type is required"
              class="field-rounded field-spaced"
              popup-content-class="menu-rounded"
            />
            <q-input
              v-model="itemForm.title"
              label="Item Title"
              dense
              outlined
              rounded
              :error="!itemForm.title && formSubmitted"
              error-message="Title is required"
              class="field-rounded field-spaced"
            />
            <q-input
              v-model="itemForm.deadline"
              label="Deadline"
              dense
              outlined
              rounded
              color="primary"
              type="datetime-local"
              :error="!itemForm.deadline && formSubmitted"
              error-message="Deadline is required"
              class="field-rounded field-spaced deadline-input"
            />
            <q-select
              v-model="itemForm.status"
              :options="statusOptions"
              label="Status"
              dense
              outlined
              rounded
              :error="!itemForm.status && formSubmitted"
              error-message="Status is required"
              class="field-rounded field-spaced"
              popup-content-class="menu-rounded"
            />
            <q-select
              v-model="itemForm.priority"
              :options="['Low', 'Medium', 'High']"
              label="Priority"
              dense
              outlined
              rounded
              :error="!itemForm.priority && formSubmitted"
              error-message="Priority is required"
              class="field-rounded field-spaced"
              popup-content-class="menu-rounded"
            />
            <q-select
              v-model="itemForm.category"
              :options="categoryOptions"
              label="Category"
              multiple
              use-chips
              use-input
              new-value-mode="add-unique"
              dense
              outlined
              rounded
              :error="!itemForm.category.length && formSubmitted"
              error-message="Category is required"
              class="field-rounded field-spaced"
              popup-content-class="menu-rounded"
            />
            <!-- <div class="q-mt-sm">
              <div class="text-subtitle2">Subitems</div>
              <div
                v-for="(subitem, index) in itemForm.subitems"
                :key="index"
                class="row items-center q-mb-xs"
              >
                <q-select
                  v-model="itemForm.subitems[index].type"
                  :options="itemTypeOptions"
                  label="Subitem Type"
                  dense
                  outlined
                  rounded
                  use-input
                  input-debounce="0"
                  new-value-mode="add-unique"
                  :error="!itemForm.subitems[index].type && formSubmitted"
                  error-message="Subitem Type is required"
                  class="field-rounded field-spaced"
                  popup-content-class="menu-rounded"
                />
                <q-input
                  v-model="itemForm.subitems[index].title"
                  label="Subitem Title"
                  dense
                  outlined
                  rounded
                  class="q-ml-sm field-rounded field-spaced"
                  :error="!itemForm.subitems[index].title && formSubmitted"
                  error-message="Subitem Title is required"
                />
                <q-input
                  v-model="itemForm.subitems[index].deadline"
                  label="Deadline"
                  dense
                  outlined
                  rounded
                  color="primary"
                  type="datetime-local"
                  :max="itemForm.deadline || undefined"
                  :error="!itemForm.subitems[index].deadline && formSubmitted"
                  error-message="Deadline is required"
                  class="q-ml-sm field-rounded field-spaced deadline-input"
                />
                <q-select
                  v-model="itemForm.subitems[index].status"
                  :options="statusOptions"
                  label="Status"
                  dense
                  outlined
                  rounded
                  class="q-ml-sm field-rounded field-spaced"
                  :error="!itemForm.subitems[index].status && formSubmitted"
                  error-message="Status is required"
                  popup-content-class="menu-rounded"
                />
                <q-select
                  v-model="itemForm.subitems[index].priority"
                  :options="['Low', 'Medium', 'High']"
                  label="Priority"
                  dense
                  outlined
                  rounded
                  class="q-ml-sm field-rounded field-spaced"
                  :error="!itemForm.subitems[index].priority && formSubmitted"
                  error-message="Priority is required"
                  popup-content-class="menu-rounded"
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
            </div> -->
            <q-btn
              type="submit"
              label="Save Item"
              color="secondary"
              class="q-mt-sm full-width right-btn"
            />
          </q-form>
        </div>
      </div>
    </div>

    <!-- Invitations Dialog -->
    <q-dialog v-model="showInvitationsDialog" persistent>
      <q-card class="board-surface dialog-card" style="width: 640px; max-width: 92vw">
        <q-card-section class="row items-center justify-between q-gutter-sm">
          <div class="row items-center q-gutter-sm">
            <q-icon name="mail" color="primary" size="md" />
            <div class="text-h6 text-primary">Pending Invitations</div>
          </div>
          <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-list v-if="pendingInvitations.length" bordered separator>
            <q-item
              v-for="invitation in pendingInvitations"
              :key="invitation.itemId + '-' + invitation.username"
              class="invite-row"
            >
              <q-item-section>
                <div class="row items-center q-col-gutter-md">
                  <div class="col-12 text-subtitle2 text-primary">
                    {{ getItemTitleFromInvitation(invitation) }}
                  </div>
                  <div class="col-auto">
                    <div class="text-caption text-grey-7">Invited by</div>
                    <q-chip dense color="primary" text-color="white">{{
                      invitation.invitedBy
                    }}</q-chip>
                  </div>
                  <div class="col-auto">
                    <div class="text-caption text-grey-7">Role</div>
                    <q-chip dense color="secondary" text-color="white">{{
                      invitation.role
                    }}</q-chip>
                  </div>
                  <div class="col-auto">
                    <div class="text-caption text-grey-7">Date</div>
                    <div class="text-body2">
                      {{
                        new Date(invitation.invitedAt).toLocaleDateString('en-US', {
                          timeZone: 'Asia/Dubai',
                        })
                      }}
                    </div>
                  </div>
                </div>
              </q-item-section>
              <q-item-section side class="row items-center q-gutter-xs">
                <q-btn
                  dense
                  flat
                  color="positive"
                  label="Accept"
                  @click="acceptInvitation(invitation)"
                />
                <q-btn
                  dense
                  flat
                  color="negative"
                  label="Reject"
                  @click="rejectInvitation(invitation)"
                />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-negative q-pa-sm rounded-borders" style="border-radius: 16px">
            No pending invitations
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Messages Dialog -->
    <q-dialog v-model="showMessagesDialog">
      <q-card class="board-surface dialog-card" style="width: 560px; max-width: 92vw">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <q-icon name="notifications" color="primary" size="md" />
            <div class="text-h6 text-primary">Messages ({{ messages.length }})</div>
          </div>
          <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-list v-if="messages.length" bordered separator>
            <q-item v-for="(message, index) in messages" :key="index" class="invite-row">
              <q-item-section>
                <div class="text-body2">
                  {{ parseMessageText(message.text).text }}
                  <q-btn
                    v-if="parseMessageText(message.text).link"
                    flat
                    dense
                    color="primary"
                    label="View Item"
                    @click="navigateToItem(parseMessageText(message.text).link)"
                    class="q-ml-sm"
                    size="sm"
                  />
                </div>
                <div v-if="message.itemId" class="text-caption text-grey-7">
                  Item: {{ getItemTitleFromMessage(message) }}
                </div>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click="deleteMessage(index)"
                  aria-label="Delete message"
                />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-negative q-pa-sm rounded-borders" style="border-radius: 16px">
            No messages
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAutoDismiss } from '../composables/useAutoDismiss'

const router = useRouter()

// Auto-dismiss functionality
const { setupAutoDismiss } = useAutoDismiss()

const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' })
const items = ref([])
const searchQuery = ref('')
const sortByPriority = ref(false)
const toggleForm = ref(false)
const formSubmitted = ref(false)
const errorMessage = ref('')
const pendingInvitations = ref([])
const showInvitationsDialog = ref(false)
const messages = ref([])
const showMessagesDialog = ref(false)

const categoryOptions = ref(['Development', 'Design', 'Marketing', 'Research', 'Others'])
const statusOptions = ref(['Backlog', 'In Progress', 'Done'])
const itemTypeOptions = ref(['Story', 'Epic', 'Project', 'Task'])

const itemForm = ref({
  type: '',
  title: '',
  deadline: '',
  category: [],
  subitems: [],
  shareWith: [],
  priority: '',
  status: '',
})

const currentUser = ref(JSON.parse(localStorage.getItem('userProfile') || '{}')?.username || '')

onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    console.log('User not authenticated, redirecting to login')
    router.push('/login')
  }
  loadItems()
  loadInvitations()
  loadMessages()

  // Setup auto-dismiss for errorMessage banner
  setupAutoDismiss(errorMessage)
})

const loadItems = () => {
  const savedItems = localStorage.getItem(`kanbanItems_${currentUser.value}`)
  if (savedItems) {
    items.value = JSON.parse(savedItems)
  }
}

const loadInvitations = () => {
  const invitations = JSON.parse(
    localStorage.getItem(`kanbanInvitations_${currentUser.value}`) || '[]',
  )
  pendingInvitations.value = invitations.filter(
    (inv) => inv.username === currentUser.value && inv.status === 'pending',
  )
}

const loadMessages = () => {
  const savedMessages = JSON.parse(
    localStorage.getItem(`kanbanMessages_${currentUser.value}`) || '[]',
  )
  messages.value = savedMessages
}

const formatItemDate = (value) => {
  if (!value) return 'No due date'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'No due date'
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

const saveItems = () => {
  localStorage.setItem(`kanbanItems_${currentUser.value}`, JSON.stringify(items.value))
}

const saveInvitations = (invitations, username) => {
  localStorage.setItem(`kanbanInvitations_${username}`, JSON.stringify(invitations))
}

const saveMessages = () => {
  localStorage.setItem(`kanbanMessages_${currentUser.value}`, JSON.stringify(messages.value))
}

const parseMessageText = (text) => {
  // Check if message contains a link pattern like "/itemDetail/123"
  const linkMatch = text.match(/(.*?)\s+Click here to view the item:\s+(.*)$/)
  if (linkMatch) {
    return {
      text: linkMatch[1],
      link: linkMatch[2],
    }
  }
  return { text, link: null }
}

const navigateToItem = (link) => {
  if (link) {
    router.push(link)
  }
}

const canEdit = (item) => {
  if (!item) return false
  if (item.creator === currentUser.value) {
    console.log(`User ${currentUser.value} can edit ${item.title} - creator`)
    return true
  }
  const userShare = item.shareWith?.find((share) => share.username === currentUser.value)
  if (userShare && userShare.role === 'owner') {
    console.log(`User ${currentUser.value} can edit ${item.title} - owner`)
    return true
  }
  if (userShare && userShare.role === 'admin') {
    const isAssigned =
      item.assignedTo?.some((assignee) => assignee.username === currentUser.value) || false
    console.log(`User ${currentUser.value} can edit ${item.title} - admin assigned: ${isAssigned}`)
    return isAssigned
  }
  console.log(`User ${currentUser.value} cannot edit ${item.title} - no permissions`)
  return false
}

const extractSubitem = (items, itemId) => {
  for (let item of items) {
    if (item.id === itemId) return item
    if (item.subitems) {
      const found = extractSubitem(item.subitems, itemId)
      if (found) return found
    }
  }
  return null
}

// Helper function to get all subitem IDs from an item (recursively)
const getAllSubitemIds = (item) => {
  const ids = []
  if (item.subitems) {
    item.subitems.forEach((subitem) => {
      ids.push(subitem.id)
      ids.push(...getAllSubitemIds(subitem))
    })
  }
  return ids
}

// Helper function to find items that are subitems of the shared item
const findConflictingSubitems = (userItems, sharedItem) => {
  const conflictingItems = []
  const sharedSubitemIds = getAllSubitemIds(sharedItem)

  const checkItem = (items) => {
    items.forEach((item) => {
      if (sharedSubitemIds.includes(item.id)) {
        conflictingItems.push(item)
      }
      if (item.subitems) {
        checkItem(item.subitems)
      }
    })
  }

  checkItem(userItems)
  return conflictingItems
}

// Helper function to remove conflicting subitems from user's items
const removeConflictingSubitems = (userItems, conflictingItems) => {
  const conflictingIds = conflictingItems.map((item) => item.id)

  const filterItems = (items) => {
    return items.filter((item) => {
      if (conflictingIds.includes(item.id)) {
        return false
      }
      if (item.subitems) {
        item.subitems = filterItems(item.subitems)
      }
      return true
    })
  }

  return filterItems(userItems)
}

const acceptInvitation = (invitation) => {
  const invitations = JSON.parse(
    localStorage.getItem(`kanbanInvitations_${currentUser.value}`) || '[]',
  )
  const index = invitations.findIndex(
    (inv) => inv.itemId === invitation.itemId && inv.username === invitation.username,
  )
  if (index !== -1) {
    invitations.splice(index, 1)
    saveInvitations(invitations, currentUser.value)

    const creatorItems = JSON.parse(
      localStorage.getItem(`kanbanItems_${invitation.invitedBy}`) || '[]',
    )
    const sharedItem = extractSubitem(creatorItems, invitation.itemId)
    if (sharedItem) {
      const creatorShareIndex = sharedItem.shareWith.findIndex(
        (s) => s.username === currentUser.value,
      )
      if (creatorShareIndex !== -1) {
        // Get current user's items to check for conflicting subitems
        const userItems = JSON.parse(
          localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]',
        )

        // Find conflicting subitems that should be removed
        const conflictingItems = findConflictingSubitems(userItems, sharedItem)
        console.log(
          'Found conflicting items:',
          conflictingItems.map((item) => `${item.type}: ${item.title}`),
        )

        // Remove conflicting subitems from user's items
        const cleanedUserItems = removeConflictingSubitems(userItems, conflictingItems)
        console.log('Cleaned user items, removed', conflictingItems.length, 'conflicting subitems')

        // Update the shared item's role
        sharedItem.shareWith[creatorShareIndex] = {
          username: currentUser.value,
          role: invitation.role,
        }

        // Update all subitems with the new role
        const updateSubitemsRole = (item) => {
          if (item.subitems) {
            item.subitems.forEach((subitem) => {
              const subitemShareIndex = subitem.shareWith.findIndex(
                (s) => s.username === currentUser.value,
              )
              if (subitemShareIndex !== -1) {
                subitem.shareWith[subitemShareIndex] = {
                  username: currentUser.value,
                  role: invitation.role,
                }
              }
              updateSubitemsRole(subitem)
            })
          }
        }
        updateSubitemsRole(sharedItem)
        updateItemInUserStorage(sharedItem, invitation.invitedBy)

        // Create a clean copy of the shared item for the user
        const itemCopy = JSON.parse(JSON.stringify(sharedItem))
        itemCopy.shareWith = itemCopy.shareWith.map((s) => ({
          username: s.username,
          role: s.role,
        }))

        // Filter subitems based on current shareWith status for the accepting user
        const filterSubitemsForUser = (item, username) => {
          if (!item.subitems) return item

          const filteredItem = { ...item }
          filteredItem.subitems = item.subitems
            .filter((subitem) => {
              // Check if the user is currently in the subitem's shareWith list
              const userShare = subitem.shareWith?.find(
                (share) =>
                  share.username === username && (!share.status || share.status !== 'pending'),
              )
              console.log(
                `Filtering subitem ${subitem.type}: ${subitem.title} - userShare:`,
                userShare,
                'shareWith:',
                subitem.shareWith,
              )
              return !!userShare
            })
            .map((subitem) => {
              // Recursively filter nested subitems
              const filteredSubitem = { ...subitem }
              filteredSubitem.shareWith = subitem.shareWith.map((share) =>
                share.username === username ? { username, role: invitation.role } : share,
              )

              if (subitem.subitems) {
                filteredSubitem.subitems = subitem.subitems
                  .filter((nestedSubitem) => {
                    const nestedUserShare = nestedSubitem.shareWith?.find(
                      (share) =>
                        share.username === username &&
                        (!share.status || share.status !== 'pending'),
                    )
                    return !!nestedUserShare
                  })
                  .map((nestedSubitem) => {
                    const filteredNested = { ...nestedSubitem }
                    filteredNested.shareWith = nestedSubitem.shareWith.map((share) =>
                      share.username === username ? { username, role: invitation.role } : share,
                    )
                    return filteredNested
                  })
              }

              return filteredSubitem
            })

          return filteredItem
        }

        // Filter the item copy for the accepting user
        const filteredItemCopy = filterSubitemsForUser(itemCopy, currentUser.value)
        console.log(
          'Before filtering - subitems:',
          itemCopy.subitems?.map((s) => `${s.type}: ${s.title}`),
        )
        console.log(
          'After filtering - subitems:',
          filteredItemCopy.subitems?.map((s) => `${s.type}: ${s.title}`),
        )

        // Clean subitems pending status and ensure all subitems have the correct role
        const cleanSubitemsRole = (item) => {
          if (item.subitems) {
            item.subitems.forEach((subitem) => {
              subitem.shareWith = subitem.shareWith.map((s) => ({
                username: s.username,
                role: s.role,
              }))
              cleanSubitemsRole(subitem)
            })
          }
        }
        cleanSubitemsRole(filteredItemCopy)

        // Add the filtered shared item to cleaned user items
        cleanedUserItems.push(filteredItemCopy)
        localStorage.setItem(`kanbanItems_${currentUser.value}`, JSON.stringify(cleanedUserItems))
        items.value = cleanedUserItems

        updateSharedItems(filteredItemCopy, invitation.invitedBy)
      }
    }
    loadInvitations()
    if (pendingInvitations.value.length === 0) {
      showInvitationsDialog.value = false
    }
  }
}

const rejectInvitation = (invitation) => {
  const invitations = JSON.parse(
    localStorage.getItem(`kanbanInvitations_${currentUser.value}`) || '[]',
  )
  const index = invitations.findIndex(
    (inv) => inv.itemId === invitation.itemId && inv.username === invitation.username,
  )
  if (index !== -1) {
    invitations.splice(index, 1)
    saveInvitations(invitations, currentUser.value)

    const creatorItems = JSON.parse(
      localStorage.getItem(`kanbanItems_${invitation.invitedBy}`) || '[]',
    )
    const sharedItem = findItemById(creatorItems, invitation.itemId)
    if (sharedItem) {
      sharedItem.shareWith = sharedItem.shareWith.filter((s) => s.username !== currentUser.value)
      updateSubitemsShareWith(sharedItem, sharedItem.shareWith)
      updateItemInUserStorage(sharedItem, invitation.invitedBy)
      updateSharedItems(sharedItem, invitation.invitedBy)
    }

    const inviterMessages = JSON.parse(
      localStorage.getItem(`kanbanMessages_${invitation.invitedBy}`) || '[]',
    )
    const itemName = sharedItem ? `${sharedItem.type}: ${sharedItem.title}` : 'Unknown Item'
    inviterMessages.push({
      text: `${currentUser.value} rejected invite for ${itemName}`,
      timestamp: Date.now(),
    })
    localStorage.setItem(`kanbanMessages_${invitation.invitedBy}`, JSON.stringify(inviterMessages))
    loadInvitations()
    if (pendingInvitations.value.length === 0) {
      showInvitationsDialog.value = false
    }
  }
}

const deleteMessage = (index) => {
  messages.value.splice(index, 1)
  saveMessages()
}

const getItemTitleFromMessage = (message) => {
  if (!message.itemId) return ''
  const local = findItemById(items.value, message.itemId)
  if (local) return `${local.type}: ${local.title}`
  // unknown source otherwise
  return `#${message.itemId}`
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

const updateItemInUserStorage = (updatedItem, username) => {
  const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${username}`) || '[]')
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
  updateItem(userItems, updatedItem)
  localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(userItems))
}

const updateSubitemsShareWith = (item, shareWith) => {
  if (item.subitems) {
    item.subitems.forEach((subitem) => {
      // Update shareWith for the subitem and check if it was shared independently
      const previousSubitem = findItemById(
        JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]'),
        subitem.id,
      )
      const previousShareUsernames = previousSubitem
        ? previousSubitem.shareWith
            .filter((share) => !share.status || share.status !== 'pending')
            .map((share) => share.username)
        : []
      const newShareUsernames = shareWith
        .filter((share) => !share.status || share.status !== 'pending')
        .map((share) => share.username)
      const removedUsernames = previousShareUsernames.filter(
        (username) => !newShareUsernames.includes(username),
      )

      // Handle removed users for independently shared subitems
      removedUsernames.forEach((username) => {
        const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${username}`) || '[]')
        const newUserItems = userItems.filter((i) => i.id !== subitem.id)
        localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(newUserItems))

        const invitations = JSON.parse(
          localStorage.getItem(`kanbanInvitations_${username}`) || '[]',
        )
        const newInvitations = invitations.filter((inv) => inv.itemId !== subitem.id)
        localStorage.setItem(`kanbanInvitations_${username}`, JSON.stringify(newInvitations))

        const userMessages = JSON.parse(localStorage.getItem(`kanbanMessages_${username}`) || '[]')
        userMessages.push({
          text: `You were removed from ${subitem.type}: ${subitem.title} by ${currentUser.value}`,
          timestamp: Date.now(),
        })
        localStorage.setItem(`kanbanMessages_${username}`, JSON.stringify(userMessages))
      })

      subitem.shareWith = shareWith.map((s) => ({ ...s }))
      updateSubitemsShareWith(subitem, shareWith)
    })
  }
}

// kept for potential future use; currently replaced by getItemTitleFromInvitation
// const getItemTitle = (itemId) => {
//   const item = findItemById(items.value, itemId)
//   return item ? `${item.type}: ${item.title}` : 'Unknown Item'
// }

const getItemTitleFromInvitation = (invitation) => {
  // Try current user's items first
  const local = findItemById(items.value, invitation.itemId)
  if (local) return `${local.type}: ${local.title}`

  // Fallback: check inviter's storage (source of truth)
  const inviterItems = JSON.parse(
    localStorage.getItem(`kanbanItems_${invitation.invitedBy}`) || '[]',
  )
  const src = findItemById(inviterItems, invitation.itemId)
  return src ? `${src.type}: ${src.title}` : 'Unknown Item'
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userProfile')
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
    errorMessage.value = 'Please fill all required fields'
    return
  }

  const hasInvalidSubitemDeadline = itemForm.value.subitems.some((subitem) => {
    if (subitem.deadline && itemForm.value.deadline) {
      return new Date(subitem.deadline) > new Date(itemForm.value.deadline)
    }
    return false
  })
  if (hasInvalidSubitemDeadline) {
    errorMessage.value = 'Subitem deadline cannot be after the parent item deadline.'
    return
  }

  // Add new type to statusOptions if it doesn't exist
  if (!statusOptions.value.includes(itemForm.value.type)) {
    statusOptions.value.push(itemForm.value.type)
  }

  // Add new categories to categoryOptions if they don't exist
  itemForm.value.category.forEach((cat) => {
    if (!categoryOptions.value.includes(cat)) {
      categoryOptions.value.push(cat)
    }
  })

  // Add new subitem types to statusOptions if they don't exist
  itemForm.value.subitems.forEach((subitem) => {
    if (!statusOptions.value.includes(subitem.type)) {
      statusOptions.value.push(subitem.type)
    }
  })

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
      category: itemForm.value.category,
      shareWith: [{ username: currentUser.value, role: 'owner' }],
      movedToDoneAt: null,
      creator: currentUser.value,
      assignedTo: null,
      note: '',
      reports: [],
    })),
    shareWith: [{ username: currentUser.value, role: 'owner' }],
    movedToDoneAt: itemForm.value.status === 'Done' ? Date.now() : null,
    creator: currentUser.value,
    assignedTo: null,
    note: '',
    reports: [],
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
  form.value.shareWith = []
}

const deleteItem = (id) => {
  const item = findItemById(items.value, id)
  if (!canEdit(item)) {
    errorMessage.value = 'Only the owner or admin can delete this item.'
    return
  }

  const shareUsernames = item.shareWith
    .filter((share) => share.username !== currentUser.value)
    .map((share) => share.username)
  shareUsernames.forEach((username) => {
    const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${username}`) || '[]')
    const newUserItems = userItems.filter((i) => i.id !== id)
    localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(newUserItems))

    const invitations = JSON.parse(localStorage.getItem(`kanbanInvitations_${username}`) || '[]')
    const newInvitations = invitations.filter((inv) => inv.itemId !== id)
    localStorage.setItem(`kanbanInvitations_${username}`, JSON.stringify(newInvitations))
  })

  items.value = items.value.filter((i) => i.id !== id)
  saveItems()
}

function openProfile() {
  router.push('/profile')
  console.log('Navigating to profile')
}

const draggedItem = ref(null)
const startDrag = (item) => {
  if (canEdit(item)) {
    draggedItem.value = item
  }
}

const handleDrop = (newStatus) => {
  if (!draggedItem.value || !canEdit(draggedItem.value)) return
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
  updateSharedItems(draggedItem.value, currentUser.value)
  items.value = [...items.value]
  saveItems()
  errorMessage.value = ''
  draggedItem.value = null
}

const updateSharedItems = (updatedItem, sourceUser) => {
  const shareUsernames = updatedItem.shareWith
    .filter(
      (share) => share.username !== sourceUser && (!share.status || share.status !== 'pending'),
    )
    .map((share) => share.username)

  // Get the previous shareWith list to detect removed users
  const creatorItems = JSON.parse(localStorage.getItem(`kanbanItems_${sourceUser}`) || '[]')
  const originalItem = findItemById(creatorItems, updatedItem.id)
  const previousShareUsernames = originalItem
    ? originalItem.shareWith
        .filter(
          (share) => share.username !== sourceUser && (!share.status || share.status !== 'pending'),
        )
        .map((share) => share.username)
    : []

  // Find users that were removed from shareWith
  const removedUsernames = previousShareUsernames.filter(
    (username) => !shareUsernames.includes(username),
  )

  // Remove the item and invitations for removed users
  removedUsernames.forEach((username) => {
    // Remove item from user's items
    const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${username}`) || '[]')
    const newUserItems = userItems.filter((i) => i.id !== updatedItem.id)
    localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(newUserItems))

    // Remove pending invitations for the item
    const invitations = JSON.parse(localStorage.getItem(`kanbanInvitations_${username}`) || '[]')
    const newInvitations = invitations.filter((inv) => inv.itemId !== updatedItem.id)
    localStorage.setItem(`kanbanInvitations_${username}`, JSON.stringify(newInvitations))

    // Notify the removed user
    const userMessages = JSON.parse(localStorage.getItem(`kanbanMessages_${username}`) || '[]')
    userMessages.push({
      text: `You were removed from ${updatedItem.type}: ${updatedItem.title} by ${sourceUser}`,
      timestamp: Date.now(),
    })
    localStorage.setItem(`kanbanMessages_${username}`, JSON.stringify(userMessages))
  })

  // Update items for users still in shareWith
  shareUsernames.forEach((username) => {
    const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${username}`) || '[]')
    const targetItem = findItemById(userItems, updatedItem.id)
    if (targetItem) {
      // Check for conflicting subitems before updating
      const conflictingItems = findConflictingSubitems(userItems, updatedItem)
      const cleanedUserItems = removeConflictingSubitems(userItems, conflictingItems)

      // Update the target item
      Object.assign(targetItem, JSON.parse(JSON.stringify(updatedItem)))
      updateSubitemsShareWith(targetItem, updatedItem.shareWith)

      // Save the cleaned items
      localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(cleanedUserItems))
    }
  })

  // Update current user's items if they are not the source user
  if (currentUser.value !== sourceUser) {
    const currentUserItems = JSON.parse(
      localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]',
    )
    const currentUserTargetItem = findItemById(currentUserItems, updatedItem.id)
    if (currentUserTargetItem) {
      Object.assign(currentUserTargetItem, JSON.parse(JSON.stringify(updatedItem)))
      updateSubitemsShareWith(currentUserTargetItem, updatedItem.shareWith)
      localStorage.setItem(`kanbanItems_${currentUser.value}`, JSON.stringify(currentUserItems))
      items.value = currentUserItems
    }
  }
}

const completionPercent = computed(() => {
  const rootItems = items.value.filter(
    (item) =>
      !item.parentId ||
      item.shareWith?.some((share) => share.username === currentUser.value && !share.status),
  )
  if (rootItems.length === 0) return 0
  const doneItems = rootItems.filter((item) => item.status?.toLowerCase() === 'done').length
  return Math.round((doneItems / rootItems.length) * 100)
})

const priorityMap = {
  High: 3,
  Medium: 2,
  Low: 1,
  '': 0,
}

const sortedItems = (status) => {
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done',
  }
  const normalizedStatus = statusMap[status] || status.toLowerCase()
  const filtered = items.value.filter((item) => {
    const itemStatus = item.status?.toLowerCase() || ''
    return (
      (!item.parentId ||
        item.shareWith?.some((share) => share.username === currentUser.value && !share.status)) &&
      itemStatus === normalizedStatus
    )
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

const priorityClass = (priority) => {
  if (priority === 'High') return 'priority-high'
  if (priority === 'Medium') return 'priority-medium'
  return 'priority-low'
}

watch(
  () => localStorage.getItem(`kanbanItems_${currentUser.value}`),
  async (newValue) => {
    if (newValue) {
      items.value = JSON.parse(newValue)
      await nextTick()
    }
  },
)

watch(
  () => localStorage.getItem(`kanbanInvitations_${currentUser.value}`),
  () => {
    loadInvitations()
  },
)

watch(
  () => localStorage.getItem(`kanbanMessages_${currentUser.value}`),
  () => {
    loadMessages()
  },
)
</script>

<style scoped>
.login-bg {
  background-image: url('/back3.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
  padding-top: 84px;
}

.login-navbar {
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 8px;
  background-color: #ffffff;
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-title {
  font-size: 25px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brand-logo {
  height: 35px;
  width: auto;
}
.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
}
/* New styles to match login UI aesthetics */
.column-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
}
.item-card {
  position: relative;
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}
.item-card:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}
.ellipsis {
  max-width: 55%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.right-panel-card {
  border-radius: 12px;
}

/* Board container fixed and rounded like login */
.login-bg {
  overflow: hidden;
}
.fixed-page {
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}
.board-surface {
  border-radius: 16px;
}
.board-row {
  height: calc(100vh - 120px);
}
.board-scroll {
  max-height: 100%;
}
.column-scroll {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  padding-bottom: 24px; /* ensure last item isn't obscured by toolbar */
}
.column-scroll {
  max-height: calc(93.5vh - 220px);
  overflow-y: auto;
}
.topbar {
  position: relative;
  flex-wrap: nowrap;
}
.date-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  color: rgb(35, 79, 124);
  border-radius: 9999px;
  padding: 4px 10px;
  font-weight: 600;
}
.big-search-input {
  width: 500px;
  max-width: 1000px;
  /* background: white; */
  border-radius: 12px;
  height: 48px;
}

.right-rounded {
  border-radius: 12px;
}
.right-tall {
  min-height: 56px;
  display: flex;
  align-items: center;
}
.right-btn {
  border-radius: 12px;
  height: 48px;
}
.dialog-card {
  border-radius: 16px;
}
.invite-row {
  padding-top: 6px;
  padding-bottom: 6px;
}
.form-scroll {
  max-height: calc(55vh - 20px);
  overflow-y: auto;
  padding-right: 2px;
}
.field-rounded .q-field__control {
  border-radius: 12px;
}
.field-spaced {
  margin-top: 2px;
  padding-top: 2px;
  margin-bottom: 1px;
}

.menu-rounded {
  border-radius: 12px;
}
.deadline-input .q-field__control {
  background: rgba(12, 14, 15, 0.08);
  border: 1px solid rgba(17, 0, 175, 0.25);
}
.fancy-toggle {
  margin-bottom: 8px;
  display: inline-block;
  background: rgba(255, 255, 255, 0.85);
  padding: 0px 10px;
  padding-bottom: 6px;
  border-radius: 9999px;
}

/* Priority full-card coloring */
.priority-low {
  background: #d3d6d3;
  /* color: #0a5c2a; */
}
.priority-medium {
  background: #cbe9d7;
  color: #226631;
}
.priority-high {
  background: #ebc7a9;
  color: #7a2d00;
}
</style>
