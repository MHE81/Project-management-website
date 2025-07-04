<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-lg shadow-2" style="width: 400px; max-width: 90vw;">
      <q-card-section>
        <div class="flex flex-center q-mb-md">
          <q-icon name="account_circle" size="64px" class="text-primary" />
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

        <q-form @submit.prevent="login">
          <!-- Username input -->
          <q-input
            filled
            v-model="username"
            label="Username"
            class="q-mb-md"
            dense
            :error="usernameError"
            error-message="Username is required"
            @input="clearUsernameError"
            autofocus
            aria-label="Enter your username"
          />

          <!-- Password input -->
          <q-input
            filled
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            class="q-mb-md"
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

          <!-- Remember Me checkbox -->
          <q-checkbox
            v-model="rememberMe"
            label="Remember Me"
            class="q-mb-md"
            dense
            color="primary"
            aria-label="Remember me for future logins"
          />

          <!-- Forgot Password link -->
          <div class="text-right q-mb-md">
            <router-link
              to="/forgot-password"
              class="text-primary text-caption"
              style="text-decoration: none;"
              tabindex="0"
              @click="forgotPassword"
            >
              Forgot Password?
            </router-link>
          </div>

          <!-- Login button -->
          <q-btn
            label="Login"
            color="primary"
            class="full-width q-mt-md"
            :loading="isLoading"
            type="submit"
            aria-label="Login with username and password"
          />

          <q-separator class="q-my-md" />

          <q-btn
            label="Login with Google"
            color="red"
            class="full-width"
            icon="fab fa-google"
            @click="loginWithGoogle"
            aria-label="Login with Google account"
          />

          <q-separator class="q-my-md" />

          <q-btn
            label="Sign up"
            color="secondary"
            class="full-width q-mt-md"
            icon="person_add"
            @click="signup"
            aria-label="Navigate to sign-up page"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed,
  // onMounted 
} from 'vue'

// Form fields and state
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const apiError = ref('')
const rememberMe = ref(false)

// Error states for validation
const usernameError = ref(false)
const passwordError = ref(false)

// Password strength validator
const isPasswordValid = computed(() => {
  return password.value.length >= 8
})

const passwordErrorMessage = computed(() => {
  if (!password.value) return 'Password is required'
  if (!isPasswordValid.value) return 'Password must be at least 8 characters'
  return ''
})

const login = () => {
  // Reset error states
  usernameError.value = false
  passwordError.value = false
  apiError.value = ''
  isLoading.value = true

  // Validate fields
  if (!username.value) {
    usernameError.value = true
  }
  if (!password.value || !isPasswordValid.value) {
    passwordError.value = true
  }

  // If any validation fails, prevent login
  if (usernameError.value || passwordError.value) {
    isLoading.value = false
    return
  }

  // Simulate backend API call
  setTimeout(() => {
    // Demo: Simulate backend errors
    const random = Math.random()
    if (random < 0.1) {
      apiError.value = 'Invalid username or password'
    } else if (random < 0.2) {
      apiError.value = 'Account locked, please reset password'
    } else {
      console.log('Username:', username.value)
      console.log('Password:', password.value)
      console.log('Remember Me:', rememberMe.value)
      // Store demo token for authenticated redirect
      localStorage.setItem('authToken', 'demo-token')
      alert('Login successful (demo only)')
      window.location.href = 'http://localhost:9000/#/home'
    }
    isLoading.value = false
  }, 1000) // Simulate 1-second delay
}

// Clear error states on input change
const clearUsernameError = () => {
  if (username.value !== '') {
    usernameError.value = false
  }
}

const clearPasswordError = () => {
  if (password.value && isPasswordValid.value) {
    passwordError.value = false
  }
}

const loginWithGoogle = () => {
  console.log('Google Login clicked (no Firebase connected yet)')
}

const signup = () => {
  window.location.href = 'http://localhost:9000/#/signup'
}

const forgotPassword = () => {
  window.location.href = 'http://localhost:9000/#/forgetPass'
}

// Check if already authenticated
// onMounted(() => {
//   const token = localStorage.getItem('authToken')
//   if (token) {
//     console.log('User already authenticated, redirecting to home')
//     window.location.href = 'http://localhost:9000/#/home'
//   }
// })
</script>
