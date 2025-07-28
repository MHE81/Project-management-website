<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-lg shadow-2" style="width: 400px; max-width: 90vw;">
      <q-card-section>
        <div class="flex flex-center q-mb-md">
          <q-icon name="person_add" size="64px" class="text-primary" />
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

        <q-form @submit.prevent="signUp">
          <!-- Email input -->
          <q-input
            filled
            v-model="email"
            label="Email"
            type="email"
            class="q-mb-md"
            dense
            :error="emailError"
            :error-message="emailErrorMessage"
            @input="clearEmailError"
            autofocus
            aria-label="Enter your email"
          />

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

          <!-- Confirm Password input -->
          <q-input
            filled
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Confirm Password"
            class="q-mb-md"
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

          <!-- Terms of Service Checkbox -->
          <q-checkbox
            v-model="acceptTerms"
            label="I agree to the Terms of Service and Privacy Policy"
            class="q-mb-md"
            dense
            color="primary"
            :error="termsError"
            error-message="You must accept the terms to sign up"
            @input="clearTermsError"
            aria-label="Accept Terms of Service and Privacy Policy"
          />

          <!-- Sign Up button -->
          <q-btn
            label="Sign Up"
            color="primary"
            class="full-width q-mt-md"
            :loading="isLoading"
            type="submit"
            aria-label="Sign up with your details"
          />
        </q-form>

        <q-separator class="q-my-md" />

        <q-btn
          label="Sign up with Google"
          color="red"
          class="full-width"
          icon="fab fa-google"
          @click="signUpWithGoogle"
          aria-label="Sign up with Google account"
        />

        <q-separator class="q-my-md" />

        <router-link
          to="/login"
          class="text-primary text-caption full-width text-center"
          style="text-decoration: none; display: block;"
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
const acceptTerms = ref(false)
const termsTouched = ref(false)
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
const passwordError = computed(() => passwordTouched.value && (password.value === '' || !isPasswordValid.value))
const confirmError = computed(() => confirmTouched.value && confirmPassword.value !== password.value)
const termsError = computed(() => termsTouched.value && !acceptTerms.value)

const emailErrorMessage = computed(() => {
  if (emailTouched.value && email.value === '') return 'Email is required'
  if (emailTouched.value && !isEmailValid.value) return 'Invalid email format'
  return ''
})

const passwordErrorMessage = computed(() => {
  if (passwordTouched.value && password.value === '') return 'Password is required'
  if (passwordTouched.value && !isPasswordValid.value) return 'Password must be at least 8 characters'
  return ''
})

const signUp = () => {
  usernameTouched.value = true
  emailTouched.value = true
  passwordTouched.value = true
  confirmTouched.value = true
  termsTouched.value = true
  apiError.value = ''
  isLoading.value = true

  if (
    usernameError.value ||
    emailError.value ||
    passwordError.value ||
    confirmError.value ||
    termsError.value
  ) {
    isLoading.value = false
    return
  }

  const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]')
  if (kanbanUsers.some(user => user.username === username.value)) {
    apiError.value = 'Username already taken'
    isLoading.value = false
    return
  }
  if (kanbanUsers.some(user => user.email === email.value)) {
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
      picture: ''
    }

    // Add user to kanbanUsers
    kanbanUsers.push({ username: username.value, email: email.value })
    localStorage.setItem('kanbanUsers', JSON.stringify(kanbanUsers))
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
    localStorage.setItem('authToken', 'demo-token-' + Date.now())

    console.log('Username:', username.value)
    console.log('Email:', email.value)
    console.log('Password:', password.value)
    console.log('Terms Accepted:', acceptTerms.value)
    alert('Sign up successful (demo only).')
    router.push('/home')
    isLoading.value = false
  }, 1000)
}

const signUpWithGoogle = () => {
  console.log('Google Sign Up clicked (no Firebase connected yet)')
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

const clearTermsError = () => {
  if (acceptTerms.value) termsTouched.value = false
}
</script>
