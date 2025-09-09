<template>
  <q-page class="q-pa-md flex flex-center login-bg">
    <div class="login-navbar">
      <div class="brand">
        <img src="/logo.png" alt="PLANOVA logo" class="brand-logo" />
        <span class="brand-title">PLANOVA</span>
      </div>
    </div>
    <q-card class="q-pa-lg shadow-2 constrained-card">
      <q-card-section class="flex column items-center q-mb-sm">
        <!-- <img src="/logo.png" alt="PLANOVA logo" class="login-logo" /> -->
        <!-- <div class="text-h5 text-primary q-mt-xs">Profile</div> -->
      </q-card-section>
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
        <div class="flex flex-center q-mb">
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

        <!-- Change Password (dialog trigger) -->
        <div class="flex flex-center q-mb-sm">
          <q-btn
            outline
            color="primary"
            icon="lock"
            label="Change Password"
            class="right-btn"
            @click="showChangePassDialog = true"
          />
        </div>
      </q-card-section>

      <!-- Scrollable Input Section -->
      <q-card-section class="scrollable-section">
        <q-form @submit.prevent="saveProfile">
          <!-- Username input -->
          <q-input
            outlined
            rounded
            v-model="profile.username"
            label="Username"
            dense
            class="uniform-input"
            :readonly="!editMode"
            :error="usernameError"
            error-message="Username is required or already taken"
            @input="clearUsernameError"
            autofocus
            aria-label="Enter your username"
            no-error-icon
          />

          <!-- First Name input -->
          <q-input
            outlined
            rounded
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
            outlined
            rounded
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
            outlined
            rounded
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
              <q-date v-model="profile.dob" mask="YYYY-MM-DD" @update:model-value="validateDob" />
            </q-popup-proxy>
          </q-input>

          <!-- Email input -->
          <q-input
            outlined
            rounded
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
            outlined
            rounded
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
            outlined
            rounded
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

          <!-- Change Password moved to dialog -->

          <!-- Buttons -->
          <q-btn
            v-if="!editMode"
            label="Edit Profile"
            color="primary"
            class="full-width q-mt-md right-btn"
            @click="editMode = true"
            aria-label="Edit profile"
          />
          <div v-else class="row q-col-gutter-sm q-mt-md">
            <q-btn
              label="Save"
              color="primary"
              class="col right-btn"
              :loading="isLoading"
              type="submit"
              aria-label="Save profile changes"
            />
            <q-btn
              label="Cancel"
              flat
              color="primary"
              class="col right-btn"
              @click="cancelEdit"
              aria-label="Cancel profile changes"
            />
            <q-btn
              label="Delete Account"
              flat
              color="negative"
              class="col right-btn"
              @click="showDeleteDialog = true"
              aria-label="Delete your account"
            />
          </div>
        </q-form>

        <q-separator class="q-my-md" />

        <router-link
          to="/home"
          class="text-primary text-caption full-width text-center"
          style="text-decoration: none; display: block"
          tabindex="0"
          @click="goToHome"
          aria-label="Navigate back to home page"
        >
          Back to Home
        </router-link>
      </q-card-section>
    </q-card>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="negative" size="lg" class="q-mr-sm" />
          <span class="text-h6">Confirm Account Deletion</span>
        </q-card-section>
        <q-card-section>
          Are you sure you want to delete your account? This action will permanently remove all your
          data, including your profile and kanban items, and cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup aria-label="Cancel deletion" />
          <q-btn
            flat
            label="Confirm"
            color="negative"
            @click="deleteAccount"
            aria-label="Confirm account deletion"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Password Dialog -->
    <q-dialog v-model="showChangePassDialog">
      <q-card class="dialog-card" style="width: 420px; max-width: 92vw">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <q-icon name="lock" color="primary" />
            <div class="text-h6 text-primary">Change Password</div>
          </div>
          <q-btn dense flat icon="close" color="primary" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Verify current password</div>
          <div class="row items-center q-gutter-sm">
            <q-input
              v-model="currentPassword"
              :type="showPassword ? 'text' : 'password'"
              label="Current Password"
              dense
              outlined
              rounded
              class="col"
              :error="!!currentPassError"
              :error-message="currentPassError"
              no-error-icon
            >
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
            <q-btn
              :disable="currentPassVerified"
              color="primary"
              label="Verify"
              class="right-btn"
              @click="verifyCurrentPassword"
            />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-sm">Set new password</div>
          <q-input
            v-model="newPasswordDialog"
            :type="showPassword ? 'text' : 'password'"
            label="New Password"
            dense
            outlined
            rounded
            :disable="!currentPassVerified"
            :error="newPassError"
            :error-message="newPassErrorMessage"
            no-error-icon
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-input
            v-model="confirmPasswordDialog"
            :type="showPassword ? 'text' : 'password'"
            label="Confirm New Password"
            dense
            outlined
            rounded
            class="q-mt-sm"
            :disable="!currentPassVerified"
            :error="confirmPassError"
            error-message="Passwords do not match"
            no-error-icon
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            :disable="!currentPassVerified"
            color="primary"
            label="Save"
            class="right-btn"
            @click="submitChangePassword"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Profile data
const profile = ref({
  username: '',
  firstName: '',
  lastName: '',
  dob: '',
  email: '',
  job: '',
  bio: '',
  picture: '',
})

// Password change data
const password = ref({
  new: '',
  confirm: '',
})
const currentPassword = ref('')
const currentPassVerified = ref(false)
const currentPassError = ref('')
const newPasswordDialog = ref('')
const confirmPasswordDialog = ref('')
const newPassError = ref(false)
const confirmPassError = ref(false)

const router = useRouter()
const editMode = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)
const backupProfile = ref(null)
const showDatePicker = ref(false)
const showDeleteDialog = ref(false)
const showChangePassDialog = ref(false)
const usernameTouched = ref(false)
const emailTouched = ref(false)
const passwordTouched = ref(false)
const confirmTouched = ref(false)
const dobError = ref('')
const usernameError = ref(false)
const emailError = ref(false)
const passwordError = ref(false)
const confirmPasswordError = ref(false)
const apiError = ref('')
const successMessage = ref('')

// Original username and email for comparison
const originalUsername = ref('')
const originalEmail = ref('')

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

// Password validator
const isPasswordValid = computed(() => {
  return password.value.new.length >= 8
})

// const passwordErrorMessage = computed(() => {
//   if (passwordTouched.value && password.value.new === '') return 'Password is required'
//   if (passwordTouched.value && !isPasswordValid.value)
//     return 'Password must be at least 8 characters'
//   return ''
// })

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
  const maxDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
  if (isNaN(date.getTime())) {
    dobError.value = 'Invalid date'
  } else if (date > today) {
    dobError.value = 'Date of birth cannot be in the future'
  } else if (date > minDate) {
    dobError.value = 'You must be at least 13 years old'
  } else if (date < maxDate) {
    dobError.value = 'Date of birth is too far in the past'
  } else {
    dobError.value = ''
  }
}

// Save profile
const saveProfile = () => {
  console.log('saveProfile called')
  usernameTouched.value = true
  emailTouched.value = true
  passwordTouched.value = !!password.value.new
  confirmTouched.value = !!password.value.confirm
  apiError.value = ''
  successMessage.value = ''
  isLoading.value = true

  // Validate fields
  validateDob()
  usernameError.value = !profile.value.username
  emailError.value = !profile.value.email || !isEmailValid.value
  passwordError.value = passwordTouched.value && (!password.value.new || !isPasswordValid.value)
  confirmPasswordError.value = confirmTouched.value && password.value.new !== password.value.confirm

  console.log('Validation errors:', {
    usernameError: usernameError.value,
    emailError: emailError.value,
    dobError: dobError.value,
    passwordError: passwordError.value,
    confirmPasswordError: confirmPasswordError.value,
  })

  if (
    usernameError.value ||
    emailError.value ||
    dobError.value ||
    passwordError.value ||
    confirmPasswordError.value
  ) {
    isLoading.value = false
    console.log('Validation failed, stopping save')
    return
  }

  // Check uniqueness of username and email
  const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  if (
    profile.value.username !== originalUsername.value &&
    kanbanUsers.some((user) => user.username === profile.value.username)
  ) {
    apiError.value = 'Username already taken'
    usernameError.value = true
    isLoading.value = false
    return
  }
  if (
    profile.value.email !== originalEmail.value &&
    kanbanUsers.some((user) => user.email === profile.value.email)
  ) {
    apiError.value = 'Email already taken'
    isLoading.value = false
    return
  }

  // Simulate backend API call
  setTimeout(() => {
    console.log('Simulating API call')
    try {
      // Preserve existing password if not changed
      const existingUser = kanbanUsers.find((user) => user.username === originalUsername.value)
      const existingPassword = existingUser?.password

      // Update kanbanUsers: Remove old user and add new one with all profile data
      const updatedUsers = kanbanUsers.filter(
        (user) => user.username !== originalUsername.value || user.email !== originalEmail.value,
      )
      updatedUsers.push({
        username: profile.value.username,
        email: profile.value.email,
        firstName: profile.value.firstName,
        lastName: profile.value.lastName,
        dob: profile.value.dob,
        job: profile.value.job,
        bio: profile.value.bio,
        picture: profile.value.picture,
        password: password.value.new || existingPassword || '',
      })
      localStorage.setItem('kanbanUsers', JSON.stringify(updatedUsers))

      // If username changed, transfer kanbanItems and kanbanInvitations to new username
      if (profile.value.username !== originalUsername.value) {
        const oldItems = JSON.parse(
          localStorage.getItem(`kanbanItems_${originalUsername.value}`) || '[]',
        )
        const oldInvitations = JSON.parse(
          localStorage.getItem(`kanbanInvitations_${originalUsername.value}`) || '[]',
        )

        // Transfer items
        if (oldItems.length > 0) {
          localStorage.setItem(`kanbanItems_${profile.value.username}`, JSON.stringify(oldItems))
          localStorage.removeItem(`kanbanItems_${originalUsername.value}`)
        }

        // Transfer invitations
        if (oldInvitations.length > 0) {
          localStorage.setItem(
            `kanbanInvitations_${profile.value.username}`,
            JSON.stringify(oldInvitations),
          )
          localStorage.removeItem(`kanbanInvitations_${originalUsername.value}`)
        }

        // Update creator and shareWith fields in items
        const items = JSON.parse(
          localStorage.getItem(`kanbanItems_${profile.value.username}`) || '[]',
        )
        items.forEach((item) => {
          if (item.creator === originalUsername.value) {
            item.creator = profile.value.username
          }
          if (item.shareWith) {
            item.shareWith = item.shareWith.map((share) => {
              if (share.username === originalUsername.value) {
                return { ...share, username: profile.value.username }
              }
              return share
            })
          }
          if (item.subitems) {
            item.subitems.forEach((subitem) => {
              if (subitem.creator === originalUsername.value) {
                subitem.creator = profile.value.username
              }
              if (subitem.shareWith) {
                subitem.shareWith = subitem.shareWith.map((share) => {
                  if (share.username === originalUsername.value) {
                    return { ...share, username: profile.value.username }
                  }
                  return share
                })
              }
            })
          }
        })
        localStorage.setItem(`kanbanItems_${profile.value.username}`, JSON.stringify(items))
      }

      // Save updated profile
      localStorage.setItem('userProfile', JSON.stringify(profile.value))
      console.log('Profile saved to localStorage:', profile.value)
      backupProfile.value = null
      editMode.value = false
      if (password.value.new) {
        console.log('Password changed to:', password.value.new)
        password.value.new = ''
        password.value.confirm = ''
        passwordTouched.value = false
        confirmTouched.value = false
      }
      successMessage.value = 'Profile saved successfully'
      console.log('Profile save successful')
      // Update original values
      originalUsername.value = profile.value.username
      originalEmail.value = profile.value.email
      setTimeout(() => {
        successMessage.value = ''
      }, 3000) // Clear success message after 3 seconds
    } catch (e) {
      apiError.value = 'Failed to save profile due to storage error'
      console.error('Error saving to localStorage:', e)
    }
    isLoading.value = false
    console.log('API simulation complete, isLoading set to false')
  }, 1000)
}

// Cancel edit
const cancelEdit = () => {
  if (backupProfile.value) {
    profile.value = { ...backupProfile.value }
  }
  password.value.new = ''
  password.value.confirm = ''
  usernameError.value = false
  emailError.value = false
  dobError.value = ''
  passwordError.value = false
  confirmPasswordError.value = false
  usernameTouched.value = false
  emailTouched.value = false
  passwordTouched.value = false
  confirmTouched.value = false
  editMode.value = false
  apiError.value = ''
  successMessage.value = ''
  console.log('Edit cancelled, state reset')
}

// Backup profile when entering edit mode
watch(editMode, (newVal) => {
  if (newVal) {
    backupProfile.value = { ...profile.value }
    console.log('Edit mode enabled, profile backed up')
  }
})

// Picture upload logic
const fileInput = ref(null)

const triggerFileInput = () => {
  if (editMode.value) {
    fileInput.value.click()
    console.log('File input triggered')
  }
}

const onFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      apiError.value = 'Please upload an image file'
      console.log('Invalid file type, cleared input')
      fileInput.value.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      apiError.value = 'Image size must be less than 5MB'
      console.log('File too large, cleared input')
      fileInput.value.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      profile.value.picture = e.target.result
      console.log('Image loaded successfully')
    }
    reader.readAsDataURL(file)
  }
}

const removePicture = () => {
  if (editMode.value) {
    profile.value.picture = ''
    console.log('Profile picture removed')
  }
}

// Clear error states
const clearUsernameError = () => {
  if (profile.value.username) usernameError.value = false
}

const clearEmailError = () => {
  if (profile.value.email && isEmailValid.value) emailError.value = false
}

// const clearPasswordError = () => {
//   if (password.value.new && isPasswordValid.value) passwordError.value = false
// }

// const clearConfirmPasswordError = () => {
//   if (password.value.new === password.value.confirm) confirmPasswordError.value = false
// }

const verifyCurrentPassword = () => {
  const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  const user = kanbanUsers.find((u) => u.username === originalUsername.value)
  if (user && user.password === currentPassword.value) {
    currentPassVerified.value = true
    currentPassError.value = ''
  } else {
    currentPassVerified.value = false
    currentPassError.value = 'Current password is incorrect'
  }
}

const newPassErrorMessage = computed(() => {
  if (!newPasswordDialog.value) return 'Password is required'
  if (newPasswordDialog.value.length < 8) return 'Password must be at least 8 characters'
  return ''
})

const submitChangePassword = () => {
  newPassError.value = false
  confirmPassError.value = false

  if (!currentPassVerified.value) return
  if (!newPasswordDialog.value || newPasswordDialog.value.length < 8) {
    newPassError.value = true
    return
  }
  if (newPasswordDialog.value !== confirmPasswordDialog.value) {
    confirmPassError.value = true
    return
  }

  const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  const idx = kanbanUsers.findIndex((u) => u.username === originalUsername.value)
  if (idx !== -1) {
    kanbanUsers[idx].password = newPasswordDialog.value
    localStorage.setItem('kanbanUsers', JSON.stringify(kanbanUsers))
    showChangePassDialog.value = false
    currentPassword.value = ''
    currentPassVerified.value = false
    newPasswordDialog.value = ''
    confirmPasswordDialog.value = ''
  }
}

// Check authentication and load profile
onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    apiError.value = 'User not authenticated, redirecting to login'
    console.log('No auth token, redirecting to login')
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
  const savedProfile = localStorage.getItem('userProfile')
  if (savedProfile) {
    try {
      profile.value = JSON.parse(savedProfile)
      originalUsername.value = profile.value.username
      originalEmail.value = profile.value.email
      console.log('Profile loaded from localStorage:', profile.value)
    } catch (e) {
      apiError.value = 'Failed to load profile data'
      console.error('Error loading profile from localStorage:', e)
    }
  }
})

// Delete account
const deleteAccount = () => {
  showDeleteDialog.value = false
  try {
    // Remove user from kanbanUsers
    const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
    const updatedUsers = kanbanUsers.filter(
      (user) => user.username !== profile.value.username || user.email !== profile.value.email,
    )
    localStorage.setItem('kanbanUsers', JSON.stringify(updatedUsers))

    // Remove user from shared items and invitations
    kanbanUsers.forEach((user) => {
      if (user.username !== profile.value.username) {
        // Update shared items
        const userItems = JSON.parse(localStorage.getItem(`kanbanItems_${user.username}`) || '[]')
        userItems.forEach((item) => {
          // Remove user from shareWith in parent items
          if (item.shareWith) {
            item.shareWith = item.shareWith.filter(
              (share) => share.username !== profile.value.username,
            )
          }
          // Remove user from shareWith in subitems
          if (item.subitems) {
            item.subitems.forEach((subitem) => {
              if (subitem.shareWith) {
                subitem.shareWith = subitem.shareWith.filter(
                  (share) => share.username !== profile.value.username,
                )
              }
            })
          }
        })
        localStorage.setItem(`kanbanItems_${user.username}`, JSON.stringify(userItems))

        // Remove invitations
        const invitations = JSON.parse(
          localStorage.getItem(`kanbanInvitations_${user.username}`) || '[]',
        )
        const updatedInvitations = invitations.filter(
          (inv) => inv.invitedBy !== profile.value.username,
        )
        localStorage.setItem(
          `kanbanInvitations_${user.username}`,
          JSON.stringify(updatedInvitations),
        )
      }
    })

    // Remove user-specific data
    localStorage.removeItem(`kanbanItems_${profile.value.username}`)
    localStorage.removeItem(`kanbanInvitations_${profile.value.username}`)
    localStorage.removeItem('authToken')
    localStorage.removeItem('userProfile')
    successMessage.value = 'Account deleted successfully'
    console.log('Account deleted successfully')
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (e) {
    apiError.value = 'Failed to delete account'
    console.error('Error deleting account:', e)
  }
}

// Navigate to home
const goToHome = () => {
  router.push('/home')
  console.log('Navigating to home')
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
.hidden {
  display: none;
}
.constrained-card {
  width: 450px;
  max-width: 90vw;
  /* height: 860px; */
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
}
.fixed-section {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
  padding-bottom: 0;
}
.scrollable-section {
  overflow-y: auto;
  max-height: calc(100vh - 180px);
  padding-right: 8px;
}
.login-logo {
  height: 120px;
  width: auto;
}
.right-btn {
  border-radius: 12px;
  height: 48px;
}
.uniform-input {
  margin-bottom: 0px !important;
}
.uniform-input .q-field__control {
  padding-bottom: 0 !important;
  height: 40px !important;
}
.uniform-input .q-field__bottom {
  padding-top: 4px !important;
  min-height: 0 !important;
  height: auto !important;
}
.uniform-input.q-field--readonly .q-field__control {
  padding-bottom: 0 !important;
  background: var(--q-filled-bg) !important;
  opacity: 1 !important;
  cursor: default !important;
}
.uniform-input:not(.q-field--error) .q-field__bottom {
  display: none !important;
}
.uniform-input.q-field--error .q-field__bottom {
  padding-top: 4px !important;
}
@media (max-height: 600px) {
  .fixed-section {
    padding: 8px;
  }
  .fixed-section .q-avatar {
    size: 60px;
  }
}
</style>
