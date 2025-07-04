<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-lg shadow-2 constrained-card">
      <!-- Fixed Profile Section -->
      <q-card-section class="fixed-section">
        <!-- API error banner -->
        <q-banner
          v-if="apiError"
          dense
          class="bg-negative text-white q-mb-md"
          aria-live="polite"
          role="alert"
        >
          {{ apiError }}
        </q-banner>

        <!-- Success banner -->
        <q-banner
          v-if="successMessage"
          dense
          class="bg-positive text-white q-mb-md"
          aria-live="polite"
          role="alert"
        >
          {{ successMessage }}
        </q-banner>

        <!-- Profile Picture -->
        <div class="flex flex-center q-mb-md">
          <q-avatar size="80px" aria-label="Profile picture">
            <template v-if="profile.picture">
              <img :src="profile.picture" alt="User profile picture" />
            </template>
            <template v-else>
              <q-icon name="account_box" size="80px" color="primary" />
            </template>
          </q-avatar>
        </div>

        <!-- Picture Buttons (edit mode) -->
        <div v-if="editMode" class="flex flex-center q-mb-md q-gutter-sm">
          <q-btn
            dense
            flat
            icon="photo_camera"
            label="Change Picture"
            @click="triggerFileInput"
            aria-label="Change profile picture"
          />
          <q-btn
            dense
            flat
            icon="delete"
            label="Remove Picture"
            @click="removePicture"
            color="negative"
            aria-label="Remove profile picture"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
            aria-label="Upload profile picture"
          />
        </div>
      </q-card-section>

      <!-- Scrollable Input Section -->
      <q-card-section class="scrollable-section">
        <q-form @submit.prevent="saveProfile">
          <!-- Username input -->
          <q-input
            filled
            v-model="profile.username"
            label="Username"
            dense
            class="uniform-input"
            :readonly="!editMode"
            :error="usernameError"
            error-message="Username is required"
            @input="clearUsernameError"
            autofocus
            aria-label="Enter your username"
            no-error-icon
          />

          <!-- First Name input -->
          <q-input
            filled
            v-model="profile.firstName"
            label="First Name"
            dense
            class="uniform-input"
            :readonly="!editMode"
            :error="false"
            aria-label="Enter your first name"
            no-error-icon
          />

          <!-- Last Name input -->
          <q-input
            filled
            v-model="profile.lastName"
            label="Last Name"
            dense
            class="uniform-input"
            :readonly="!editMode"
            :error="false"
            aria-label="Enter your last name"
            no-error-icon
          />

          <!-- Date of Birth input -->
          <q-input
            filled
            v-model="profile.dob"
            label="Date of Birth"
            dense
            class="uniform-input"
            mask="####-##-##"
            :readonly="!editMode"
            :error="!!dobError"
            :error-message="dobError"
            @input="validateDob"
            aria-label="Enter your date of birth"
            no-error-icon
          >
            <template v-slot:append>
              <q-icon
                name="event"
                class="cursor-pointer"
                v-if="editMode"
                @click="showDatePicker = true"
                aria-label="Open date picker"
              />
            </template>
            <template v-slot:bottom v-if="editMode">
              <div class="text-caption">Format: YYYY-MM-DD</div>
            </template>
            <q-popup-proxy
              v-if="editMode"
              v-model="showDatePicker"
              transition-show="scale"
              transition-hide="scale"
              anchor="bottom middle"
              self="top middle"
            >
              <q-date
                v-model="profile.dob"
                mask="YYYY-MM-DD"
                @update:model-value="validateDob"
              />
            </q-popup-proxy>
          </q-input>

          <!-- Email input -->
          <q-input
            filled
            v-model="profile.email"
            label="Email"
            type="email"
            dense
            class="uniform-input"
            :readonly="!editMode"
            :error="emailError"
            :error-message="emailErrorMessage"
            @input="clearEmailError"
            aria-label="Enter your email"
            no-error-icon
          />

          <!-- Job input -->
          <q-input
            filled
            v-model="profile.job"
            label="Job"
            dense
            class="uniform-input"
            :readonly="!editMode"
            :error="false"
            aria-label="Enter your job title"
            no-error-icon
          />

          <!-- Bio input -->
          <q-input
            filled
            v-model="profile.bio"
            label="Bio"
            type="textarea"
            dense
            class="uniform-input"
            autogrow
            :readonly="!editMode"
            :error="false"
            aria-label="Enter your bio"
            no-error-icon
          />

          <!-- Buttons -->
          <q-btn
            v-if="!editMode"
            label="Edit Profile"
            color="primary"
            class="full-width q-mt-md"
            @click="editMode = true"
            aria-label="Edit profile"
          />
          <div v-else class="row q-col-gutter-sm q-mt-md">
            <q-btn
              label="Save"
              color="primary"
              class="col"
              :loading="isLoading"
              type="submit"
              aria-label="Save profile changes"
            />
            <q-btn
              label="Cancel"
              flat
              color="primary"
              class="col"
              @click="cancelEdit"
              aria-label="Cancel profile changes"
            />
          </div>
        </q-form>

        <q-separator class="q-my-md" />

        <router-link
          to="/home"
          class="text-primary text-caption full-width text-center"
          style="text-decoration: none; display: block;"
          tabindex="0"
          @click="goToHome"
          aria-label="Navigate back to home page"
        >
          Back to Home
        </router-link>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// Profile data
const profile = ref({
  username: '',
  firstName: '',
  lastName: '',
  dob: '',
  email: '',
  job: '',
  bio: '',
  picture: ''
})

const editMode = ref(false)
const isLoading = ref(false)
const apiError = ref('')
const successMessage = ref('')
const backupProfile = ref(null)
const showDatePicker = ref(false)
const dobError = ref('')
const usernameError = ref(false)
const emailError = ref(false)
const usernameTouched = ref(false)
const emailTouched = ref(false)

// Email format validator
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(profile.value.email)
})

const emailErrorMessage = computed(() => {
  if (emailTouched.value && profile.value.email === '') return 'Email is required'
  if (emailTouched.value && !isEmailValid.value) return 'Invalid email format'
  return ''
})

// Validate DOB
const validateDob = () => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!profile.value.dob) {
    dobError.value = ''
    return
  }
  if (!regex.test(profile.value.dob)) {
    dobError.value = 'Please enter the date in format YYYY-MM-DD'
    return
  }
  const date = new Date(profile.value.dob)
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
  if (isNaN(date.getTime())) {
    dobError.value = 'Invalid date'
  } else if (date > today) {
    dobError.value = 'Date of birth cannot be in the future'
  } else if (date > minDate) {
    dobError.value = 'You must be at least 13 years old'
  } else {
    dobError.value = ''
  }
}

// Save profile
const saveProfile = () => {
  usernameTouched.value = true
  emailTouched.value = true
  apiError.value = ''
  successMessage.value = ''
  isLoading.value = true

  // Validate fields
  validateDob()
  usernameError.value = !profile.value.username
  emailError.value = !profile.value.email || !isEmailValid.value

  if (usernameError.value || emailError.value || dobError.value) {
    isLoading.value = false
    return
  }

  // Simulate backend API call
  setTimeout(() => {
    const random = Math.random()
    if (random < 0.1) {
      apiError.value = 'Username already taken'
    } else if (random < 0.2) {
      apiError.value = 'Email already in use'
    } else {
      backupProfile.value = null
      editMode.value = false
      successMessage.value = 'Profile saved successfully'
      console.log('Profile saved:', profile.value)
      setTimeout(() => {
        successMessage.value = ''
      }, 3000) // Clear success message after 3 seconds
    }
    isLoading.value = false
  }, 1000) // Simulate API delay
}

// Cancel edit
const cancelEdit = () => {
  if (backupProfile.value) {
    profile.value = { ...backupProfile.value }
  }
  usernameError.value = false
  emailError.value = false
  dobError.value = ''
  usernameTouched.value = false
  emailTouched.value = false
  editMode.value = false
  apiError.value = ''
  successMessage.value = ''
}

// Backup profile when entering edit mode
watch(editMode, (newVal) => {
  if (newVal) {
    backupProfile.value = { ...profile.value }
  }
})

// Picture upload logic
const fileInput = ref(null)

const triggerFileInput = () => {
  if (editMode.value) {
    fileInput.value.click()
  }
}

const onFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      apiError.value = 'Please upload an image file'
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      apiError.value = 'Image size must be less than 5MB'
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      profile.value.picture = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removePicture = () => {
  if (editMode.value) {
    profile.value.picture = ''
  }
}

// Clear error states
const clearUsernameError = () => {
  if (profile.value.username) usernameError.value = false
}

const clearEmailError = () => {
  if (profile.value.email && isEmailValid.value) emailError.value = false
}

// Check authentication
onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    console.log('User not authenticated, redirecting to login')
    window.location.href = 'http://localhost:9000/#/login'
  }
})

// Navigate to home
const goToHome = () => {
  window.location.href = 'http://localhost:9000/#/home'
}
</script>

<style scoped>
.hidden {
  display: none;
}
.constrained-card {
  width: 400px;
  max-width: 90vw;
  max-height: calc(100vh - 32px); /* Account for q-pa-md */
  display: flex;
  flex-direction: column;
}
.fixed-section {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white; /* Match q-card background */
  padding-bottom: 0; /* Reduce spacing */
}
.scrollable-section {
  overflow-y: auto;
  max-height: calc(100vh - 180px); /* Adjust for fixed section (80px avatar) and padding */
  padding-right: 8px; /* Prevent scrollbar overlap */
}
.uniform-input {
  margin-bottom: 0px !important; /* Consistent spacing */
}
.uniform-input .q-field__control {
  padding-bottom: 0 !important; /* Normalize textarea */
  height: 40px !important; /* Match dense input height */
}
.uniform-input .q-field__bottom {
  padding-top: 4px !important; /* Consistent hint/error spacing */
  min-height: 0 !important;
  height: auto !important;
}
.uniform-input.q-field--readonly .q-field__control {
  padding-bottom: 0 !important; /* Normalize readonly inputs */
  background: var(--q-filled-bg) !important; /* Match filled style */
  opacity: 1 !important; /* Prevent fading */
  cursor: default !important; /* Standard cursor on hover */
}
/* Hide bottom slot when no error or hint */
.uniform-input:not(.q-field--error) .q-field__bottom {
  display: none !important; /* Remove reserved space in view mode */
}
.uniform-input.q-field--error .q-field__bottom {
  padding-top: 4px !important; /* Ensure error message spacing */
}
</style>
