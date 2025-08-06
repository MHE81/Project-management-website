<template>
  <q-page class="q-pa-md bg-primary" style="min-height: 100vh; overflow-y: auto">
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
    <div v-else-if="errorMessage" class="text-h4 q-mb-md text-center full-width text-negative">
      {{ errorMessage }} (ID: {{ route.params.id }})
    </div>

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
        <q-btn
          label="Save Report"
          color="positive"
          @click="saveReport"
          class="q-mr-sm"
          :disable="!canEdit"
        />
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
        <q-btn
          label="Save Report"
          color="positive"
          @click="saveEditedReport"
          class="q-mr-sm"
          :disable="!canEdit"
        />
        <q-btn label="Cancel" color="negative" flat @click="cancelEditReport" />
      </div>
    </div>

    <!-- Note Display -->
    <div v-if="item && item.note && !isEditingNote" class="q-mb-md">
      <div class="text-subtitle1">Note:</div>
      <div
        class="q-pa-sm bg-grey-2 rounded-borders resizable-note"
        v-html="item.note.replace(/\n/g, '<br>')"
      ></div>
      <div class="row q-mt-sm">
        <q-btn
          label="Edit Note"
          color="primary"
          @click="toggleNoteEdit(true)"
          class="q-mr-sm"
          :disable="!canEdit"
        />
        <q-btn label="Delete Note" color="negative" flat @click="deleteNote" :disable="!canEdit" />
      </div>
    </div>

    <!-- Note Edit Form -->
    <div v-if="item && isEditingNote" class="q-mb-md">
      <div class="text-subtitle1">Edit Note:</div>
      <textarea
        v-model="item.note"
        placeholder="Enter your note here..."
        class="resizable-note custom-textarea"
        :disabled="!canEdit"
      />
      <div class="row q-mt-sm">
        <q-btn
          label="Save Note"
          color="positive"
          @click="saveNote"
          class="q-mr-sm"
          :disable="!canEdit"
        />
        <q-btn label="Cancel" color="negative" flat @click="cancelNoteEdit" />
      </div>
    </div>
    <q-btn
      v-if="item && !item.note && !isEditingNote"
      label="Add Note"
      color="secondary"
      @click="toggleNoteEdit(true)"
      class="q-mb-md"
      :disable="!canEdit"
    />

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
      <div class="col-2 bg-grey-2 rounded-borders q-pa-md column-box" style="margin-right: 10px">
        <div class="bg-white" style="padding: 15px">
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
            :disable="!isEditing || !canEdit"
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
            class="q-mt-md"
          />
          <q-btn
            v-if="!isEditing"
            label="Edit"
            color="primary"
            class="full-width q-mt-md"
            @click="toggleEdit(true)"
            :disable="!canEdit"
          />
          <q-btn
            v-else
            label="Save"
            color="positive"
            class="full-width q-mt-md"
            @click="saveDetails"
            :disable="!canEdit"
          />
        </div>
      </div>

      <!-- Main Content Area (Subitems Kanban) -->
      <div class="col-7 bg-grey-2 rounded-borders q-pa-md column-box" style="overflow-y: auto">
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
        <div class="row" style="flex-wrap: nowrap; height: 100%">
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
                <strong>{{ subitem.type }}</strong
                >: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
                <div v-if="subitem.assignedTo && subitem.assignedTo.length" class="text-caption">
                  Assigned:
                  {{
                    subitem.assignedTo
                      .map((a) => `${a.username} (${a.role}): ${truncateText(a.note || 'No note')}`)
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
              </div>
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="deleteItem(subitem.id)"
                :disable="!canAddSubitems"
              />
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
                <strong>{{ subitem.type }}</strong
                >: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
                <div v-if="subitem.assignedTo && subitem.assignedTo.length" class="text-caption">
                  Assigned:
                  {{
                    subitem.assignedTo
                      .map((a) => `${a.username} (${a.role}): ${truncateText(a.note || 'No note')}`)
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
              </div>
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="deleteItem(subitem.id)"
                :disable="!canAddSubitems"
              />
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
                <strong>{{ subitem.type }}</strong
                >: {{ subitem.title }} (Due: {{ subitem.deadline || 'N/A' }})
                <div v-if="subitem.assignedTo && subitem.assignedTo.length" class="text-caption">
                  Assigned:
                  {{
                    subitem.assignedTo
                      .map((a) => `${a.username} (${a.role}): ${truncateText(a.note || 'No note')}`)
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
              </div>
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="deleteItem(subitem.id)"
                :disable="!canAddSubitems"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Box -->
      <div
        class="col-2 bg-grey-2 rounded-borders q-pa-md column-box"
        style="margin-left: 10px; width: 350px; max-height: calc(100vh - 200px); overflow-y: auto"
      >
        <!-- Shared With Section -->
        <div v-if="item" class="q-mb-md">
          <div class="text-subtitle1">Shared With:</div>
          <div class="q-pa-sm bg-grey-2 rounded-borders">
            <div
              v-if="item.shareWith && item.shareWith.length"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs"
            >
              <div
                v-for="(share, index) in item.shareWith"
                :key="index"
                class="row items-center q-mb-xs"
              >
                {{ share.username }}
                <span class="text-weight-bold"
                  >({{ share.role }}{{ share.status === 'pending' ? ', Pending' : '' }})</span
                >
                <q-btn
                  v-if="canShare && share.role !== 'owner'"
                  flat
                  round
                  icon="remove"
                  color="negative"
                  size="sm"
                  @click="removeSharedUser(index)"
                />
              </div>
            </div>
            <div
              v-else
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative"
            >
              Not shared with anyone
            </div>
          </div>
          <q-btn
            v-if="canShare"
            label="Share With"
            color="secondary"
            class="full-width"
            @click="openShareDialog"
          />
        </div>

        <!-- Assignment Section -->
        <div v-if="item" class="q-mb-md">
          <div class="text-subtitle1">Assigned To:</div>
          <div class="q-pa-sm bg-grey-2 rounded-borders assignments-box">
            <div
              v-if="item.assignedTo && item.assignedTo.length"
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs"
            >
              <div
                v-for="(assignee, index) in sortedAssignees"
                :key="index"
                class="row items-center q-mb-xs text-ellipsis single-line"
              >
                <div class="text-ellipsis single-line">
                  {{ assignee.assignedAt }} - {{ truncateText(assignee.note || 'No note') }}
                </div>
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
            <div
              v-else
              class="q-py-xs q-px-sm bg-white rounded-borders q-mb-xs text-center text-negative"
            >
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
              <div class="text-ellipsis single-line">
                {{ report.date }} - {{ truncateText(report.details) }}
              </div>
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="deleteReportFromBox(report, index)"
                :disable="!canEdit"
              />
            </div>
          </div>
        </div>
        <div
          v-else-if="item && item.reports && !item.reports.length"
          class="q-mb-md text-center text-negative"
        >
          No reports available.
        </div>

        <!-- Subitem Form and Buttons -->
        <div class="bg-white" style="padding: 15px">
          <div v-if="!toggleSubitemForm" class="q-my-md flex flex-center">
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
          <div v-if="!toggleSubitemForm">
            <q-btn
              label="New Subitem"
              color="secondary"
              class="full-width q-mb-xs"
              @click="openSubitemForm"
              :disable="!canAddSubitems"
            />
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
                :disable="!canAddSubitems"
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
                  class="full-width q-mr-sm"
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
      <q-card style="width: 600px; max-width: 90vw">
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
                :disable="!canShare"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-select
                v-model="selectedRole"
                :options="['owner', 'admin', 'observer']"
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
              color="positive"
              type="submit"
              class="full-width q-mb-md"
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
                flat
                round
                icon="remove"
                color="negative"
                size="sm"
                @click="
                  newSharedUsers.splice(index, 1),
                  searchUsers()
                "
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
                v-if="canShare && share.role !== 'owner'"
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
          <q-btn label="Save" color="positive" @click="saveSharedUsers" :disable="!canShare" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Assign Dialog -->
    <q-dialog v-model="showAssignDialog" persistent>
      <q-card style="width: 600px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Assign Item</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="addAssignee">
            <q-select
              v-model="selectedItem"
              :options="itemOptions"
              label="Select Item"
              option-label="label"
              option-value="value"
              dense
              :error="!selectedItem && assignFormSubmitted"
              error-message="Item is required"
              class="q-mb-md"
              :disable="!canAssign"
            />
            <q-input
              v-model="searchAssignUsername"
              label="Search Username"
              dense
              @input="searchAssignUsers"
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
            <div v-else-if="searchAssignUsername" class="q-mt-md text-negative">
              No eligible users found
            </div>
            <div v-if="newAssignees.length" class="q-mt-md">
              <div class="text-subtitle2">Selected Users:</div>
              <div v-for="(assignee, index) in newAssignees" :key="index" class="row items-center q-mb-xs">
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
              color="positive"
              type="submit"
              class="full-width q-mt-md"
              :disable="!canAssign || !searchAssignUsername || !isValidAssignUsername"
            />
          </q-form>
          <div v-if="selectedItem?.assignedTo?.length" class="q-mt-md">
            <div class="text-subtitle2">Currently Assigned To:</div>
            <div
              v-for="(assignee, index) in selectedItem.assignedTo"
              :key="index"
              class="row items-center q-mb-xs"
            >
              <q-item-section
                >{{ assignee.username }}
                <span class="text-weight-bold">({{ assignee.role }}): {{ assignee.note || 'No note' }}</span></q-item-section
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
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup @click="closeAssignDialog" />
          <q-btn label="Save" color="positive" @click="saveAssignment" :disable="!canAssign || !selectedItem" />
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
  priority: '',
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
const currentUser = ref(JSON.parse(localStorage.getItem('userProfile') || '{}')?.username || '')
const parentChain = ref([])
const selectedItem = ref(null)
const newAssignees = ref([])
const assignFormSubmitted = ref(false)
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
  const options = [
    { label: `${item.value.type}: ${item.value.title}`, value: item.value }
  ]
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

// Compute current user's role
const currentUserRole = computed(() => {
  if (!item.value) return 'N/A'
  if (item.value.creator === currentUser.value) return 'owner'
  const userShare = item.value.shareWith?.find((share) => share.username === currentUser.value)
  return userShare ? userShare.role : 'observer'
})

const isValidUsername = computed(() => {
  if (!searchUsername.value || !Array.isArray(availableUsers.value)) return false
  return availableUsers.value.some(
    (user) => user.username && user.username.toLowerCase() === searchUsername.value.toLowerCase(),
  )
})

const canEdit = computed(() => {
  if (!item.value) return false
  return (
    item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && (share.role === 'admin' || share.role === 'owner')
    )
  )
})

const canAssign = computed(() => {
  if (!item.value) return false
  return item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && share.role === 'owner'
    )
})

const canShare = computed(() => {
  if (!item.value) return false
  return item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && share.role === 'owner'
    )
})

const canAddSubitems = computed(() => {
  if (!item.value) return false
  return item.value.creator === currentUser.value ||
    item.value.shareWith?.some(
      (share) => share.username === currentUser.value && share.role === 'owner'
    )
})

const sortedReports = computed(() => {
  return item.value?.reports
    ? [...item.value.reports].sort((a, b) => new Date(b.date) - new Date(a.date))
    : []
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
      // Preserve existing assignments and only add new ones
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
  loadItems()
  const users = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  availableUsers.value = Array.isArray(users) ? users : []
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
  if (!item.value.assignedTo) item.value.assignedTo = []
  if (item.value.parentId) {
    directParent.value = findItemById(items, item.value.parentId)
  } else {
    directParent.value = null
  }
  parentChain.value = buildParentChain(items, itemId.value)
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
}

watch(
  () => route.params.id,
  () => {
    loadItems()
  },
)

const openSubitemForm = () => {
  if (!canAddSubitems.value) return
  toggleSubitemForm.value = true
  errorMessage.value = ''
}

const startDrag = (item) => {
  if (canEdit.value) {
    draggedItem.value = item
  }
}

const handleDrop = (newStatus) => {
  if (!canEdit.value || !draggedItem.value) return
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
  saveItem()
  errorMessage.value = ''
  draggedItem.value = null
}

const deleteItem = (id) => {
  if (!canAddSubitems.value) return
  const items = JSON.parse(localStorage.getItem(`kanbanItems_${currentUser.value}`) || '[]')
  const targetItem = findItemById(items, id)
  if (!targetItem) return

  // Remove item from all shared users
  const shareUsernames = targetItem.shareWith
    .filter(share => share.username !== currentUser.value)
    .map(share => share.username)
  shareUsernames.forEach(username => {
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
      // If it's a parent item, remove it entirely from user's storage
      const newUserItems = userItems.filter(i => i.id !== id)
      localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(newUserItems))
    } else {
      // If it's a subitem, remove it from the parent's subitems
      for (let i = 0; i < userItems.length; i++) {
        if (deleteRecursive(userItems[i].subitems || [], id)) {
          localStorage.setItem(`kanbanItems_${username}`, JSON.stringify(userItems))
          break
        }
      }
    }

    // Remove pending invitations for the deleted item
    const invitations = JSON.parse(localStorage.getItem(`kanbanInvitations_${username}`) || '[]')
    const newInvitations = invitations.filter(inv => inv.itemId !== id)
    localStorage.setItem(`kanbanInvitations_${username}`, JSON.stringify(newInvitations))
  })

  // Remove item from current user's items
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
    router.push(`/itemDetail/${id}`)
  }
}

const addSubitem = () => {
  if (!canAddSubitems.value) return
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
    Done: 'done',
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
      shareWith: item.value.shareWith.map((s) => ({ ...s })), // Deep copy to avoid reference issues
      movedToDoneAt: subitemForm.value.status === 'Done' ? Date.now() : null,
      note: '',
      creator: currentUser.value,
      assignedTo: [],
      reports: [],
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
  if (!canEdit.value) return
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
    Done: 'done',
  }
  const newStatus = statusMap[item.value.status] || item.value.status.toLowerCase()
  if (newStatus === 'done') {
    const allSubitemsDone =
      !item.value.subitems || item.value.subitems.every((sub) => sub.status === 'done')
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
  if (!canEdit.value) return
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

const resetSubitemForm = () => {
  subitemForm.value = {
    type: '',
    title: '',
    deadline: '',
    status: '',
    priority: '',
  }
  subitemFormSubmitted.value = false
}

const toggleNoteEdit = (value) => {
  if (!canEdit.value) return
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
  if (!canEdit.value) return
  if (item.value.note && item.value.note.trim()) {
    saveItem()
    isEditingNote.value = false
    errorMessage.value = ''
  } else {
    errorMessage.value = 'Note cannot be empty.'
  }
}

const deleteNote = () => {
  if (!canEdit.value) return
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
    details: newReportDetails.value,
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
  if (
    !selectedReport.value ||
    !selectedReport.value.details ||
    !selectedReport.value.details.trim()
  ) {
    errorMessage.value = 'Report details cannot be empty.'
    return
  }
  if (
    selectedReportIndex.value !== null &&
    item.value.reports &&
    item.value.reports.length > selectedReportIndex.value
  ) {
    item.value.reports[selectedReportIndex.value] = {
      ...selectedReport.value,
      date: item.value.reports[selectedReportIndex.value].date,
    }
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

const truncateText = (text) => {
  if (!text) return ''
  return text.length > 30 ? text.substring(0, 30) + '...' : text
}

const openShareDialog = () => {
  if (!canShare.value) return
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
  if (!Array.isArray(availableUsers.value)) {
    filteredUsers.value = []
    usernameError.value = true
    return
  }
  if (!searchUsername.value) {
    filteredUsers.value = []
    usernameError.value = false
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
}

const selectUser = (user) => {
  newSharedUsers.value.push({ username: user.username, role: selectedRole.value })
  searchUsername.value = ''
  filteredUsers.value = []
  usernameError.value = false
}

const addSharedUser = () => {
  if (!canShare.value || !searchUsername.value || usernameError.value || !isValidUsername.value)
    return
  const userExists =
    item.value.shareWith.some((share) => share.username === searchUsername.value) ||
    newSharedUsers.value.some((share) => share.username === searchUsername.value)
  if (userExists) {
    errorMessage.value = 'This user is already shared with this item.'
    return
  }
  newSharedUsers.value.push({ username: searchUsername.value, role: selectedRole.value })
  searchUsername.value = ''
  filteredUsers.value = []
  usernameError.value = false
}

const removeSharedUser = (index) => {
  if (!canShare.value) return
  if (index < item.value.shareWith.length && item.value.shareWith[index].role !== 'owner') {
    const removedUser = item.value.shareWith[index]
    const isPending = removedUser.status === 'pending'
    const removedUsername = removedUser.username
    item.value.shareWith.splice(index, 1)
    updateSubitemsShareWith(item.value, item.value.shareWith)
    saveItem()

    // Handle item and invitation removal based on whether it's a parent item
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
      // If it's a parent item, remove it entirely from user's storage
      const newUserItems = userItems.filter(i => i.id !== item.value.id)
      localStorage.setItem(`kanbanItems_${removedUsername}`, JSON.stringify(newUserItems))
      // Remove pending invocations for parent item
      const invitations = JSON.parse(localStorage.getItem(`kanbanInvitations_${removedUsername}`) || '[]')
      const newInvitations = invitations.filter(inv => inv.itemId !== item.value.id)
      localStorage.setItem(`kanbanInvitations_${removedUsername}`, JSON.stringify(newInvitations))
    } else if (!isPending) {
      // If it's a subitem and not pending, remove it from the parent's subitems
      for (let i = 0; i < userItems.length; i++) {
        if (deleteRecursive(userItems[i].subitems || [], item.value.id)) {
          localStorage.setItem(`kanbanItems_${removedUsername}`, JSON.stringify(userItems))
          break
        }
      }
    }
    // If it's a subitem and pending, leave the invitation intact
  } else if (index >= item.value.shareWith.length) {
    newSharedUsers.value.splice(index - item.value.shareWith.length, 1)
  }
  searchUsers()
}

const saveSharedUsers = () => {
  if (!canShare.value) return
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
  })
  updateSubitemsShareWith(item.value, item.value.shareWith)
  saveItem()
  closeShareDialog()
}

const openAssignDialog = () => {
  if (!canAssign.value) return
  showAssignDialog.value = true
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
  newAssignees.value = []
  selectedItem.value = { label: `${item.value.type}: ${item.value.title}`, value: item.value } // Default to main item
  assignFormSubmitted.value = false
}

const closeAssignDialog = () => {
  showAssignDialog.value = false
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
  newAssignees.value = []
  selectedItem.value = null
  assignFormSubmitted.value = false
}

const searchAssignUsers = () => {
  if (!Array.isArray(item.value?.shareWith)) {
    filteredAssignUsers.value = []
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
}

const selectAssignee = (user) => {
  if (!canAssign.value) return
  if (!newAssignees.value.some((a) => a.username === user.username)) {
    newAssignees.value.push({ username: user.username, role: user.role, note: '' })
  }
  searchAssignUsername.value = ''
  filteredAssignUsers.value = []
}

const addAssignee = () => {
  if (!canAssign.value || !searchAssignUsername.value || !isValidAssignUsername.value) return
  if (newAssignees.value.some((a) => a.username === searchAssignUsername.value)) {
    errorMessage.value = 'This user is already selected for assignment.'
    return
  }
  const user = item.value.shareWith.find(
    (share) =>
      share.username.toLowerCase() === searchAssignUsername.value.toLowerCase() &&
      (share.role === 'admin' || share.role === 'owner') &&
      !share.status,
  )
  if (user) {
    newAssignees.value.push({ username: user.username, role: user.role, note: '' })
    searchAssignUsername.value = ''
    filteredAssignUsers.value = []
  } else {
    errorMessage.value = 'Invalid or ineligible user.'
  }
}

const removeAssignment = (index) => {
  if (!canAssign.value || !item.value) return
  item.value.assignedTo.splice(index, 1)
  updateSubitemsAssignedTo(item.value, item.value.assignedTo)
  saveItem()
}

const saveAssignment = () => {
  if (!canAssign.value || !selectedItem.value) {
    errorMessage.value = 'Please select an item.'
    return
  }
  assignFormSubmitted.value = true
  if (!newAssignees.value.length) {
    errorMessage.value = 'Please select at least one user to assign.'
    return
  }
  // Ensure assignedTo array exists
  selectedItem.value.value.assignedTo = selectedItem.value.value.assignedTo || []
  // Add new assignees with date and avoid duplicates
  const currentDateTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' })
  newAssignees.value.forEach((assignee) => {
    if (!selectedItem.value.value.assignedTo.some((a) => a.username === assignee.username)) {
      selectedItem.value.value.assignedTo.unshift({ ...assignee, assignedAt: currentDateTime })
    }
  })
  // Update subitems recursively
  updateSubitemsAssignedTo(selectedItem.value.value, selectedItem.value.value.assignedTo)
  // Save changes to all relevant users
  saveItem()
  // Deep copy to force re-render
  item.value = JSON.parse(JSON.stringify(item.value))
  // Update the item in the storage of all shared users
  const shareUsernames = item.value.shareWith
    .filter(
      (share) => share.username !== currentUser.value && (!share.status || share.status !== 'pending'),
    )
    .map((share) => share.username)
  shareUsernames.forEach((username) => {
    updateItemInUserStorage(item.value, username)
  })
  closeAssignDialog()
  errorMessage.value = ''
}

const openProfile = () => {
  router.push('/profile')
}

const logout = () => {
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

const sortSubitems = () => {
  if (!canEdit.value) return
  item.value.subitems = [
    ...sortedSubitems('backlog'),
    ...sortedSubitems('in progress'),
    ...sortedSubitems('done'),
  ]
  saveItem()
}
</script>

<style scoped>
.divider-col {
  border-left: 1px solid #ccc;
  padding-left: 8px;
}
.equal-height-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
}
.column-box {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
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
}
.reports-box {
  max-height: 200px;
  overflow-y: auto;
}
.assignments-box {
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
  border-radius: 4px;
}
.user-list {
  max-height: 200px;
  overflow-y: auto;
}
.user-item:hover {
  background-color: #f0f0f0;
}
</style>
