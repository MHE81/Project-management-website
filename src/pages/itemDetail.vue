<template>
  <q-page class="q-pa-md login-bg fixed-page">
    <div class="login-navbar">
      <div class="brand">
        <img src="/logo.png" alt="PLANOVA logo" class="brand-logo" />
        <!-- <span class="brand-title">PLANOVA</span> -->
        <div v-if="item" class="q-ml-sm">
          <div class="text-subtitle2 ellipsis primary" style="max-width: 380px">
            {{ item.type || 'Item' }}: {{ item.title || 'Untitled' }}
          </div>
          <div class="text-caption">Role: {{ currentUserRole }}</div>
        </div>
      </div>
    </div>
    <div class="top-search">
      <div class="row items-center no-wrap">
        <q-input
          v-model="searchQuery"
          placeholder="Search subitems..."
          dense
          outlined
          rounded
          bg-color="grey-3"
          class="text-black big-search-input"
          aria-label="Search subitems"
        />
        <q-btn round color="primary" icon="search" class="q-ml-sm" aria-label="Perform search" />
      </div>
    </div>
    <div class="top-actions">
      <q-btn
        round
        color="primary"
        icon="account_circle"
        @click="openProfile"
        aria-label="Go to profile"
      />
      <q-btn round flat color="negative" icon="logout" @click="logout" aria-label="Log out" />
    </div>
    <!-- Loading State -->
    <div v-if="!item && !errorMessage" class="text-center q-mt-lg">
      <q-spinner color="primary" size="3em" />
      <div>Loading item...</div>
    </div>
    <!-- Item Name and User Role shown in top bar on the right -->
    <div v-if="item" class="q-mb-sm text-center hidden-top"></div>
    <div v-else-if="errorMessage" class="text-h4 q-mb-md text-center full-width text-negative">
      {{ errorMessage }} (ID: {{ route.params.id }})
    </div>
    <!-- Top bar -->
    <div class="row items-center q-mb-md topbar">
      <div class="col-3">
        <div class="date-pill">
          <q-icon name="event" size="sm" class="q-mr-xs" />
          {{ currentDate }}
        </div>
      </div>
      <div class="col-6"></div>
    </div>

    <!-- Error Banner -->
    <q-banner
      v-if="errorMessage"
      dense
      class="bg-negative text-white q-mb-md"
      style="width: fit-content; max-width: 100%"
      aria-live="polite"
      role="alert"
    >
      {{ errorMessage }}
    </q-banner>

    <!-- Selected Report Display (Editable) -->
    <div v-if="item && selectedReport" class="q-mb-md">
      <div class="text-subtitle1">Editing Report:</div>
      <textarea
        v-model="selectedReport.details"
        placeholder="Edit your report here..."
        class="resizable-note custom-textarea"
        :disabled="!isReportOwner"
      />
      <div class="row q-mt-sm">
        <q-btn
          label="Save Report"
          color="positive"
          @click="saveEditedReport"
          class="q-mr-sm"
          :disable="!isReportOwner"
        />
        <q-btn label="Cancel" color="negative" flat @click="cancelEditReport" class="right-btn" />
      </div>
    </div>

    <!-- Note Display -->
    <div v-if="item && item.note" class="q-mb-md">
      <div class="row items-center justify-between">
        <q-card flat class="note-card">
          <q-card-section class="q-pa-none">
            <div class="note-inline">
              <div class="note-text" v-html="item.note.replace(/\n/g, '<br>')"></div>
              <q-btn
                dense
                round
                flat
                color="primary"
                icon="edit"
                size="sm"
                @click="openNoteDialog"
                :disable="!canEdit"
                aria-label="Edit Note"
              />
              <q-btn
                dense
                round
                flat
                color="negative"
                icon="delete"
                size="sm"
                @click="deleteNote"
                :disable="!canEdit"
                aria-label="Delete Note"
              />
            </div>
          </q-card-section>
        </q-card>
        <div class="fancy-toggle">
          <q-toggle
            v-model="sortByPriority"
            label="Sort by"
            left-label
            checked-icon="sort"
            unchecked-icon="event"
            color="primary"
            @update:model-value="sortSubitems"
          />
        </div>
      </div>
    </div>

    <!-- Add Note Button -->
    <div v-if="item && !item.note" class="q-mb-md">
      <div class="row items-center justify-between">
        <q-btn
          round
          color="primary"
          icon="note_add"
          @click="openNoteDialog"
          :disable="!canEdit"
          aria-label="Add Note"
        >
          <q-tooltip>Add Note</q-tooltip>
        </q-btn>
        <div class="fancy-toggle">
          <q-toggle
            v-model="sortByPriority"
            label="Sort by"
            left-label
            checked-icon="sort"
            unchecked-icon="event"
            color="primary"
            @update:model-value="sortSubitems"
          />
        </div>
      </div>
    </div>

    <!-- Note Dialog -->
    <q-dialog v-model="showNoteDialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header">
          <div class="text-h6">{{ noteDialogMode === 'edit' ? 'Edit Note' : 'Add Note' }}</div>
          <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
        </q-card-section>
        <q-separator />
        <q-card-section class="dialog-content">
          <textarea
            v-model="noteDraft"
            class="resizable-note custom-textarea"
            placeholder="Enter your note here..."
          />
        </q-card-section>
        <q-card-actions class="dialog-actions">
          <q-btn flat label="Cancel" color="primary" v-close-popup class="right-btn" />
          <q-btn color="positive" label="Save" class="right-btn" @click="saveNoteFromDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
      <div class="col-1.5 q-pa-md column-box" style="margin-right: 2px">
        <div class="board-surface" style="padding: 2px">
          <div class="text-subtitle2 q-mb-xs">Details</div>
          <div>Type: {{ item.type || 'N/A' }}</div>
          <q-input
            v-model="item.title"
            label="Title"
            dense
            :error="!item.title && formSubmitted"
            :disable="!isEditing || !canEdit"
            error-message="Title is required"
            class="q-mt-md"
          />
          <q-input
            v-model="item.deadline"
            label="Deadline"
            dense
            type="datetime-local"
            :disable="!isEditing || !canEdit"
            :max="directParent?.deadline || undefined"
            class="q-mt-md"
          />
          <q-select
            v-model="item.status"
            :options="statusOptions"
            label="Status"
            dense
            :disable="!isEditing || !canChangeStatus"
            class="q-mt-md"
          />
          <q-select
            v-model="item.priority"
            :options="['Low', 'Medium', 'High']"
            label="Priority"
            dense
            :disable="!isEditing || !canEdit"
            class="q-mt-md"
          />
          <q-select
            v-model="item.category"
            :options="categoryOptions"
            use-input
            use-chips
            label="Category"
            multiple
            dense
            :disable="!isEditing || !canEdit"
            new-value-mode="add-unique"
            class="q-mt-md"
          />
          <q-btn
            v-if="!isEditing"
            label="Edit"
            color="primary"
            class="full-width q-mt-md right-btn"
            @click="toggleEdit(true)"
            :disable="!canEdit"
          />
          <q-btn
            v-else
            label="Save"
            color="positive"
            class="full-width q-mt-md right-btn"
            @click="saveDetails"
            :disable="!canEdit"
          />
        </div>
      </div>

      <!-- Main Content Area (Subitems Kanban) -->
      <div class="col-8 q-pa-md column-box" style="margin-right: 290px">
        <div class="row board-row" style="flex-wrap: nowrap">
          <!-- Backlog Column -->
          <div class="col-4" @dragover.prevent @drop="handleDrop('backlog')">
            <q-card class="board-surface column-card">
              <q-card-section class="row items-center justify-between">
                <div class="text-subtitle2">Backlog</div>
                <q-badge color="warning" text-color="black">{{
                  sortedSubitems('backlog').length
                }}</q-badge>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pt-sm column-scroll">
                <div
                  v-for="subitem in sortedSubitems('backlog').filter(
                    (i) =>
                      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.type.toLowerCase().includes(searchQuery.toLowerCase()),
                  )"
                  :key="subitem.id"
                  class="item-card"
                  :class="priorityClass(subitem.priority)"
                  :draggable="canChangeSubitemStatus(subitem)"
                  @dragstart="startDrag(subitem)"
                  @click="viewItem(subitem.id)"
                >
                  <div class="row items-center justify-between">
                    <div class="ellipsis">
                      <strong>{{ subitem.type }}</strong
                      >: {{ subitem.title }}
                    </div>
                    <div class="text-caption">
                      {{ formatItemDate(subitem.deadline) }}
                    </div>
                  </div>
                  <div
                    v-if="subitem.assignedTo && subitem.assignedTo.length"
                    class="text-caption q-mt-xs"
                  >
                    Assigned:
                    {{
                      subitem.assignedTo
                        .map(
                          (a) => `${a.username} (${a.role}): ${truncateText(a.note || 'No note')}`,
                        )
                        .join(', ')
                    }}
                  </div>
                  <div v-if="subitem.shareWith && subitem.shareWith.length" class="text-caption">
                    Shared:
                    {{
                      subitem.shareWith
                        .map(
                          (s) =>
                            `${s.username} (${s.role}${s.status === 'pending' ? ', Pending' : ''})`,
                        )
                        .join(', ')
                    }}
                  </div>
                  <div class="row justify-end q-mt-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click.stop="deleteItem(subitem.id)"
                      :disable="!canAddSubitems"
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
                <q-badge color="primary">{{ sortedSubitems('in progress').length }}</q-badge>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pt-sm column-scroll">
                <div
                  v-for="subitem in sortedSubitems('in progress').filter(
                    (i) =>
                      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.type.toLowerCase().includes(searchQuery.toLowerCase()),
                  )"
                  :key="subitem.id"
                  class="item-card"
                  :class="priorityClass(subitem.priority)"
                  :draggable="canChangeSubitemStatus(subitem)"
                  @dragstart="startDrag(subitem)"
                  @click="viewItem(subitem.id)"
                >
                  <div class="row items-center justify-between">
                    <div class="ellipsis">
                      <strong>{{ subitem.type }}</strong
                      >: {{ subitem.title }}
                    </div>
                    <div class="text-caption">
                      {{ formatItemDate(subitem.deadline) }}
                    </div>
                  </div>
                  <div
                    v-if="subitem.assignedTo && subitem.assignedTo.length"
                    class="text-caption q-mt-xs"
                  >
                    Assigned:
                    {{
                      subitem.assignedTo
                        .map(
                          (a) => `${a.username} (${a.role}): ${truncateText(a.note || 'No note')}`,
                        )
                        .join(', ')
                    }}
                  </div>
                  <div v-if="subitem.shareWith && subitem.shareWith.length" class="text-caption">
                    Shared:
                    {{
                      subitem.shareWith
                        .map(
                          (s) =>
                            `${s.username} (${s.role}${s.status === 'pending' ? ', Pending' : ''})`,
                        )
                        .join(', ')
                    }}
                  </div>
                  <div class="row justify-end q-mt-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click.stop="deleteItem(subitem.id)"
                      :disable="!canAddSubitems"
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
                <q-badge color="positive">{{ sortedSubitems('done').length }}</q-badge>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pt-sm column-scroll">
                <div
                  v-for="subitem in sortedSubitems('done').filter(
                    (i) =>
                      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.type.toLowerCase().includes(searchQuery.toLowerCase()),
                  )"
                  :key="subitem.id"
                  class="item-card"
                  :class="priorityClass(subitem.priority)"
                  :draggable="canChangeSubitemStatus(subitem)"
                  @dragstart="startDrag(subitem)"
                  @click="viewItem(subitem.id)"
                >
                  <div class="row items-center justify-between">
                    <div class="ellipsis">
                      <strong>{{ subitem.type }}</strong
                      >: {{ subitem.title }}
                    </div>
                    <div class="text-caption">
                      {{ formatItemDate(subitem.deadline) }}
                    </div>
                  </div>
                  <div
                    v-if="subitem.assignedTo && subitem.assignedTo.length"
                    class="text-caption q-mt-xs"
                  >
                    Assigned:
                    {{
                      subitem.assignedTo
                        .map(
                          (a) => `${a.username} (${a.role}): ${truncateText(a.note || 'No note')}`,
                        )
                        .join(', ')
                    }}
                  </div>
                  <div v-if="subitem.shareWith && subitem.shareWith.length" class="text-caption">
                    Shared:
                    {{
                      subitem.shareWith
                        .map(
                          (s) =>
                            `${s.username} (${s.role}${s.status === 'pending' ? ', Pending' : ''})`,
                        )
                        .join(', ')
                    }}
                  </div>
                  <div class="row justify-end q-mt-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click.stop="deleteItem(subitem.id)"
                      :disable="!canAddSubitems"
                      aria-label="Delete item"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Right Side Box -->
      <div
        class="fixed-right-panel q-pa-md bg-grey-2 board-surface"
        style="width: 270px; top: 90px; right: 12px; bottom: 12px; overflow-y: auto"
      >
        <!-- Progress Circle on top -->
        <div class="q-mb-md flex flex-center">
          <q-circular-progress
            show-value
            :value="completionPercent"
            size="90px"
            color="green"
            track-color="grey-3"
          >
            {{ completionPercent }}%
          </q-circular-progress>
        </div>

        <!-- Shared With Section -->
        <q-expansion-item
          v-if="item && !toggleSubitemForm"
          dense
          expand-separator
          icon="group"
          label="Shared With"
          :caption="(item.shareWith?.length || 0) + ' users'"
          class="q-mb-sm"
        >
          <div class="q-pa-sm exp-section">
            <div
              v-if="item.shareWith && item.shareWith.length"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs"
            >
              <div
                v-for="(share, index) in item.shareWith"
                :key="index"
                class="row items-center q-mb-xs"
              >
                <div class="col">
                  {{ share.username }}
                  <span class="text-weight-bold"
                    >({{ share.role }}{{ share.status === 'pending' ? ', Pending' : '' }})</span
                  >
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    v-if="
                      currentUserRole === 'owner' &&
                      share.role !== 'owner' &&
                      share.username !== currentUser
                    "
                    flat
                    round
                    icon="remove"
                    color="negative"
                    size="sm"
                    @click="removeSharedUser(index)"
                  />
                  <q-btn
                    v-if="index === item.shareWith.length - 1 && canShare"
                    round
                    dense
                    color="secondary"
                    icon="add"
                    size="sm"
                    @click="openShareDialog"
                    aria-label="Share With"
                  >
                    <q-tooltip>Add User</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
            <div
              v-else
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative row items-center justify-between"
            >
              <span>Not shared with anyone</span>
              <q-btn
                v-if="canShare"
                round
                dense
                color="secondary"
                icon="add"
                size="sm"
                @click="openShareDialog"
                aria-label="Share With"
              >
                <q-tooltip>Add User</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-expansion-item>

        <!-- Assignment (Dropdown) -->
        <q-expansion-item
          v-if="item && !toggleSubitemForm"
          dense
          expand-separator
          icon="assignment_ind"
          label="Assigned To"
          :caption="(item.assignedTo?.length || 0) + ' records'"
          class="q-mb-sm"
        >
          <div class="q-pa-sm assignments-box exp-section">
            <div
              v-if="item.assignedTo && item.assignedTo.length"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs"
            >
              <div
                v-for="(assignee, index) in sortedAssignees"
                :key="index"
                class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs row items-center cursor-pointer"
                @click="openAssigneeDialog(assignee, index)"
              >
                <div class="col text-ellipsis single-line">
                  {{ assignee.assignedAt }} - {{ truncateText(assignee.note || 'No note') }}
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    v-if="canAssign"
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click.stop="removeAssignment(index)"
                  />
                  <q-btn
                    v-if="index === sortedAssignees.length - 1 && canAssign"
                    round
                    dense
                    color="secondary"
                    icon="add"
                    size="sm"
                    @click.stop="openAssignDialog"
                    aria-label="Assign Item"
                  >
                    <q-tooltip>Add Assignment</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
            <div
              v-else
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative row items-center justify-between"
            >
              <span>No assignments</span>
              <q-btn
                v-if="canAssign"
                round
                dense
                color="secondary"
                icon="add"
                size="sm"
                @click="openAssignDialog"
                aria-label="Assign Item"
              >
                <q-tooltip>Add Assignment</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-expansion-item>

        <!-- Assignee Dialog -->
        <q-dialog v-model="showAssigneeDialog" persistent>
          <q-card class="dialog-card">
            <q-card-section class="dialog-header">
              <div class="text-h6">Assignee Details</div>
              <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
            </q-card-section>
            <q-separator />
            <q-card-section class="dialog-content">
              <div class="text-subtitle2 q-mb-md">
                Item: {{ item.type || 'Item' }}: {{ item.title || 'Untitled' }}
              </div>
              <q-form @submit.prevent="saveAssigneeDetails">
                <q-input
                  v-model="selectedAssignee.username"
                  label="Username"
                  dense
                  readonly
                  class="q-mb-md"
                />
                <q-input
                  v-model="selectedAssignee.role"
                  label="Role"
                  dense
                  readonly
                  class="q-mb-md"
                />
                <q-input
                  v-model="selectedAssignee.assignedAt"
                  label="Assigned At"
                  dense
                  readonly
                  class="q-mb-md"
                />
                <textarea
                  v-model="selectedAssignee.note"
                  label="Note"
                  placeholder="What should this user do?"
                  class="resizable-note custom-textarea"
                  :disabled="!canEditAssignee"
                />
              </q-form>
            </q-card-section>
            <q-card-actions class="dialog-actions">
              <q-btn
                flat
                label="Close"
                color="primary"
                v-close-popup
                @click="closeAssigneeDialog"
                class="right-btn"
              />
              <q-btn
                label="Save"
                color="positive"
                @click="saveAssigneeDetails"
                :disable="!canEditAssignee"
                aria-label="Save assignee details"
                class="right-btn"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <q-expansion-item
          v-if="item && !toggleSubitemForm"
          dense
          expand-separator
          icon="event"
          label="Meetings"
          :caption="(item.meetings?.length || 0) + ' records'"
          class="q-mb-sm"
        >
          <div class="q-pa-sm meetings-box exp-section">
            <div
              v-if="item.meetings && item.meetings.length"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs"
            >
              <div
                v-for="(meeting, index) in sortedMeetings"
                :key="index"
                class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs row items-center cursor-pointer"
                @click="openMeetingDetailsDialog(meeting, index)"
              >
                <div class="col text-ellipsis single-line">
                  <span class="text-weight-bold">{{ meeting.creator }}</span
                  >: {{ meeting.type }} - {{ meeting.status }} - {{ truncateText(meeting.title) }}
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    v-if="index === sortedMeetings.length - 1 && item"
                    round
                    dense
                    color="secondary"
                    icon="add"
                    size="sm"
                    @click.stop="openMeetingDialog"
                    :disable="currentUserRole === 'observer'"
                    aria-label="Add Meeting"
                  >
                    <q-tooltip>Add Meeting</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
            <div
              v-else
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative row items-center justify-between"
            >
              <span>No meetings</span>
              <q-btn
                v-if="item"
                round
                dense
                color="secondary"
                icon="add"
                size="sm"
                @click="openMeetingDialog"
                :disable="currentUserRole === 'observer'"
                aria-label="Add Meeting"
              >
                <q-tooltip>Add Meeting</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-expansion-item>

        <!-- Meeting Dialog -->
        <q-dialog v-model="showMeetingDialog" persistent>
          <q-card class="dialog-card">
            <q-card-section class="dialog-header">
              <div class="text-h6">Start a Meeting</div>
              <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
            </q-card-section>
            <q-separator />
            <q-card-section class="dialog-content">
              <q-form @submit.prevent="startMeeting">
                <q-select
                  v-model="meetingType"
                  :options="['Online', 'In-person']"
                  label="Meeting Type"
                  dense
                  :error="!meetingType && meetingFormSubmitted"
                  error-message="Meeting type is required"
                  class="q-mb-md"
                />
                <q-input
                  v-model="meetingTitle"
                  label="Meeting Title"
                  dense
                  :error="!meetingTitle && meetingFormSubmitted"
                  error-message="Title is required"
                  class="q-mb-md"
                />
                <q-input
                  v-model="meetingReason"
                  label="Reason for Meeting"
                  dense
                  :error="!meetingReason && meetingFormSubmitted"
                  error-message="Reason is required"
                  class="q-mb-md"
                />
                <q-input
                  v-model="meetingEntranceDateTime"
                  label="Entrance Date and Time"
                  dense
                  type="datetime-local"
                  :min="restrictEntranceDate()"
                  :error="!meetingEntranceDateTime && meetingFormSubmitted"
                  error-message="Entrance date and time must be in the future"
                  class="q-mb-md"
                />
                <q-input
                  v-if="meetingType === 'In-person'"
                  v-model="meetingPlace"
                  label="Meeting Place"
                  dense
                  :error="meetingType === 'In-person' && !meetingPlace && meetingFormSubmitted"
                  error-message="Place is required for in-person meetings"
                  class="q-mb-md"
                />
                <div class="text-subtitle2 q-mb-md">Select Users:</div>
                <q-list bordered class="q-mb-md user-list">
                  <q-item
                    v-for="user in item.shareWith.filter((u) => u.username !== currentUser)"
                    :key="user.username"
                    clickable
                    @click="toggleMeetingUser(user)"
                    :active="selectedMeetingUsers.includes(user.username)"
                    active-class="bg-grey-3"
                  >
                    <q-item-section>
                      {{ user.username }}
                      <span class="text-weight-bold"
                        >({{ user.role }}{{ user.status === 'pending' ? ', Pending' : '' }})</span
                      >
                    </q-item-section>
                    <q-item-section side>
                      <q-checkbox
                        v-model="selectedMeetingUsers"
                        :val="user.username"
                        :disable="user.status === 'pending'"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
                <q-btn
                  label="Start Meeting"
                  color="secondary"
                  type="submit"
                  class="full-width q-mb-md right-btn"
                  :disable="
                    !selectedMeetingUsers.length ||
                    !meetingTitle ||
                    !meetingReason ||
                    !meetingEntranceDateTime ||
                    (meetingType === 'In-person' && !meetingPlace)
                  "
                />
              </q-form>
            </q-card-section>
            <q-card-actions class="dialog-actions">
              <q-btn
                flat
                label="Close"
                color="primary"
                v-close-popup
                @click="closeMeetingDialog"
                class="right-btn"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Meeting Details Dialog -->
        <q-dialog v-model="showMeetingDetailsDialog" persistent>
          <q-card class="dialog-card">
            <q-card-section class="dialog-header">
              <div class="text-h6">Meeting Details</div>
              <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="text-subtitle2 q-mb-md">Type: {{ selectedMeeting?.type || 'N/A' }}</div>
              <div class="text-subtitle2 q-mb-md">Title: {{ selectedMeeting?.title || 'N/A' }}</div>
              <div class="text-subtitle2 q-mb-md">
                Creator: {{ selectedMeeting?.creator || 'Unknown' }}
              </div>
              <div class="text-subtitle2 q-mb-md">
                Status: {{ selectedMeeting?.status || 'pending' }}
              </div>
              <div class="text-subtitle2 q-mb-md">
                Entrance Time: {{ selectedMeeting?.entranceDateTime || 'N/A' }}
              </div>
              <div class="text-subtitle2 q-mb-md">
                Exit Time: {{ selectedMeeting?.exitDateTime || 'N/A' }}
              </div>
              <div v-if="selectedMeeting?.type === 'In-person'" class="text-subtitle2 q-mb-md">
                Place: {{ selectedMeeting?.place || 'N/A' }}
              </div>
              <div v-if="selectedMeeting?.type === 'Online'" class="text-subtitle2 q-mb-md">
                Meeting Link:
                <a :href="selectedMeeting?.link" target="_blank">{{
                  selectedMeeting?.link || 'N/A'
                }}</a>
              </div>
              <div class="text-subtitle2 q-mb-md">
                Reason: {{ selectedMeeting?.reason || 'N/A' }}
              </div>
              <div class="text-subtitle2 q-mb-md">Users in Meeting:</div>
              <div class="q-mb-md">
                <span v-for="(user, index) in selectedMeeting?.users" :key="index">
                  {{ user }}{{ index < selectedMeeting.users.length - 1 ? ', ' : '' }}
                </span>
              </div>
              <q-form
                v-if="selectedMeeting?.creator === currentUser"
                @submit.prevent="saveAllMeetingDetails"
              >
                <q-input
                  v-model="selectedMeeting.exitDateTime"
                  label="Exit Date and Time (Optional)"
                  dense
                  type="datetime-local"
                  :min="selectedMeeting?.entranceDateTime"
                  :max="restrictExitDate(selectedMeeting?.entranceDateTime)"
                  class="q-mb-md"
                  :disable="selectedMeeting?.creator !== currentUser"
                />
                <q-select
                  v-model="selectedMeeting.status"
                  :options="['canceled', 'succeed', 'pending']"
                  label="Status"
                  dense
                  class="q-mb-md"
                  :disable="selectedMeeting?.creator !== currentUser"
                />
              </q-form>
              <div class="text-subtitle2 q-mb-md">
                Description:
                <span v-if="selectedMeeting?.edited" class="edited-label">
                  Edited by
                  {{ selectedMeeting.descriptionHistory?.slice(-1)[0]?.editedBy || 'Unknown' }} on
                  {{ selectedMeeting.descriptionHistory?.slice(-1)[0]?.date || 'N/A' }}
                </span>
              </div>
              <textarea
                v-model="selectedMeeting.description"
                placeholder="Meeting description..."
                class="resizable-note custom-textarea"
                :disabled="!isMeetingParticipant"
              />
              <div
                v-if="currentUserRole === 'owner' && selectedMeeting?.descriptionHistory?.length"
                class="description-history"
              >
                <div class="text-subtitle2 q-mb-md">Description History:</div>
                <div
                  v-for="(version, index) in selectedMeeting.descriptionHistory"
                  :key="index"
                  class="q-py-xs q-px-sm bg-grey-2 rounded-borders q-mb-xs text-grey-7"
                >
                  <div class="text-caption">
                    Edited by: {{ version.editedBy }} on {{ version.date }}
                  </div>
                  <div>{{ version.description || 'No description' }}</div>
                </div>
              </div>
            </q-card-section>
            <q-card-actions class="dialog-actions">
              <q-btn
                flat
                label="Close"
                color="primary"
                v-close-popup
                @click="closeMeetingDetailsDialog"
                class="right-btn"
              />
              <q-btn
                v-if="selectedMeeting?.creator === currentUser || isMeetingParticipant"
                label="Save All"
                color="positive"
                @click="saveAllMeetingDetails"
                :disable="!(selectedMeeting?.creator === currentUser || isMeetingParticipant)"
                class="right-btn"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Add New Report Button -->
        <!-- <q-btn
          v-if="item && !isAddingReport && !showReportDialog"
          color="primary"
          label="Add Report"
          @click="toggleReportForm(true)"
          class="q-mb-md right-btn"
          :disable="!canManageOwnReports"
        /> -->

        <q-expansion-item
          v-if="item && !toggleSubitemForm"
          dense
          expand-separator
          icon="description"
          label="Reports"
          :caption="(item.reports?.length || 0) + ' records'"
          class="q-mb-sm"
        >
          <div class="q-pa-sm reports-box exp-section">
            <div
              v-if="item.reports && item.reports.length"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs"
            >
              <div
                v-for="(report, index) in sortedReports"
                :key="index"
                class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs row items-center cursor-pointer"
                @click="openReportDialog(report, index)"
              >
                <div class="col text-ellipsis single-line">
                  <span class="text-weight-bold">{{ report.creator }}</span>
                  <span v-if="report.edited" class="text-grey-7"> (Edited)</span>:
                  {{ report.date }} - {{ truncateText(report.details) }}
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    v-if="
                      index === sortedReports.length - 1 &&
                      item &&
                      !showAddReportDialog &&
                      !showReportDialog
                    "
                    round
                    dense
                    color="secondary"
                    icon="add"
                    size="sm"
                    @click.stop="showAddReportDialog = true"
                    :disable="!canManageOwnReports"
                    aria-label="Add Report"
                  >
                    <q-tooltip>Add Report</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
            <div
              v-else
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative row items-center justify-between"
            >
              <span>No reports</span>
              <q-btn
                v-if="item && !showAddReportDialog && !showReportDialog"
                round
                dense
                color="secondary"
                icon="add"
                size="sm"
                @click="showAddReportDialog = true"
                :disable="!canManageOwnReports"
                aria-label="Add Report"
              >
                <q-tooltip>Add Report</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-expansion-item>
        <!-- <div
          v-else-if="item && item.reports && !item.reports.length"
          class="q-mb-md text-center text-negative"
        >
          No reports available.
        </div> -->

        <!-- Add Report Dialog -->
        <q-dialog v-model="showAddReportDialog" persistent>
          <q-card class="dialog-card">
            <q-card-section class="dialog-header">
              <div class="text-h6">Add New Report</div>
              <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
            </q-card-section>
            <q-separator />
            <q-card-section class="dialog-content">
              <q-input
                v-model="newReportDetails"
                placeholder="Enter what you have done..."
                dense
                :error="!newReportDetails && reportFormSubmitted"
                error-message="Details are required"
                class="q-mb-md"
                :disable="!canManageOwnReports"
                type="textarea"
                rows="4"
              />
            </q-card-section>
            <q-card-actions class="dialog-actions">
              <q-btn
                flat
                label="Cancel"
                color="primary"
                v-close-popup
                @click="cancelReport"
                class="right-btn"
              />
              <q-btn
                label="Save Report"
                color="positive"
                @click="saveReport"
                :disable="!canManageOwnReports"
                class="right-btn"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Report Dialog -->
        <q-dialog v-model="showReportDialog" persistent>
          <q-card class="dialog-card">
            <q-card-section class="dialog-header">
              <div class="text-h6">Report Details</div>
              <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
            </q-card-section>
            <q-separator />
            <q-card-section class="dialog-content">
              <div class="text-subtitle2 q-mb-md">
                Written by: {{ selectedReport?.creator || 'Unknown' }}
                <span v-if="selectedReport?.edited" class="text-weight-bold text-grey-7">
                  (Edited)</span
                >
              </div>
              <div class="text-subtitle2 q-mb-md">Date: {{ selectedReport?.date || 'N/A' }}</div>
              <textarea
                v-model="selectedReport.details"
                placeholder="Report details..."
                class="resizable-note custom-textarea"
                :disabled="!isReportOwner"
              />
              <div
                v-if="currentUserRole === 'owner' && selectedReport?.history?.length"
                class="q-mt-md"
              >
                <div class="text-subtitle2 q-mb-md">Previous Versions:</div>
                <div class="report-history">
                  <div
                    v-for="(version, index) in selectedReport.history.slice().reverse()"
                    :key="index"
                    class="q-py-xs q-px-sm bg-grey-2 rounded-borders q-mb-xs text-grey-7"
                  >
                    <div class="text-caption">Edited on: {{ version.date }}</div>
                    <div>{{ version.details }}</div>
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-actions class="dialog-actions">
              <q-btn
                flat
                label="Close"
                color="primary"
                v-close-popup
                @click="closeReportDialog"
                class="right-btn"
              />
              <q-btn
                v-if="isReportOwner"
                label="Save"
                color="positive"
                @click="saveEditedReport"
                :disable="!isReportOwner"
                class="right-btn"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <q-expansion-item
          v-if="item && !toggleSubitemForm"
          dense
          expand-separator
          icon="chat"
          label="Comments"
          :caption="(item.comments?.length || 0) + ' records'"
          class="q-mb-sm"
        >
          <div class="q-pa-sm comments-box exp-section">
            <div
              v-if="item.comments && item.comments.length"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs"
            >
              <div
                v-for="(comment, index) in sortedComments"
                :key="index"
                class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs row items-center cursor-pointer"
                @click="openCommentDialog(comment, index)"
              >
                <div class="col text-ellipsis single-line">
                  <span class="text-weight-bold">{{ comment.creator }}</span>
                  <span v-if="comment.edited" class="text-grey-7"> (Edited)</span>:
                  {{ comment.date }} - {{ truncateText(comment.details) }}
                  <div v-if="comment.reply" class="text-caption">
                    Reply by {{ comment.reply.creator }}: {{ truncateText(comment.reply.text)
                    }}<span v-if="comment.reply.edited" class="text-grey-7"> (Edited)</span>
                  </div>
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    v-if="index === sortedComments.length - 1 && currentUserRole === 'observer'"
                    round
                    dense
                    color="secondary"
                    icon="add"
                    size="sm"
                    class="right-btn"
                    @click.stop="openCommentDialog(null, null)"
                    :disable="currentUserRole !== 'observer'"
                    aria-label="Add Comment"
                  >
                    <q-tooltip>Add Comment</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
            <div
              v-else
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative row items-center justify-between"
            >
              <span>No comments available</span>
              <q-btn
                v-if="currentUserRole === 'observer'"
                round
                dense
                color="secondary"
                icon="add"
                size="sm"
                @click="openCommentDialog(null, null)"
                :disable="currentUserRole !== 'observer'"
                aria-label="Add Comment"
              >
                <q-tooltip>Add Comment</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-expansion-item>

        <!-- Comment Dialog -->
        <q-dialog v-model="showCommentDialog" persistent>
          <q-card class="dialog-card">
            <q-card-section class="dialog-header">
              <div class="text-h6">Comment Details</div>
              <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
            </q-card-section>
            <q-separator />
            <q-card-section class="dialog-content">
              <div class="text-subtitle2 q-mb-md">
                Written by: {{ selectedComment?.creator || 'Unknown' }}
                <span v-if="selectedComment?.edited" class="text-weight-bold text-grey-7">
                  (Edited)</span
                >
              </div>
              <div class="text-subtitle2 q-mb-md">Date: {{ selectedComment?.date || 'N/A' }}</div>
              <textarea
                v-model="selectedComment.details"
                placeholder="Comment details..."
                class="resizable-note custom-textarea"
                :disabled="!isCommentOwner"
              />
              <div v-if="selectedComment?.reply" class="q-mt-md">
                <div class="text-subtitle2 q-mb-md">
                  Reply by {{ selectedComment.reply.creator }}
                  <span v-if="selectedComment.reply.edited" class="text-weight-bold text-grey-7">
                    (Edited)</span
                  >
                </div>
                <textarea
                  v-model="selectedComment.reply.text"
                  placeholder="Reply..."
                  class="resizable-note custom-textarea"
                  :disabled="currentUserRole !== 'owner'"
                />
              </div>
              <div v-else-if="currentUserRole === 'owner'" class="q-mt-md">
                <div class="text-subtitle2 q-mb-md">Add Reply:</div>
                <textarea
                  v-model="newReplyText"
                  placeholder="Enter your reply..."
                  class="resizable-note custom-textarea"
                  :disabled="currentUserRole !== 'owner'"
                />
              </div>
              <div
                v-if="currentUserRole === 'owner' && selectedComment?.history?.length"
                class="q-mt-md"
              >
                <div class="text-subtitle2 q-mb-md">Previous Comment Versions:</div>
                <div class="comment-history">
                  <div
                    v-for="(version, index) in selectedComment.history.slice().reverse()"
                    :key="index"
                    class="q-py-xs q-px-sm bg-grey-2 rounded-borders q-mb-xs text-grey-7"
                  >
                    <div class="text-caption">Edited on: {{ version.date }}</div>
                    <div>{{ version.details }}</div>
                  </div>
                </div>
              </div>
              <div
                v-if="currentUserRole === 'owner' && selectedComment?.reply?.history?.length"
                class="q-mt-md"
              >
                <div class="text-subtitle2 q-mb-md">Previous Reply Versions:</div>
                <div class="comment-history">
                  <div
                    v-for="(version, index) in selectedComment.reply.history.slice().reverse()"
                    :key="index"
                    class="q-py-xs q-px-sm bg-grey-2 rounded-borders q-mb-xs text-grey-7"
                  >
                    <div class="text-caption">Edited on: {{ version.date }}</div>
                    <div>{{ version.text }}</div>
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-actions class="dialog-actions">
              <q-btn
                flat
                label="Close"
                color="primary"
                v-close-popup
                @click="closeCommentDialog"
                class="right-btn"
              />
              <q-btn
                v-if="isCommentOwner || currentUserRole === 'owner'"
                label="Save"
                color="positive"
                @click="saveCommentOrReply"
                :disable="!isCommentOwner && currentUserRole !== 'owner'"
                class="right-btn"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Subitem Form -->
        <div class="bg-white" style="padding: 3px">
          <div v-if="!toggleSubitemForm">
            <q-btn
              label="New Subitem"
              icon="add"
              color="secondary"
              class="full-width q-mb-xs right-btn"
              @click="openSubitemForm"
              :disable="!canAddSubitems"
            />
          </div>
          <div v-if="toggleSubitemForm" class="bg-white q-pa-md subitem-form">
            <q-form @submit.prevent="addSubitem">
              <q-select
                v-model="subitemForm.type"
                :options="itemTypeOptions"
                label="Subitem Type (select or type)"
                dense
                use-input
                input-debounce="0"
                :error="!subitemForm.type && subitemFormSubmitted"
                error-message="Subitem Type is required"
                :disable="!canAddSubitems"
                new-value-mode="add-unique"
              />
              <q-input
                v-model="subitemForm.title"
                label="Subitem Title"
                dense
                :error="!subitemForm.title && subitemFormSubmitted"
                error-message="Title is required"
                :disable="!canAddSubitems"
              />
              <q-input
                v-model="subitemForm.deadline"
                label="Deadline"
                dense
                type="datetime-local"
                :max="item.deadline || undefined"
                :error="!subitemForm.deadline && subitemFormSubmitted"
                error-message="Deadline is required"
                :disable="!canAddSubitems"
              />
              <q-select
                v-model="subitemForm.status"
                :options="statusOptions"
                label="Status"
                dense
                :error="!subitemForm.status && subitemFormSubmitted"
                error-message="Status is required"
                :disable="!canAddSubitems"
              />
              <q-select
                v-model="subitemForm.priority"
                :options="['Low', 'Medium', 'High']"
                label="Priority"
                dense
                :error="!subitemForm.priority && subitemFormSubmitted"
                error-message="Priority is required"
                :disable="!canAddSubitems"
              />
              <div class="row q-mt-sm">
                <q-btn
                  type="submit"
                  label="Save Subitem"
                  color="secondary"
                  class="full-width q-mr-sm right-btn"
                  :disable="!canAddSubitems"
                />
                <q-btn
                  flat
                  label="Cancel"
                  color="negative"
                  class="full-width"
                  @click="cancelSubitemForm"
                />
              </div>
            </q-form>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Dialog -->
    <q-dialog v-model="showShareDialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header">
          <div class="text-h6">Share With</div>
          <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
        </q-card-section>
        <q-separator />
        <q-card-section class="dialog-content">
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
                :disable="!canShare"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-select
                v-model="selectedRole"
                :options="
                  currentUserRole === 'admin' ? ['observer'] : ['owner', 'admin', 'observer']
                "
                label="Role"
                dense
                class="col-4"
                :disable="!canShare"
              />
            </div>
            <q-list
              bordered
              class="q-mb-md user-list"
              v-if="searchUsername && filteredUsers.length"
            >
              <q-item
                v-for="user in filteredUsers"
                :key="user.username"
                clickable
                @click="selectUser(user)"
                class="user-item"
              >
                <q-item-section>{{ user.username }}</q-item-section>
              </q-item>
            </q-list>
            <q-item v-if="isLoadingUsers" class="text-grey">
              <q-item-section>Loading users...</q-item-section>
            </q-item>
            <q-btn
              label="Add User"
              color="secondary"
              type="submit"
              class="full-width q-mb-md right-btn"
              :disable="!canShare || !searchUsername || usernameError || !isValidUsername"
            />
          </q-form>
          <div v-if="newSharedUsers.length" class="q-mt-md">
            <div class="text-subtitle2">Selected Users:</div>
            <div
              v-for="(share, index) in newSharedUsers"
              :key="index"
              class="row items-center q-mb-xs"
            >
              <q-item-section
                >{{ share.username }}
                <span class="text-weight-bold">({{ share.role }})</span></q-item-section
              >
              <q-btn
                v-if="currentUserRole === 'owner'"
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="(newSharedUsers.splice(index, 1), searchUsers())"
                :disable="!canShare"
              />
            </div>
          </div>
          <div v-if="item?.shareWith?.length" class="q-mt-md">
            <div class="text-subtitle2">Currently Shared With:</div>
            <div
              v-for="(share, index) in item.shareWith"
              :key="index"
              class="row items-center q-mb-xs"
            >
              <q-item-section
                >{{ share.username }}
                <span class="text-weight-bold"
                  >({{ share.role }}{{ share.status === 'pending' ? ', Pending' : '' }})</span
                ></q-item-section
              >
              <q-btn
                v-if="
                  currentUserRole === 'owner' &&
                  share.role !== 'owner' &&
                  share.username !== currentUser
                "
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
        <q-card-actions class="dialog-actions">
          <q-btn
            flat
            label="Close"
            color="primary"
            v-close-popup
            @click="closeShareDialog"
            class="right-btn"
          />
          <q-btn
            label="Save"
            color="positive"
            @click="saveSharedUsers"
            :disable="!canShare"
            class="right-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Assign Dialog -->
    <q-dialog v-model="showAssignDialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header">
          <div class="text-h6">Assign Item</div>
          <q-btn dense flat icon="close" color="primary" v-close-popup aria-label="Close" />
        </q-card-section>
        <q-separator />
        <q-card-section class="dialog-content">
          <q-form @submit.prevent="addAssignee">
            <q-select
              v-model="selectedItem"
              :options="itemOptions"
              label="Select Item"
              option-label="label"
              option-value="value"
              dense
              :error="!selectedItem && assignFormSubmitted"
              error-message="Please select an item"
              class="q-mb-md"
              :disable="!canAssign"
            />
            <q-input
              v-model="searchAssignUsername"
              label="Search Username"
              dense
              @input="searchAssignUsers"
              :error="assignFormSubmitted && !isValidAssignUsername"
              error-message="Please enter a valid username with admin or owner role"
              aria-label="Search for users to assign"
              :disable="!canAssign"
            />
            <q-list v-if="filteredAssignUsers.length" bordered class="q-mt-md user-list">
              <q-item
                v-for="user in filteredAssignUsers"
                :key="user.username"
                clickable
                @click="selectAssignee(user)"
              >
                <q-item-section
                  >{{ user.username }}
                  <span class="text-weight-bold">({{ user.role }})</span></q-item-section
                >
              </q-item>
            </q-list>
            <div v-else-if="searchAssignUsername && !isLoadingUsers" class="q-mt-md text-negative">
              No eligible users found
            </div>
            <div v-if="isLoadingUsers" class="q-mt-md text-grey">Loading users...</div>
            <div v-if="newAssignees.length" class="q-mt-md">
              <div class="text-subtitle2">Selected Users:</div>
              <div
                v-for="(assignee, index) in newAssignees"
                :key="index"
                class="row items-center q-mb-xs"
              >
                <q-item-section
                  >{{ assignee.username }}
                  <span class="text-weight-bold">({{ assignee.role }})</span></q-item-section
                >
                <q-input
                  v-model="assignee.note"
                  label="Note"
                  dense
                  placeholder="What should this user do?"
                  class="col q-mr-sm"
                  :disable="!canAssign"
                />
                <q-btn
                  v-if="canAssign"
                  flat
                  round
                  icon="remove"
                  color="negative"
                  size="sm"
                  @click="newAssignees.splice(index, 1)"
                  :disable="!canAssign"
                />
              </div>
            </div>
            <q-btn
              label="Add User"
              color="secondary"
              type="submit"
              class="full-width q-mt-md right-btn"
              :disable="!canAssign || !searchAssignUsername || !isValidAssignUsername"
            />
          </q-form>
          <div v-if="selectedItem?.value?.assignedTo?.length" class="q-mt-md">
            <div class="text-subtitle2">Currently Assigned To:</div>
            <div
              v-for="(assignee, index) in selectedItem.value.assignedTo"
              :key="index"
              class="row items-center q-mb-xs"
            >
              <q-item-section
                >{{ assignee.username }}
                <span class="text-weight-bold"
                  >({{ assignee.role }}): {{ assignee.note || 'No note' }}</span
                ></q-item-section
              >
              <q-btn
                v-if="canAssign"
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="removeAssignment(index)"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="dialog-actions">
          <q-btn
            flat
            label="Close"
            color="primary"
            v-close-popup
            @click="closeAssignDialog"
            class="right-btn"
          />
          <q-btn
            label="Save"
            color="positive"
            @click="saveAssignment"
            :disable="!canAssign || !selectedItem || !newAssignees.length"
            aria-label="Save assignment"
            class="right-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

```vue:disable-run
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' })
const currentDateTime = ref('')
const item = ref(null)
const searchQuery = ref('')
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
  priority: '',
  category: [],
})
const statusOptions = ref(['Backlog', 'In Progress', 'Done'])
const categoryOptions = ref(['Development', 'Design', 'Marketing', 'Research', 'Others'])
const errorMessage = ref('')
const itemId = ref(0)
const showNoteDialog = ref(false)
const noteDialogMode = ref('add') // 'add' or 'edit'
const noteDraft = ref('')
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
const currentUser = ref(JSON.parse(localStorage.getItem('userProfile') || '{}')?.username || '')
const parentChain = ref([])
const selectedItem = ref(null)
const newAssignees = ref([])
const assignFormSubmitted = ref(false)
const showAssigneeDialog = ref(false)
const selectedAssignee = ref(null)
const selectedAssigneeIndex = ref(null)
const showReportDialog = ref(false)
const showAddReportDialog = ref(false)
const showMeetingDialog = ref(false)
const meetingType = ref('')
const meetingTitle = ref('')
const meetingReason = ref('')
const meetingEntranceDateTime = ref('')
const meetingPlace = ref('')
const meetingFormSubmitted = ref(false)
const selectedMeetingUsers = ref([])
const showMeetingDetailsDialog = ref(false)
const selectedMeeting = ref(null)
const selectedMeetingIndex = ref(null)
const showCommentDialog = ref(false)
const selectedComment = ref(null)
const selectedCommentIndex = ref(null)
const newReplyText = ref('')
const itemTypeOptions = ref(['Story', 'Epic', 'Project', 'Task'])

// Update currentDateTime dynamically
const updateCurrentDateTime = () => {
  const now = new Date()
  currentDateTime.value = now.toISOString().slice(0, 16)
}

// Log for debugging currentUser after login
console.log('Current User:', currentUser.value)

const isValidAssignUsername = computed(() => {
  if (!searchAssignUsername.value || !Array.isArray(item.value?.shareWith)) return false
  return item.value.shareWith.some(
    (share) =>
      share.username.toLowerCase() === searchAssignUsername.value.toLowerCase() &&
      (share.role === 'admin' || share.role === 'owner') &&
      !share.status,
  )
})

const itemOptions = computed(() => {
  if (!item.value) return []
  const options = [{ label: `${item.value.type}: ${item.value.title}`, value: item.value }]
  if (item.value.subitems) {
    item.value.subitems.forEach((subitem) => {
      options.push({ label: `${subitem.type}: ${subitem.title}`, value: subitem })
    })
  }
  return options
})

const sortedAssignees = computed(() => {
  return item.value?.assignedTo
    ? [...item.value.assignedTo].sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
    : []
})

const sortedMeetings = computed(() => {
  if (!item.value?.meetings) return []
  return [...item.value.meetings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const currentUserRole = computed(() => {
  if (!item.value) return 'N/A'
  const userShare = item.value.shareWith?.find((share) => share.username === currentUser.value)
  if (userShare) return userShare.role
  return item.value.creator === currentUser.value ? 'owner' : 'observer'
})

const canEdit = computed(() => {
  if (!item.value) return false
  return (
    item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && share.role === 'owner' && !share.status,
    )
  )
})

const canManageOwnReports = computed(() => {
  if (!item.value) return false
  return (
    item.value.shareWith?.some(
      (share) =>
        share.username === currentUser.value &&
        (share.role === 'admin' || share.role === 'owner') &&
        !share.status,
    ) || item.value.creator === currentUser.value
  )
})

const canAddComment = computed(() => {
  return currentUserRole.value === 'observer'
})

const isCommentOwner = computed(() => {
  return (
    selectedComment.value?.creator === currentUser.value && currentUserRole.value === 'observer'
  )
})

const canChangeStatus = computed(() => {
  if (!item.value) return false
  if (item.value.creator === currentUser.value) return true
  const userShare = item.value.shareWith?.find((share) => share.username === currentUser.value)
  if (userShare && userShare.role === 'owner') return true
  if (userShare && userShare.role === 'admin') {
    return (
      item.value.assignedTo?.some((assignee) => assignee.username === currentUser.value) || false
    )
  }
  return false
})

const canChangeSubitemStatus = (subitem) => {
  if (!subitem) return false
  if (subitem.creator === currentUser.value) return true
  const userShare = subitem.shareWith?.find((share) => share.username === currentUser.value)
  if (userShare && userShare.role === 'owner') return true
  if (userShare && userShare.role === 'admin') {
    return subitem.assignedTo?.some((assignee) => assignee.username === currentUser.value) || false
  }
  return false
}

const canAssign = computed(() => {
  if (!item.value) return false
  const userShare = item.value.shareWith?.find((share) => share.username === currentUser.value)
  return userShare?.role === 'owner' && !userShare?.status
})

const canShare = computed(() => {
  if (!item.value) return false
  return (
    item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && share.role === 'owner',
    )
  )
})

const canAddSubitems = computed(() => {
  if (!item.value) return false
  return (
    item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && share.role === 'owner',
    ) ||
    item.value.assignedTo?.some((assignee) => assignee.username === currentUser.value)
  )
})

const canEditAssignee = computed(() => {
  if (!item.value) return false
  return (
    item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && share.role === 'owner',
    )
  )
})

const isValidUsername = computed(() => {
  if (!searchUsername.value || !Array.isArray(availableUsers.value)) return false
  return availableUsers.value.some(
    (user) => user.username && user.username.toLowerCase() === searchUsername.value.toLowerCase(),
  )
})

const sortedReports = computed(() => {
  return item.value?.reports
    ? [...item.value.reports].sort((a, b) => new Date(b.date) - new Date(a.date))
    : []
})

const sortedComments = computed(() => {
  return item.value?.comments
    ? [...item.value.comments].sort((a, b) => new Date(b.date) - new Date(a.date))
    : []
})

const isReportOwner = computed(() => {
  return selectedReport.value?.creator === currentUser.value
})

const isMeetingParticipant = computed(() => {
  return selectedMeeting.value?.users.includes(currentUser.value)
})

const completionPercent = computed(() => {
  if (!item.value?.subitems || item.value.subitems.length === 0) return 0
  const doneItems = item.value.subitems.filter((sub) => sub.status?.toLowerCase() === 'done').length
  return Math.round((doneItems / item.value.subitems.length) * 100)
})

watch(
  () => localStorage.getItem('kanbanUsers'),
  (newValue) => {
    const users = JSON.parse(newValue || '[]')
    availableUsers.value = Array.isArray(users) ? users : []
    console.log('Kanban Users Updated:', availableUsers.value)
  },
)

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
  console.log(`Updated items for user ${username}:`, userItems)
}

const updateSubitemsShareWith = (item, shareWith) => {
  if (item.subitems) {
    item.subitems.forEach((subitem) => {
      subitem.shareWith = [...shareWith]
      updateSubitemsShareWith(subitem, shareWith)
    })
  }
}

const updateSubitemsAssignedTo = (item, assignedTo) => {
  if (item.subitems) {
    item.subitems.forEach((subitem) => {
      subitem.assignedTo = subitem.assignedTo || []
      assignedTo.forEach((newAssignee) => {
        if (!subitem.assignedTo.some((a) => a.username === newAssignee.username)) {
          subitem.assignedTo.unshift({ ...newAssignee })
        }
      })
      updateSubitemsAssignedTo(subitem, assignedTo)
    })
  }
}

const removeAssignmentFromSubitems = (item, username) => {
  if (item.subitems) {
    item.subitems.forEach((subitem) => {
      subitem.assignedTo = subitem.assignedTo?.filter((a) => a.username !== username) || []
      removeAssignmentFromSubitems(subitem, username)
    })
  }
}

const buildParentChain = (items, id) => {
  const chain = []
  let currentItem = findItemById(items, id)
  while (currentItem && currentItem.parentId) {
    const parent = findItemById(items, currentItem.parentId)
    if (parent) {
      chain.unshift(parent)
      currentItem = parent
    } else {
      break
    }
  }
  return chain
}

onMounted(() => {
  console.log('Component Mounted, Loading Items...')
  updateCurrentDateTime()
  setInterval(updateCurrentDateTime, 60000) // Update every minute
  loadItems()
  const users = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  availableUsers.value = Array.isArray(users) ? users : []
  console.log('Initial Kanban Users:', availableUsers.value)
})

const loadItems = () => {
  console.log('Loading items for user:', currentUser.value)
  const items = JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]')
  itemId.value = Number(route.params.id)
  console.log('Item ID:', itemId.value)
  item.value = findItemById(items, itemId.value)
  if (!item.value) {
    errorMessage.value = 'Item not found.'
    console.error('Error: Item not found for ID:', itemId.value)
    setTimeout(() => {
      router.push('/home')
    }, 3000)
    return
  }
  console.log('Loaded Item:', item.value)
  if (!item.value.shareWith) item.value.shareWith = [{ username: currentUser.value, role: 'owner' }]
  if (!item.value.creator) item.value.creator = currentUser.value
  console.log('Item Creator:', item.value.creator)
  if (!item.value.assignedTo) item.value.assignedTo = []
  if (!item.value.meetings) item.value.meetings = []
  if (!item.value.comments) item.value.comments = []
  if (item.value.parentId) {
    directParent.value = findItemById(items, item.value.parentId)
    console.log('Direct Parent:', directParent.value)
  } else {
    directParent.value = null
  }
  parentChain.value = buildParentChain(items, itemId.value)
  console.log('Parent Chain:', parentChain.value)
  isEditing.value = false
  setEditingState(itemId.value, false)
  toggleSubitemForm.value = false
  showAddReportDialog.value = false
  selectedReport.value = null
  selectedReportIndex.value = null
  showReportDialog.value = false
  showMeetingDialog.value = false
  meetingType.value = ''
  meetingTitle.value = ''
  meetingReason.value = ''
  meetingEntranceDateTime.value = ''
  meetingPlace.value = ''
  meetingFormSubmitted.value = false
  selectedMeetingUsers.value = []
  showMeetingDetailsDialog.value = false
  selectedMeeting.value = null
  selectedMeetingIndex.value = null
  showCommentDialog.value = false
  selectedComment.value = null
  selectedCommentIndex.value = null
  newReplyText.value = ''
  resetSubitemForm()
  if (!item.value.note) item.value.note = ''
  if (!item.value.reports) item.value.reports = []
  if (item.value.noteHistory) {
    item.value.noteHistory = item.value.noteHistory.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    )
  }
  if (item.value.reports) {
    item.value.reports = item.value.reports.map((report) => ({
      ...report,
      history: report.history
        ? report.history.sort((a, b) => new Date(b.date) - new Date(a.date))
        : [],
    }))
  }
  if (item.value.comments) {
    item.value.comments = item.value.comments.map((comment) => ({
      ...comment,
      history: comment.history
        ? comment.history.sort((a, b) => new Date(b.date) - new Date(a.date))
        : [],
      reply: comment.reply
        ? {
            ...comment.reply,
            history: comment.reply.history
              ? comment.reply.history.sort((a, b) => new Date(b.date) - new Date(a.date))
              : [],
          }
        : null,
    }))
  }
  if (item.value.meetings) {
    item.value.meetings = item.value.meetings.map((meeting) => ({
      ...meeting,
      descriptionHistory: meeting.descriptionHistory
        ? meeting.descriptionHistory.sort((a, b) => new Date(a.date) - new Date(b.date))
        : [],
    }))
  }
}

watch(
  () => route.params.id,
  () => {
    console.log('Route ID changed, reloading items...')
    loadItems()
  },
)

const openSubitemForm = () => {
  if (!canAddSubitems.value) {
    console.log('Cannot open subitem form: Insufficient permissions')
    return
  }
  toggleSubitemForm.value = true
  errorMessage.value = ''
  console.log('Opened subitem form')
}

const startDrag = (item) => {
  if (canChangeSubitemStatus(item)) {
    draggedItem.value = item
    console.log('Started dragging item:', item)
  }
}

const handleDrop = (newStatus) => {
  if (!canChangeSubitemStatus(draggedItem.value) || !draggedItem.value) {
    console.log('Cannot drop: Invalid item or permissions')
    return
  }
  if (newStatus === 'done') {
    const allSubitemsDone =
      !draggedItem.value.subitems ||
      draggedItem.value.subitems.every((sub) => sub.status === 'done')
    if (!allSubitemsDone) {
      errorMessage.value = 'Cannot move to Done: All subitems must be in Done status.'
      console.error('Drop failed: All subitems must be done')
      return
    }
    draggedItem.value.movedToDoneAt = Date.now()
  }
  draggedItem.value.status = newStatus
  console.log(`Dropped item to status: ${newStatus}`)
  saveItem()
  errorMessage.value = ''
  draggedItem.value = null
}

const deleteItem = (id) => {
  if (!canAddSubitems.value) {
    console.log('Cannot delete item: Insufficient permissions')
    return
  }
  const items = JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]')
  const targetItem = findItemById(items, id)
  if (!targetItem) {
    console.log('Item not found for deletion:', id)
    return
  }
  const shareUsernames = targetItem.shareWith
    .filter((share) => share.username !== currentUser.value)
    .map((share) => share.username)
  shareUsernames.forEach((username) => {
    const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${username}`) || '[]')
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
    if (!targetItem.parentId) {
      const newUserItems = userItems.filter((i) => i.id !== id)
      localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(newUserItems))
      console.log(`Deleted item ${id} from user ${username}`)
    } else {
      for (let i = 0; i < userItems.length; i++) {
        if (deleteRecursive(userItems[i].subitems || [], id)) {
          localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(userItems))
          console.log(`Deleted subitem ${id} from user ${username}`)
          break
        }
      }
    }
    const invitations = JSON.parse(localStorage.getItem(`kanbanInvitations_${username}`) || '[]')
    const newInvitations = invitations.filter((inv) => inv.itemId !== id)
    localStorage.setItem(`kanbanInvitations_${username}`, JSON.stringify(newInvitations))
    console.log(`Removed invitations for item ${id} for user ${username}`)
  })
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
    localStorage.setItem(`kanbanItems_${currentUser.value}`, JSON.stringify(items))
    console.log(`Deleted item ${id} for current user`)
    if (item.value && item.value.id === id) {
      router.push('/home')
    } else {
      item.value.subitems = item.value.subitems.filter((sub) => sub.id !== id)
      saveItem()
    }
  }
}

const viewItem = (id) => {
  if (id) {
    console.log('Viewing item:', id)
    router.push(`/itemDetail/${id}`)
  }
}

const addSubitem = () => {
  if (!canAddSubitems.value) {
    console.log('Cannot add subitem: Insufficient permissions')
    return
  }
  subitemFormSubmitted.value = true
  if (
    !subitemForm.value.type ||
    !subitemForm.value.title ||
    !subitemForm.value.deadline ||
    !subitemForm.value.status ||
    !subitemForm.value.priority
  ) {
    errorMessage.value = 'Please fill all required fields'
    console.error('Subitem form validation failed:', subitemForm.value)
    return
  }
  if (item.value.deadline && subitemForm.value.deadline) {
    if (new Date(subitemForm.value.deadline) > new Date(item.value.deadline)) {
      errorMessage.value = 'Subitem deadline cannot be after the parent item deadline.'
      console.error('Subitem deadline validation failed')
      return
    }
  }
  if (!statusOptions.value.includes(subitemForm.value.type)) {
    statusOptions.value.push(subitemForm.value.type)
  }
  subitemForm.value.category.forEach((cat) => {
    if (!categoryOptions.value.includes(cat)) {
      categoryOptions.value.push(cat)
    }
  })
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done',
  }
  if (item.value) {
    const shareWith = item.value.shareWith.map((s) => ({ ...s }))
    if (item.value.assignedTo?.some((assignee) => assignee.username === currentUser.value)) {
      const userIndex = shareWith.findIndex((s) => s.username === currentUser.value)
      if (userIndex >= 0) {
        shareWith[userIndex] = { ...shareWith[userIndex], role: 'admin' }
      } else {
        shareWith.push({ username: currentUser.value, role: 'admin' })
      }
    }
    const newSubitem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: subitemForm.value.type,
      title: subitemForm.value.title,
      deadline: subitemForm.value.deadline,
      status: statusMap[subitemForm.value.status] || 'backlog',
      priority: subitemForm.value.priority,
      parentId: item.value.id,
      category: subitemForm.value.category,
      subitems: [],
      shareWith,
      movedToDoneAt: subitemForm.value.status === 'Done' ? Date.now() : null,
      note: '',
      creator: currentUser.value,
      assignedTo: item.value.assignedTo ? item.value.assignedTo.map((a) => ({ ...a })) : [],
      reports: [],
      meetings: [],
      comments: [],
    }
    item.value.subitems = item.value.subitems || []
    item.value.subitems.push(newSubitem)
    console.log('Added new subitem:', newSubitem)
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
    console.log('Saved item:', item.value)
    updateSharedItems(item.value, currentUser.value)
    loadItems()
  }
}

const updateSharedItems = (updatedItem, sourceUser) => {
  const shareUsernames = updatedItem.shareWith
    .filter(
      (share) => share.username !== sourceUser && (!share.status || share.status !== 'pending'),
    )
    .map((share) => share.username)
  shareUsernames.forEach((username) => {
    updateItemInUserStorage(updatedItem, username)
  })
}

const saveDetails = () => {
  if (!canEdit.value) {
    console.log('Cannot save details: Insufficient permissions')
    return
  }
  formSubmitted.value = true
  if (!item.value.title) {
    errorMessage.value = 'Please fill all required fields'
    console.error('Details validation failed: Title is required')
    return
  }
  if (directParent.value?.deadline && item.value.deadline) {
    if (new Date(item.value.deadline) > new Date(directParent.value.deadline)) {
      errorMessage.value = 'Item deadline cannot be after the direct parent item deadline.'
      console.error('Details validation failed: Invalid deadline')
      return
    }
  }
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done',
  }
  const newStatus = statusMap[item.value.status] || item.value.status.toLowerCase()
  if (newStatus === 'done') {
    const allSubitemsDone =
      !item.value.subitems || item.value.subitems.every((sub) => sub.status === 'done')
    if (!allSubitemsDone) {
      errorMessage.value = 'Cannot set to Done: All subitems must be in Done status.'
      console.error('Details validation failed: All subitems must be done')
      return
    }
    item.value.movedToDoneAt = Date.now()
  }
  item.value.status = newStatus
  console.log('Saving item details:', item.value)
  saveItem()
  toggleEdit(false)
  errorMessage.value = ''
}

const toggleEdit = (value) => {
  if (!canEdit.value) {
    console.log('Cannot toggle edit: Insufficient permissions')
    return
  }
  isEditing.value = value
  setEditingState(itemId.value, value)
  console.log('Toggled edit mode:', value)
  if (!value) {
    formSubmitted.value = true
  }
}

const cancelSubitemForm = () => {
  resetSubitemForm()
  toggleSubitemForm.value = false
  errorMessage.value = ''
  console.log('Cancelled subitem form')
}

const resetSubitemForm = () => {
  subitemForm.value = {
    type: '',
    title: '',
    deadline: '',
    status: '',
    priority: '',
    category: [],
  }
  subitemFormSubmitted.value = false
  console.log('Reset subitem form')
}

const deleteNote = () => {
  if (!canEdit.value) {
    console.log('Cannot delete note: Insufficient permissions')
    return
  }
  item.value.noteHistory = item.value.noteHistory || []
  item.value.noteHistory.push({
    note: item.value.note,
    date: new Date().toLocaleString('en-US'),
    editedBy: currentUser.value,
  })
  item.value.note = ''
  console.log('Deleted note')
  saveItem()
  errorMessage.value = ''
}

const openNoteDialog = () => {
  if (!canEdit.value) {
    console.log('Cannot open note dialog: Insufficient permissions')
    return
  }
  if (item.value.note) {
    noteDialogMode.value = 'edit'
    noteDraft.value = item.value.note
  } else {
    noteDialogMode.value = 'add'
    noteDraft.value = ''
  }
  showNoteDialog.value = true
}

const saveNoteFromDialog = () => {
  if (!canEdit.value) {
    console.log('Cannot save note: Insufficient permissions')
    return
  }
  if (noteDraft.value && noteDraft.value.trim()) {
    item.value.noteHistory = item.value.noteHistory || []
    if (noteDialogMode.value === 'edit' && item.value.note) {
      item.value.noteHistory.push({
        note: item.value.note,
        date: new Date().toLocaleString('en-US'),
        editedBy: currentUser.value,
      })
    }
    item.value.note = noteDraft.value.trim()
    item.value.noteHistory.push({
      note: item.value.note,
      date: new Date().toLocaleString('en-US'),
      editedBy: currentUser.value,
    })
    showNoteDialog.value = false
    saveItem()
    errorMessage.value = ''
    console.log(`Note ${noteDialogMode.value === 'add' ? 'created' : 'updated'}`)
  } else {
    errorMessage.value = 'Note cannot be empty'
  }
}

const cancelReport = () => {
  showAddReportDialog.value = false
  newReportDetails.value = ''
  reportFormSubmitted.value = false
  errorMessage.value = ''
  console.log('Cancelled report form')
}

const saveReport = () => {
  if (!canManageOwnReports.value) {
    console.log('Cannot save report: Insufficient permissions')
    return
  }
  reportFormSubmitted.value = true
  if (!newReportDetails.value || !newReportDetails.value.trim()) {
    errorMessage.value = 'Report details cannot be empty.'
    console.error('Report validation failed: Details are empty')
    return
  }
  const currentDateTime = new Date().toLocaleString('en-US')
  const newReport = {
    date: currentDateTime,
    details: newReportDetails.value,
    creator: currentUser.value,
    history: [],
    edited: false,
  }
  item.value.reports = item.value.reports || []
  item.value.reports.unshift(newReport)
  console.log('Saved report:', newReport)
  saveItem()
  showAddReportDialog.value = false
  newReportDetails.value = ''
  reportFormSubmitted.value = false
  errorMessage.value = ''
}

const openReportDialog = (report, index) => {
  selectedReport.value = { ...report }
  selectedReportIndex.value = index
  showReportDialog.value = true
  showAddReportDialog.value = false
  console.log('Opened report dialog for report:', report)
}

const closeReportDialog = () => {
  showReportDialog.value = false
  selectedReport.value = null
  selectedReportIndex.value = null
  errorMessage.value = ''
  console.log('Closed report dialog')
}

const cancelEditReport = () => {
  selectedReport.value = null
  selectedReportIndex.value = null
  showReportDialog.value = false
  errorMessage.value = ''
  console.log('Cancelled report edit')
}

const saveEditedReport = () => {
  if (!isReportOwner.value) {
    console.log('Cannot save edited report: Not the report owner')
    return
  }
  if (
    !selectedReport.value ||
    !selectedReport.value.details ||
    !selectedReport.value.details.trim()
  ) {
    errorMessage.value = 'Report details cannot be empty.'
    console.error('Report edit validation failed: Details are empty')
    return
  }
  if (
    selectedReportIndex.value !== null &&
    item.value.reports &&
    item.value.reports.length > selectedReportIndex.value
  ) {
    const currentReport = item.value.reports[selectedReportIndex.value]
    if (!currentReport.history) {
      currentReport.history = []
    }
    if (selectedReport.value.details !== currentReport.details) {
      currentReport.history.push({
        details: currentReport.details,
        date: new Date().toLocaleString('en-US'),
      })
      selectedReport.value.edited = true
    }
    item.value.reports[selectedReportIndex.value] = {
      ...selectedReport.value,
      date: currentReport.date,
      creator: currentReport.creator,
    }
    console.log('Saved edited report:', selectedReport.value)
    saveItem()
  }
  selectedReport.value = null
  selectedReportIndex.value = null
  showReportDialog.value = false
  errorMessage.value = ''
}

const openCommentDialog = (comment, index) => {
  if (!item.value) return
  if (comment) {
    selectedComment.value = { ...comment }
    selectedCommentIndex.value = index
  } else {
    selectedComment.value = { creator: currentUser.value, details: '', history: [], edited: false }
    selectedCommentIndex.value = null
  }
  showCommentDialog.value = true
  newReplyText.value = ''
  console.log('Opened comment dialog for:', comment || 'new comment')
}

const closeCommentDialog = () => {
  showCommentDialog.value = false
  selectedComment.value = null
  selectedCommentIndex.value = null
  newReplyText.value = ''
  errorMessage.value = ''
  console.log('Closed comment dialog')
}

const saveCommentOrReply = () => {
  if (!item.value) return

  if (isCommentOwner.value) {
    if (!selectedComment.value.details || !selectedComment.value.details.trim()) {
      errorMessage.value = 'Comment details cannot be empty.'
      console.error('Comment validation failed: Details are empty')
      return
    }
    if (selectedCommentIndex.value === null) {
      if (!canAddComment.value) {
        console.log('Cannot add comment: Insufficient permissions')
        return
      }
      const currentDateTime = new Date().toLocaleString('en-US')
      const newComment = {
        date: currentDateTime,
        details: selectedComment.value.details,
        creator: currentUser.value,
        history: [],
        edited: false,
      }
      item.value.comments = item.value.comments || []
      item.value.comments.unshift(newComment)
      console.log('Saved new comment:', newComment)
    } else {
      if (
        selectedCommentIndex.value !== null &&
        item.value.comments &&
        item.value.comments.length > selectedCommentIndex.value
      ) {
        const currentComment = item.value.comments[selectedCommentIndex.value]
        if (!currentComment.history) {
          currentComment.history = []
        }
        if (selectedComment.value.details !== currentComment.details) {
          currentComment.history.push({
            details: currentComment.details,
            date: new Date().toLocaleString('en-US'),
          })
          selectedComment.value.edited = true
        }
        item.value.comments[selectedCommentIndex.value] = {
          ...selectedComment.value,
          date: currentComment.date,
          creator: currentComment.creator,
        }
        console.log('Saved edited comment:', selectedComment.value)
      }
    }
    saveItem()
    closeCommentDialog()
    return
  }

  if (currentUserRole.value === 'owner') {
    if (
      selectedCommentIndex.value !== null &&
      item.value.comments &&
      item.value.comments.length > selectedCommentIndex.value
    ) {
      const currentComment = item.value.comments[selectedCommentIndex.value]
      if (!newReplyText.value && !currentComment.reply) {
        errorMessage.value = 'Reply cannot be empty.'
        console.error('Reply validation failed: Reply is empty')
        return
      }
      if (newReplyText.value && !currentComment.reply) {
        currentComment.reply = {
          creator: currentUser.value,
          text: newReplyText.value,
          history: [],
          date: new Date().toLocaleString('en-US'),
          edited: false,
        }
        console.log('Saved new reply:', currentComment.reply)
      } else if (currentComment.reply && selectedComment.value.reply?.text) {
        if (!currentComment.reply.history) {
          currentComment.reply.history = []
        }
        if (currentComment.reply.text !== selectedComment.value.reply.text) {
          currentComment.reply.history.push({
            text: currentComment.reply.text,
            date: new Date().toLocaleString('en-US'),
          })
          currentComment.reply.edited = true
        }
        currentComment.reply = {
          ...currentComment.reply,
          text: selectedComment.value.reply.text,
        }
        console.log('Saved edited reply:', currentComment.reply)
      }
      item.value.comments[selectedCommentIndex.value] = {
        ...currentComment,
      }
      saveItem()
      closeCommentDialog()
    }
  }
}

const openMeetingDialog = () => {
  if (currentUserRole.value === 'observer') {
    console.log('Cannot open meeting dialog: User is observer')
    return
  }
  showMeetingDialog.value = true
  meetingType.value = ''
  meetingTitle.value = ''
  meetingReason.value = ''
  meetingEntranceDateTime.value = ''
  meetingPlace.value = ''
  meetingFormSubmitted.value = false
  selectedMeetingUsers.value = []
  console.log('Opened meeting dialog')
}

const closeMeetingDialog = () => {
  showMeetingDialog.value = false
  meetingType.value = ''
  meetingTitle.value = ''
  meetingReason.value = ''
  meetingEntranceDateTime.value = ''
  meetingPlace.value = ''
  meetingFormSubmitted.value = false
  selectedMeetingUsers.value = []
  errorMessage.value = ''
  console.log('Closed meeting dialog')
}

const toggleMeetingUser = (user) => {
  if (user.status === 'pending') {
    console.log('Cannot toggle meeting user: User is pending')
    return
  }
  if (selectedMeetingUsers.value.includes(user.username)) {
    selectedMeetingUsers.value = selectedMeetingUsers.value.filter((u) => u !== user.username)
  } else {
    selectedMeetingUsers.value.push(user.username)
  }
  console.log('Toggled meeting user:', user.username, selectedMeetingUsers.value)
}

const startMeeting = () => {
  meetingFormSubmitted.value = true
  if (
    !meetingType.value ||
    !meetingTitle.value ||
    !meetingReason.value ||
    !meetingEntranceDateTime.value ||
    !selectedMeetingUsers.value.length ||
    (meetingType.value === 'In-person' && !meetingPlace.value)
  ) {
    errorMessage.value = 'All required meeting fields must be filled.'
    console.error('Meeting validation failed: Required fields missing')
    return
  }
  const currentDateTime = new Date().toLocaleString()
  const newMeeting = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    creator: currentUser.value,
    status: 'On Call',
    createdAt: currentDateTime,
    type: meetingType.value,
    title: meetingTitle.value,
    reason: meetingReason.value,
    entranceDateTime: meetingEntranceDateTime.value,
    place: meetingType.value === 'In-person' ? meetingPlace.value : null,
    link: meetingType.value === 'Online' ? `https://meet.example.com/${Date.now()}` : null,
    users: [currentUser.value, ...selectedMeetingUsers.value],
    description: '',
    descriptionHistory: [],
    edited: false,
  }
  item.value.meetings = item.value.meetings || []
  item.value.meetings.unshift(newMeeting)
  console.log('Started meeting:', newMeeting)
  saveItem()
  closeMeetingDialog()
  errorMessage.value = ''
}

const openMeetingDetailsDialog = (meeting, index) => {
  selectedMeeting.value = { ...meeting }
  selectedMeetingIndex.value = index
  showMeetingDetailsDialog.value = true
  console.log('Opened meeting details dialog for meeting:', meeting)
}

const closeMeetingDetailsDialog = () => {
  showMeetingDetailsDialog.value = false
  selectedMeeting.value = null
  selectedMeetingIndex.value = null
  errorMessage.value = ''
  console.log('Closed meeting details dialog')
}

const restrictEntranceDate = () => {
  return currentDateTime.value
}

const restrictExitDate = (entranceDateTime) => {
  if (!entranceDateTime) return ''
  const date = new Date(entranceDateTime)
  date.setHours(23, 59, 59, 999)
  return date.toISOString().slice(0, 16)
}

const saveAllMeetingDetails = () => {
  if (!selectedMeeting.value || selectedMeetingIndex.value === null) {
    errorMessage.value = 'Invalid meeting selection.'
    console.error('Meeting save failed: Invalid selection')
    return
  }
  if (!item.value.meetings || item.value.meetings.length <= selectedMeetingIndex.value) {
    errorMessage.value = 'Meeting not found.'
    console.error('Meeting save failed: Meeting not found')
    return
  }
  const currentMeeting = item.value.meetings[selectedMeetingIndex.value]
  if (selectedMeeting.value.creator === currentUser.value) {
    currentMeeting.status = selectedMeeting.value.status || 'On Call'
    currentMeeting.exitDateTime = selectedMeeting.value.exitDateTime || ''
    console.log('Saved meeting details for creator:', {
      status: selectedMeeting.value.status,
      exitDateTime: selectedMeeting.value.exitDateTime,
    })
  }
  if (isMeetingParticipant.value) {
    if (selectedMeeting.value.description !== currentMeeting.description) {
      currentMeeting.descriptionHistory = currentMeeting.descriptionHistory || []
      if (currentMeeting.description) {
        currentMeeting.descriptionHistory.push({
          description: currentMeeting.description,
          editedBy: currentUser.value,
          date: new Date().toLocaleString('en-US'),
        })
      }
      currentMeeting.description = selectedMeeting.value.description || ''
      currentMeeting.edited = currentMeeting.descriptionHistory.length > 0
      console.log('Saved meeting description for participant:', {
        description: selectedMeeting.value.description,
        editedBy: currentUser.value,
      })
    }
  }
  item.value.meetings[selectedMeetingIndex.value] = { ...currentMeeting }
  saveItem()
  closeMeetingDetailsDialog()
  errorMessage.value = ''
}

const truncateText = (text) => {
  if (!text) return ''
  return text.length > 30 ? text.substring(0, 30) + '...' : text
}

const formatItemDate = (value) => {
  if (!value) return 'No due date'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'No due date'
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

const openShareDialog = () => {
  if (!canShare.value) {
    console.log('Cannot open share dialog: Insufficient permissions')
    return
  }
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
  console.log('Opened share dialog')
}

const closeShareDialog = () => {
  showShareDialog.value = false
  searchUsername.value = ''
  selectedRole.value = 'observer'
  usernameError.value = false
  filteredUsers.value = []
  newSharedUsers.value = []
  isLoadingUsers.value = false
  console.log('Closed share dialog')
}

const searchUsers = () => {
  if (!Array.isArray(availableUsers.value)) {
    filteredUsers.value = []
    usernameError.value = true
    console.log('Search users failed: No available users')
    return
  }
  if (!searchUsername.value) {
    filteredUsers.value = []
    usernameError.value = false
    console.log('Cleared user search')
    return
  }
  filteredUsers.value = availableUsers.value.filter(
    (user) =>
      user.username &&
      user.username.toLowerCase().includes(searchUsername.value.toLowerCase()) &&
      user.username !== currentUser.value &&
      !item.value.shareWith.some((share) => share.username === user.username) &&
      !newSharedUsers.value.some((share) => share.username === user.username),
  )
  usernameError.value = !isValidUsername.value && !!searchUsername.value
  console.log('Searched users:', filteredUsers.value)
}

const selectUser = (user) => {
  newSharedUsers.value.push({ username: user.username, role: selectedRole.value })
  searchUsername.value = ''
  filteredUsers.value = []
  usernameError.value = false
  console.log('Selected user for sharing:', user)
}

const addSharedUser = () => {
  if (!canShare.value || !searchUsername.value || usernameError.value || !isValidUsername.value) {
    console.log('Cannot add shared user: Invalid input or permissions')
    return
  }
  const userExists =
    item.value.shareWith.some((share) => share.username === searchUsername.value) ||
    newSharedUsers.value.some((share) => share.username === searchUsername.value)
  if (userExists) {
    errorMessage.value = 'This user is already shared with this item.'
    console.error('Add shared user failed: User already shared')
    return
  }
  newSharedUsers.value.push({ username: searchUsername.value, role: selectedRole.value })
  searchUsername.value = ''
  filteredUsers.value = []
  usernameError.value = false
  console.log('Added shared user:', searchUsername.value)
}

const removeSharedUser = (index) => {
  if (currentUserRole.value !== 'owner') {
    console.log('Cannot remove shared user: Only owners can remove shared users')
    errorMessage.value = 'Only owners can remove shared users.'
    return
  }
  if (index < item.value.shareWith.length && item.value.shareWith[index].role !== 'owner') {
    const removedUser = item.value.shareWith[index]
    if (removedUser.username === currentUser.value && currentUserRole.value !== 'owner') {
      console.log('Cannot remove self: User is not owner')
      errorMessage.value = 'You cannot remove yourself from the shared list.'
      return
    }
    const isPending = removedUser.status === 'pending'
    const removedUsername = removedUser.username
    item.value.shareWith.splice(index, 1)
    updateSubitemsShareWith(item.value, item.value.shareWith)
    console.log('Removed shared user:', removedUsername)
    saveItem()
    const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${removedUsername}`) || '[]')
    const isParentItem = !item.value.parentId
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
    if (isParentItem) {
      const newUserItems = userItems.filter((i) => i.id !== item.value.id)
      localStorage.setItem(`kanbanItems_${removedUsername}`, JSON.stringify(newUserItems))
      console.log(`Removed item ${item.value.id} from user ${removedUsername}`)
      const invitations = JSON.parse(
        localStorage.getItem(`kanbanInvitations_${removedUsername}`) || '[]',
      )
      const newInvitations = invitations.filter((inv) => inv.itemId !== item.value.id)
      localStorage.setItem(`kanbanInvitations_${removedUsername}`, JSON.stringify(newInvitations))
      console.log(`Removed invitations for item ${item.value.id} for user ${removedUsername}`)
    } else if (!isPending) {
      for (let i = 0; i < userItems.length; i++) {
        if (deleteRecursive(userItems[i].subitems || [], item.value.id)) {
          localStorage.setItem(`kanbanItems_${removedUsername}`, JSON.stringify(userItems))
          console.log(`Removed subitem ${item.value.id} from user ${removedUsername}`)
          break
        }
      }
    }
  } else if (index >= item.value.shareWith.length) {
    newSharedUsers.value.splice(index - item.value.shareWith.length, 1)
    console.log('Removed new shared user from list')
  }
  searchUsers()
}

const saveSharedUsers = () => {
  if (!canShare.value) {
    console.log('Cannot save shared users: Insufficient permissions')
    return
  }
  newSharedUsers.value.forEach((share) => {
    item.value.shareWith.push({ username: share.username, role: share.role, status: 'pending' })
    const invitations = JSON.parse(
      localStorage.getItem(`kanbanInvitations_${share.username}`) || '[]',
    )
    invitations.push({
      itemId: item.value.id,
      username: share.username,
      role: share.role,
      status: 'pending',
      invitedAt: Date.now(),
      invitedBy: currentUser.value,
    })
    localStorage.setItem(`kanbanInvitations_${share.username}`, JSON.stringify(invitations))
    console.log('Saved shared user invitation:', share)
  })
  updateSubitemsShareWith(item.value, item.value.shareWith)
  saveItem()
  closeShareDialog()
}

const openAssignDialog = () => {
  if (!canAssign.value) {
    console.log('Cannot open assign dialog: Insufficient permissions')
    return
  }
  showAssignDialog.value = true
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
  newAssignees.value = []
  selectedItem.value = { label: `${item.value.type}: ${item.value.title}`, value: item.value }
  assignFormSubmitted.value = false
  console.log('Opened assign dialog')
}

const closeAssignDialog = () => {
  showAssignDialog.value = false
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
  newAssignees.value = []
  selectedItem.value = null
  assignFormSubmitted.value = false
  console.log('Closed assign dialog')
}

const searchAssignUsers = () => {
  if (!Array.isArray(item.value?.shareWith)) {
    filteredAssignUsers.value = []
    console.log('Search assign users failed: No shareWith data')
    return
  }
  if (!searchAssignUsername.value) {
    filteredAssignUsers.value = item.value.shareWith
      .filter(
        (share) =>
          share.username !== currentUser.value &&
          (!share.status || share.status !== 'pending') &&
          (share.role === 'admin' || share.role === 'owner'),
      )
      .map((share) => ({ username: share.username, role: share.role }))
    console.log('Searched assign users (empty query):', filteredAssignUsers.value)
    return
  }
  filteredAssignUsers.value = item.value.shareWith
    .filter(
      (share) =>
        share.username !== currentUser.value &&
        (!share.status || share.status !== 'pending') &&
        (share.role === 'admin' || share.role === 'owner') &&
        share.username.toLowerCase().includes(searchAssignUsername.value.toLowerCase()),
    )
    .map((share) => ({ username: share.username, role: share.role }))
  console.log('Searched assign users:', filteredAssignUsers.value)
}

const selectAssignee = (user) => {
  if (!canAssign.value) {
    console.log('Cannot select assignee: Insufficient permissions')
    return
  }
  if (!newAssignees.value.some((a) => a.username === user.username)) {
    newAssignees.value.push({
      username: user.username,
      role: user.role,
      note: '',
      assignedAt: new Date().toLocaleString('en-US'),
    })
    console.log('Selected assignee:', user)
  }
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
}

const addAssignee = () => {
  if (!canAssign.value || !searchAssignUsername.value || !isValidAssignUsername.value) {
    console.log('Cannot add assignee: Invalid input or permissions')
    return
  }
  if (newAssignees.value.some((a) => a.username === searchAssignUsername.value)) {
    errorMessage.value = 'This user is already selected for assignment.'
    console.error('Add assignee failed: User already selected')
    return
  }
  const user = item.value.shareWith.find(
    (share) =>
      share.username.toLowerCase() === searchAssignUsername.value.toLowerCase() &&
      (share.role === 'admin' || share.role === 'owner') &&
      !share.status,
  )
  if (user) {
    newAssignees.value.push({
      username: user.username,
      role: user.role,
      note: '',
      assignedAt: new Date().toLocaleString('en-US'),
    })
    console.log('Added assignee:', user)
    searchAssignUsername.value = ''
    filteredAssignUsers.value = []
  } else {
    errorMessage.value = 'Invalid or ineligible user.'
    console.error('Add assignee failed: Invalid user')
  }
}

const saveAssignment = () => {
  if (!canAssign.value) {
    errorMessage.value = 'You do not have permission to assign users'
    console.log('Cannot save assignment: Insufficient permissions')
    return
  }
  assignFormSubmitted.value = true
  if (!selectedItem.value) {
    errorMessage.value = 'Please select an item to assign'
    console.error('Assignment failed: No item selected')
    return
  }
  if (!newAssignees.value.length) {
    errorMessage.value = 'Please select at least one user to assign'
    console.error('Assignment failed: No users selected')
    return
  }
  if (!selectedItem.value.value.assignedTo) {
    selectedItem.value.value.assignedTo = []
  }
  newAssignees.value.forEach((assignee) => {
    if (!selectedItem.value.value.assignedTo.some((a) => a.username === assignee.username)) {
      selectedItem.value.value.assignedTo.push({
        username: assignee.username,
        role: assignee.role,
        note: assignee.note || 'No note',
        assignedAt: assignee.assignedAt,
      })
    }
  })
  updateSubitemsAssignedTo(selectedItem.value.value, newAssignees.value)
  saveItem()
  closeAssignDialog()
  errorMessage.value = ''
  console.log('Saved assignment:', newAssignees.value)
}

const removeAssignment = (index) => {
  if (!canAssign.value || !item.value) {
    console.log('Cannot remove assignment: Insufficient permissions or no item')
    return
  }
  const removedUsername = item.value.assignedTo[index].username
  item.value.assignedTo.splice(index, 1)
  removeAssignmentFromSubitems(item.value, removedUsername)
  console.log('Removed assignment for user:', removedUsername)
  saveItem()
}

const openAssigneeDialog = (assignee, index) => {
  selectedAssignee.value = { ...assignee }
  selectedAssigneeIndex.value = index
  showAssigneeDialog.value = true
  console.log('Opened assignee dialog for:', assignee)
}

const closeAssigneeDialog = () => {
  showAssigneeDialog.value = false
  selectedAssignee.value = null
  selectedAssigneeIndex.value = null
  console.log('Closed assignee dialog')
}

const saveAssigneeDetails = () => {
  if (!canEditAssignee.value || !selectedAssignee.value || selectedAssigneeIndex.value === null) {
    console.log('Cannot save assignee details: Invalid selection or permissions')
    return
  }
  if (!item.value.assignedTo || item.value.assignedTo.length <= selectedAssigneeIndex.value) {
    errorMessage.value = 'Invalid assignee selection.'
    console.error('Assignee save failed: Invalid selection')
    return
  }
  item.value.assignedTo[selectedAssigneeIndex.value] = { ...selectedAssignee.value }
  updateSubitemsAssignedTo(item.value, item.value.assignedTo)
  console.log('Saved assignee details:', selectedAssignee.value)
  saveItem()
  closeAssigneeDialog()
  errorMessage.value = ''
}

const openProfile = () => {
  console.log('Navigating to profile')
  router.push('/profile')
}

const logout = () => {
  console.log('Logging out user:', currentUser.value)
  localStorage.removeItem('authToken')
  localStorage.removeItem('userProfile')
  router.push('/login')
}

const sortedSubitems = (status) => {
  if (!item.value?.subitems) return []
  const statusMap = {
    Backlog: 'backlog',
    'In Progress': 'in progress',
    Done: 'done',
  }
  const normalizedStatus = statusMap[status] || status.toLowerCase()
  const filtered = item.value.subitems.filter(
    (sub) => sub.status?.toLowerCase() === normalizedStatus,
  )
  if (status === 'done') {
    return filtered.sort((a, b) => (a.movedToDoneAt || 0) - (b.movedToDoneAt || 0))
  }
  if (sortByPriority.value) {
    return filtered.sort((a, b) => {
      const priorityMap = { High: 3, Medium: 2, Low: 1, '': 0 }
      return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0)
    })
  }
  return filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
}

const priorityClass = (priority) => {
  if (priority === 'High') return 'priority-high'
  if (priority === 'Medium') return 'priority-medium'
  return 'priority-low'
}

const sortSubitems = () => {
  if (!canEdit.value) {
    console.log('Cannot sort subitems: Insufficient permissions')
    return
  }
  item.value.subitems = [
    ...sortedSubitems('backlog'),
    ...sortedSubitems('in progress'),
    ...sortedSubitems('done'),
  ]
  console.log('Sorted subitems')
  saveItem()
}
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

/* Homepage-like UI styling */
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
.board-surface {
  border-radius: 16px;
  background: transparent;
}
.fixed-page {
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}
.column-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.item-card {
  position: relative;
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  background: #ffffff;
  cursor: pointer;
}
.item-card:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}
.right-btn {
  border-radius: 12px;
  height: 10px;
}
.fancy-toggle {
  margin-bottom: 8px;
  display: inline-block;
  background: rgba(255, 255, 255, 0.85);
  padding: 4px 8px;
  /* padding-left: 20px; */
  border-radius: 9999px;
  width: fit-content;
}
.priority-low {
  background: #d3d6d3;
}
.priority-medium {
  background: #cbe9d7;
  color: #226631;
}
.priority-high {
  background: #ebc7a9;
  color: #7a2d00;
}

/* Homepage matching styles */
.item-card {
  position: relative;
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
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
.board-surface {
  border-radius: 16px;
}
.board-row {
  height: calc(100vh - 120px);
}
.column-scroll {
  max-height: calc(86vh - 220px);
  overflow-y: auto;
  /* padding-bottom: 60px; */
  /* padding-bottom: 24px; */
  min-height: 0;
  flex: 1;
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
.fancy-toggle {
  margin-bottom: -10px;
  display: inline-block;
  background: rgba(255, 255, 255, 0.85);
  padding: 5px 10px;
  padding-bottom: 7px;
  margin-right: 300px;
  border-radius: 9999px;
  width: fit-content;
}
.top-right-info {
  max-width: 60%;
}
.top-title {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-navbar {
  position: fixed;
  top: 12px;
  left: 12px;
  /* right: 1350px; */
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 80px;
  background-color: #ffffff;
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: 10;
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
.exp-section {
  position: relative;
}
.section-add-btn {
  position: absolute;
  top: -5px;
  right: 4px;
}
.top-search {
  position: fixed;
  top: 33px;
  left: 480px;
  /* right: 0px; leaves room for right icons */
  display: flex;
  align-items: center;
  z-index: 10;
}
.big-search-input {
  width: 500px;
  max-width: 1000px;
  height: 48px;
}
.top-actions {
  position: fixed;
  top: 12px;
  right: 12px;
  height: 70px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 11;
}

.fixed-right-panel {
  position: fixed;
  z-index: 10;
}

/* Dialog Styling */
.dialog-card {
  width: 520px;
  max-width: 92vw;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.dialog-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-header .text-h6 {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

.dialog-content {
  padding: 24px;
  background: #ffffff;
}

.dialog-actions {
  background: #f8f9fa;
  border-radius: 0 0 16px 16px;
  padding: 16px 24px;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-actions .q-btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 8px 16px;
}
.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
}
.equal-height-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
}
.row.board-row {
  max-height: calc(93vh - 180px);
  align-items: flex-start;
  flex: 1;
}
.column-box {
  height: calc(93vh - 180px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.resizable-note {
  width: 100%;
  min-height: 100px;
  max-height: 300px;
  resize: vertical;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 8px;
}
.custom-textarea {
  width: 100%;
  min-height: 100px;
  max-height: 300px;
  resize: vertical;
  border: 1px solid #ccc;
  padding: 8px;
  font-family: inherit;
  border-radius: 16px;
}

.note-card {
  background: transparent;
  border: 0;
  box-shadow: none;
  display: inline-block;
  width: auto;
  max-width: 50%;
}

.note-card .q-card-section {
  padding: 8px 0;
  line-height: 1.6;
  color: #333;
  background: transparent;
}

.note-inline {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  width: auto;
  max-width: 100%;
}

.note-text {
  display: inline-block;
  width: auto;
  max-width: 100%;
  word-break: break-word;
}
.reports-box {
  max-height: 200px;
  overflow-y: auto;
}
.meetings-box {
  max-height: 200px;
  overflow-y: auto;
}
.assignments-box {
  max-height: 200px;
  overflow-y: auto;
}
.comments-box {
  max-height: 200px;
  overflow-y: auto;
}
.comment-history {
  max-height: 200px;
  overflow-y: auto;
}
.meeting-history {
  max-height: 200px;
  overflow-y: auto;
}
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.single-line {
  display: inline-block;
  max-width: 80%;
}
.subitem-form {
  padding: 10px;
  border-radius: 16px;
}
.user-list {
  max-height: 200px;
  overflow-y: auto;
}
.user-item:hover {
  background-color: #f0f0f0;
}
.report-history {
  max-height: 200px;
  overflow-y: auto;
}
.edited-label {
  font-size: 0.8em;
  color: #666;
  margin-left: 8px;
  font-style: italic;
}
.description-history {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 8px;
  margin-top: 8px;
  background-color: #f9f9f9;
}
</style>
