<template>
  <q-page class="q-pa-md flex flex-center login-bg">
    <div class="login-navbar">
      <div class="brand">
        <img src="/logo.png" alt="PLANOVA logo" class="brand-logo" />
        <span class="brand-title">PLANOVA</span>
      </div>
    </div>
    <q-card class="q-pa-lg shadow-2" style="width: 420px; max-width: 95vw; border-radius: 16px">
      <q-card-section>
        <div class="flex column items-center q-mb-md">
          <img src="/logo.png" alt="PLANOVA logo" class="login-logo" />
          <div class="text-h4 text-primary q-mt-sm">Sign Up</div>
        </div>

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

        <!-- Email verification success banner -->
        <q-banner
          v-if="emailVerified"
          dense
          class="bg-positive text-white q-mb-md"
          aria-live="polite"
          role="alert"
        >
          Email verified successfully!
        </q-banner>

        <q-form @submit.prevent="signUp">
          <!-- Email input -->
          <q-input
            filled
            v-model="email"
            label="Email"
            type="email"
            class="q-mb-md tall-input"
            dense
            :error="emailError"
            :error-message="emailErrorMessage"
            @input="clearEmailError"
            autofocus
            aria-label="Enter your email"
          />

          <!-- Send Code button -->
          <q-btn
            label="Send Code"
            color="primary"
            class="full-width q-mb-md right-btn"
            :disable="!isEmailValid || emailVerificationSent"
            @click="sendVerificationCode"
            aria-label="Send verification code to your email"
          />

          <!-- Verification Code input -->
          <q-input
            v-if="emailVerificationSent"
            filled
            v-model="verificationCode"
            label="Verification Code"
            class="q-mb-md tall-input"
            dense
            maxlength="4"
            :error="verificationError"
            error-message="Invalid verification code"
            @input="clearVerificationError"
            aria-label="Enter the 4-digit verification code"
          >
            <template v-slot:append>
              <q-btn
                label="Verify Email"
                color="primary"
                class="right-btn"
                :disable="verificationCode.length !== 4"
                @click="verifyEmail"
                aria-label="Verify email with code"
              />
            </template>
          </q-input>

          <!-- Username input -->
          <q-input
            filled
            v-model="username"
            label="Username"
            class="q-mb-md tall-input"
            dense
            :error="usernameError"
            error-message="Username is required"
            @input="clearUsernameError"
            aria-label="Enter your username"
          />

          <!-- Password input -->
          <q-input
            filled
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            class="q-mb-md tall-input"
            dense
            :error="passwordError"
            :error-message="passwordErrorMessage"
            @input="clearPasswordError"
            aria-label="Enter your password"
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <!-- Confirm Password input -->
          <q-input
            filled
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Confirm Password"
            class="q-mb-md tall-input"
            dense
            :error="confirmError"
            error-message="Passwords do not match"
            @input="clearConfirmError"
            aria-label="Confirm your password"
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <!-- Sign Up button -->
          <q-btn
            label="Sign Up"
            color="primary"
            class="full-width q-mt-md right-btn"
            :loading="isLoading"
            type="submit"
            :disable="!emailVerified"
            aria-label="Sign up with your details"
          />
        </q-form>

        <q-separator class="q-my-md" />

        <router-link
          to="/login"
          class="link full-width text-center"
          style="display: block"
          tabindex="0"
          @click="goToLogin"
          aria-label="Navigate back to login page"
        >
          Back to Login
        </router-link>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const apiError = ref('')
const emailVerificationSent = ref(false)
const emailVerified = ref(false)
const verificationCode = ref('')
const verificationError = ref(false)
const generatedCode = ref('')
const usernameTouched = ref(false)
const emailTouched = ref(false)
const passwordTouched = ref(false)
const confirmTouched = ref(false)

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const isPasswordValid = computed(() => {
  return password.value.length >= 8
})

const usernameError = computed(() => usernameTouched.value && username.value === '')
const emailError = computed(() => emailTouched.value && (email.value === '' || !isEmailValid.value))
const passwordError = computed(
  () => passwordTouched.value && (password.value === '' || !isPasswordValid.value),
)
const confirmError = computed(
  () => confirmTouched.value && confirmPassword.value !== password.value,
)

const emailErrorMessage = computed(() => {
  if (emailTouched.value && email.value === '') return 'Email is required'
  if (emailTouched.value && !isEmailValid.value) return 'Invalid email format'
  return ''
})

const passwordErrorMessage = computed(() => {
  if (passwordTouched.value && password.value === '') return 'Password is required'
  if (passwordTouched.value && !isPasswordValid.value)
    return 'Password must be at least 8 characters'
  return ''
})

const sendVerificationCode = () => {
  if (!isEmailValid.value) {
    emailTouched.value = true
    return
  }
  // For local testing, set a fixed code and log it
  generatedCode.value = '1234' // Fixed code for testing
  emailVerificationSent.value = true
  console.log('Verification code for testing (use this):', generatedCode.value)
}

const verifyEmail = () => {
  if (verificationCode.value === generatedCode.value) {
    emailVerified.value = true
    apiError.value = ''
  } else {
    emailVerified.value = false
    verificationError.value = true
    apiError.value = 'Invalid verification code'
    // Clear all fields except email
    username.value = ''
    password.value = ''
    confirmPassword.value = ''
    usernameTouched.value = false
    passwordTouched.value = false
    confirmTouched.value = false
  }
}

const signUp = () => {
  usernameTouched.value = true
  emailTouched.value = true
  passwordTouched.value = true
  confirmTouched.value = true
  apiError.value = ''
  isLoading.value = true

  if (
    usernameError.value ||
    emailError.value ||
    passwordError.value ||
    confirmError.value ||
    !emailVerified.value
  ) {
    isLoading.value = false
    return
  }

  const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  if (kanbanUsers.some((user) => user.username === username.value)) {
    apiError.value = 'Username already taken'
    isLoading.value = false
    return
  }
  if (kanbanUsers.some((user) => user.email === email.value)) {
    apiError.value = 'Email already taken'
    isLoading.value = false
    return
  }

  setTimeout(() => {
    // Create full profile with empty fields
    const userProfile = {
      username: username.value,
      email: email.value,
      firstName: '',
      lastName: '',
      dob: '',
      job: '',
      bio: '',
      picture: '',
    }

    // Add user to kanbanUsers with password
    kanbanUsers.push({
      username: username.value,
      email: email.value,
      password: password.value, // Store password
    })
    localStorage.setItem('kanbanUsers', JSON.stringify(kanbanUsers))
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
    localStorage.setItem('authToken', 'demo-token-' + Date.now())

    console.log('Username:', username.value)
    console.log('Email:', email.value)
    console.log('Password:', password.value)
    console.log('kanbanUsers after signup:', JSON.parse(localStorage.getItem('kanbanUsers')))
    alert('Sign up successful (demo only).')
    router.push('/login')
    isLoading.value = false
  }, 1000)
}

const goToLogin = () => {
  router.push('/login')
}

const clearUsernameError = () => {
  if (username.value !== '') usernameTouched.value = false
}

const clearEmailError = () => {
  if (email.value && isEmailValid.value) emailTouched.value = false
}

const clearPasswordError = () => {
  if (password.value && isPasswordValid.value) passwordTouched.value = false
}

const clearConfirmError = () => {
  if (confirmPassword.value === password.value) confirmTouched.value = false
}

const clearVerificationError = () => {
  if (verificationCode.value.length === 4) verificationError.value = false
}

// Commented out for local testing without backend; uncomment when backend is available
// const sendVerificationCode = () => {
//   if (!isEmailValid.value) {
//     emailTouched.value = true
//     return
//   }
//   // Simulate sending a 4-digit code
//   generatedCode.value = Math.floor(1000 + Math.random() * 9000).toString()
//   emailVerificationSent.value = true
//   console.log('Verification code sent (mock):', generatedCode.value)
// }
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
  background-color: #4d81c5;
  color: white;
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

.login-logo {
  height: 120px;
  width: auto;
}

.link {
  color: #114992;
  text-decoration: none;
  font-size: 13px;
}

.link:hover {
  text-decoration: underline;
}
.right-btn {
  border-radius: 12px;
  height: 48px;
}
</style>
