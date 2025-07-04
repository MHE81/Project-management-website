<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-lg shadow-2" style="width: 400px; max-width: 90vw;">
      <q-card-section>
        <div class="flex flex-center q-mb-md">
          <q-icon name="lock_reset" size="64px" class="text-primary" />
        </div>

        <q-form @submit.prevent="handleSubmit">
          <!-- Step 1: Email input -->
          <div v-if="step === 1">
            <q-input
              filled
              v-model="email"
              label="Email"
              type="email"
              class="q-mb-md"
              dense
              :error="emailError"
              error-message="Valid email is required"
              @input="clearEmailError"
            />

            <q-btn
              label="Send Verification Code"
              color="primary"
              class="full-width q-mt-md"
              :loading="isLoading"
              type="submit"
            />
          </div>

          <!-- Step 2: Code input -->
          <div v-if="step === 2">
            <q-input
              filled
              v-model="code"
              label="Verification Code"
              class="q-mb-md"
              dense
              :error="codeError"
              error-message="Invalid code"
              @input="clearCodeError"
            />

            <q-btn
              label="Verify Code"
              color="primary"
              class="full-width q-mt-md"
              :loading="isLoading"
              type="submit"
            />

            <div class="text-center q-mt-md">
              <q-btn
                flat
                label="Resend Code"
                color="primary"
                size="sm"
                :disable="isLoading"
                @click="sendCode"
              />
            </div>
          </div>

          <!-- Step 3: New Password input -->
          <div v-if="step === 3">
            <q-input
              filled
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="New Password"
              class="q-mb-md"
              dense
              :error="passwordError"
              error-message="Password is required"
              @input="clearPasswordError"
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
              filled
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              label="Confirm Password"
              class="q-mb-md"
              dense
              :error="confirmPasswordError"
              error-message="Passwords must match"
              @input="clearConfirmPasswordError"
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
              label="Reset Password"
              color="primary"
              class="full-width q-mt-md"
              :loading="isLoading"
              type="submit"
            />
          </div>
        </q-form>

        <q-separator class="q-my-md" />

        <q-btn
          flat
          label="Back to Login"
          color="primary"
          class="full-width"
          to="/login"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

// Form fields and state
const email = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const step = ref(1) // 1: email, 2: code, 3: password
const isLoading = ref(false)
const emailError = ref(false)
const codeError = ref(false)
const passwordError = ref(false)
const confirmPasswordError = ref(false)

const sendCode = () => {
  emailError.value = false
  isLoading.value = true

  // Basic email validation
  if (!email.value || !email.value.includes('@')) {
    emailError.value = true
    isLoading.value = false
    return
  }

  // Simulate backend API call to send code
  setTimeout(() => {
    console.log('Requesting verification code for:', email.value)
    // Placeholder: Assume backend sends code via email
    isLoading.value = false
    step.value = 2
  }, 1000) // Simulate 1-second API delay
}

const verifyCode = () => {
  codeError.value = false
  isLoading.value = true

  // Simulate backend API call to verify code
  setTimeout(() => {
    // Placeholder: Assume backend verifies code
    // For demo, proceed to next step (in real app, check API response)
    console.log('Verifying code:', code.value)
    isLoading.value = false
    step.value = 3
    // Note: Backend would return success/failure; here we assume success
    // If code is invalid, backend would trigger error (handled in real app)
  }, 1000) // Simulate 1-second API delay
}

const resetPassword = () => {
  passwordError.value = false
  confirmPasswordError.value = false
  isLoading.value = true

  // Validate password
  if (!password.value) {
    passwordError.value = true
    isLoading.value = false
    return
  }
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = true
    isLoading.value = false
    return
  }

  // Simulate backend API call to reset password
  setTimeout(() => {
    console.log('Resetting password for:', email.value)
    console.log('New password:', password.value)
    isLoading.value = false
    alert('Password reset successful (demo only)')
    window.location.href = 'http://localhost:9000/#/home'
  }, 1000) // Simulate 1-second API delay
}

const handleSubmit = () => {
  if (step.value === 1) sendCode()
  else if (step.value === 2) verifyCode()
  else if (step.value === 3) resetPassword()
}

const clearEmailError = () => {
  if (email.value && email.value.includes('@')) {
    emailError.value = false
  }
}

const clearCodeError = () => {
  if (code.value) {
    codeError.value = false
  }
}

const clearPasswordError = () => {
  if (password.value) {
    passwordError.value = false
  }
}

const clearConfirmPasswordError = () => {
  if (confirmPassword.value) {
    confirmPasswordError.value = false
  }
}
</script>
