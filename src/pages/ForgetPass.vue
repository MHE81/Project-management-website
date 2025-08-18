<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-lg shadow-2" style="width: 400px; max-width: 90vw;">
      <q-card-section>
        <div class="flex flex-center q-mb-md">
          <q-icon name="lock_reset" size="64px" class="text-primary" />
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

        <!-- Success banner for verification -->
        <q-banner
          v-if="emailVerified"
          dense
          class="bg-positive text-white q-mb-md"
          aria-live="polite"
          role="alert"
        >
          Verification code validated successfully!
        </q-banner>

        <q-form @submit.prevent="verifyUser">
          <!-- Username or Email input -->
          <q-input
            filled
            v-model="usernameOrEmail"
            label="Username or Email"
            class="q-mb-md"
            dense
            :error="usernameError"
            error-message="Username or Email is required"
            @input="clearUsernameError"
            autofocus
            aria-label="Enter your username or email"
            :disable="emailVerificationSent"
          />

          <!-- Verify button -->
          <q-btn
            label="Verify"
            color="primary"
            class="full-width q-mb-md"
            :loading="isVerifying"
            :disable="emailVerificationSent"
            @click="verifyUser"
            aria-label="Verify your username or email"
          />

          <!-- Verification Code input -->
          <q-input
            v-if="emailVerificationSent"
            filled
            v-model="verificationCode"
            label="Verification Code"
            class="q-mb-md"
            dense
            maxlength="4"
            :error="verificationError"
            error-message="Invalid verification code"
            @input="clearVerificationError"
            aria-label="Enter the 4-digit verification code"
          >
            <template v-slot:append>
              <q-btn
                label="Validate Code"
                color="primary"
                :disable="verificationCode.length !== 4"
                @click="validateCode"
                aria-label="Validate the verification code"
              />
            </template>
          </q-input>
        </q-form>

        <!-- Password reset dialog -->
        <q-dialog v-model="showPasswordDialog" persistent>
          <q-card style="width: 400px; max-width: 90vw;">
            <q-card-section>
              <div class="text-h6">Set New Password</div>
            </q-card-section>

            <q-card-section>
              <q-form @submit.prevent="resetPassword">
                <!-- New Password input -->
                <q-input
                  filled
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  label="New Password"
                  class="q-mb-md"
                  dense
                  :error="newPasswordError"
                  :error-message="newPasswordErrorMessage"
                  @input="clearNewPasswordError"
                  aria-label="Enter your new password"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="showPassword ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </q-input>

                <!-- Confirm New Password input -->
                <q-input
                  filled
                  v-model="confirmNewPassword"
                  :type="showPassword ? 'text' : 'password'"
                  label="Confirm New Password"
                  class="q-mb-md"
                  dense
                  :error="confirmError"
                  error-message="Passwords do not match"
                  @input="clearConfirmError"
                  aria-label="Confirm your new password"
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
                  :loading="isResetting"
                  type="submit"
                  aria-label="Reset your password"
                />
              </q-form>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup aria-label="Cancel password reset" />
            </q-card-actions>
          </q-card>
        </q-dialog>

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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const usernameOrEmail = ref('');
const verificationCode = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const showPassword = ref(false);
const isVerifying = ref(false);
const isResetting = ref(false);
const apiError = ref('');
const emailVerificationSent = ref(false);
const emailVerified = ref(false);
const showPasswordDialog = ref(false);
const usernameError = ref(false);
const verificationError = ref(false);
const newPasswordError = ref(false);
const confirmError = ref(false);
const generatedCode = ref('');

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(usernameOrEmail.value);
});

const isPasswordValid = computed(() => {
  return newPassword.value.length >= 8;
});

const isPasswordRepeated = computed(() => {
  const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]');
  const user = kanbanUsers.find(
    user => user.username === usernameOrEmail.value || user.email === usernameOrEmail.value
  );
  return user && user.password === newPassword.value;
});

const newPasswordErrorMessage = computed(() => {
  if (!newPassword.value) return 'Password is required';
  if (!isPasswordValid.value) return 'Password must be at least 8 characters';
  if (isPasswordRepeated.value) return 'New password cannot be the same as the old password';
  return '';
});

const usernameErrorMessage = computed(() => {
  return 'Username or Email is required';
});

const verifyUser = () => {
  usernameError.value = false;
  apiError.value = '';
  isVerifying.value = true;

  if (!usernameOrEmail.value) {
    usernameError.value = true;
    apiError.value = usernameErrorMessage.value;
    isVerifying.value = false;
    return;
  }

  const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]');
  const user = kanbanUsers.find(
    user => user.username === usernameOrEmail.value || user.email === usernameOrEmail.value
  );

  if (!user) {
    apiError.value = 'Username or Email not found';
    usernameError.value = true;
    isVerifying.value = false;
    return;
  }

  sendVerificationCode();
  isVerifying.value = false;
};

// Commented out for local testing without backend; uncomment when backend is available
// const sendVerificationCode = () => {
//   if (!isEmailValid.value && !usernameOrEmail.value) {
//     usernameError.value = true;
//     apiError.value = 'Valid email or username required';
//     return;
//   }
//   // Simulate sending a 4-digit code
//   generatedCode.value = Math.floor(1000 + Math.random() * 9000).toString();
//   emailVerificationSent.value = true;
//   console.log('Verification code sent (mock):', generatedCode.value);
// }

const sendVerificationCode = () => {
  if (!isEmailValid.value && !usernameOrEmail.value) {
    usernameError.value = true;
    apiError.value = 'Valid email or username required';
    return;
  }
  // For local testing, set a fixed code and log it
  generatedCode.value = '1234'; // Fixed code for testing
  emailVerificationSent.value = true;
  console.log('Verification code for testing (use this):', generatedCode.value);
};

const validateCode = () => {
  if (verificationCode.value === generatedCode.value) {
    emailVerified.value = true;
    apiError.value = '';
    showPasswordDialog.value = true;
  } else {
    emailVerified.value = false;
    verificationError.value = true;
    apiError.value = 'Invalid verification code';
  }
};

const resetPassword = () => {
  newPasswordError.value = false;
  confirmError.value = false;
  apiError.value = '';
  isResetting.value = true;

  if (!newPassword.value || !isPasswordValid.value || isPasswordRepeated.value) {
    newPasswordError.value = true;
    isResetting.value = false;
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    confirmError.value = true;
    isResetting.value = false;
    return;
  }

  setTimeout(() => {
    // Update user password in kanbanUsers
    const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]');
    const userIndex = kanbanUsers.findIndex(
      user => user.username === usernameOrEmail.value || user.email === usernameOrEmail.value
    );

    if (userIndex !== -1) {
      kanbanUsers[userIndex].password = newPassword.value;
      localStorage.setItem('kanbanUsers', JSON.stringify(kanbanUsers));
      console.log('Password updated for user:', usernameOrEmail.value);
      alert('Password reset successful (demo only).');
      router.push('/login');
    } else {
      apiError.value = 'User not found';
    }

    isResetting.value = false;
    showPasswordDialog.value = false;
  }, 1000);
};

const clearUsernameError = () => {
  if (usernameOrEmail.value !== '') {
    usernameError.value = false;
    apiError.value = '';
  }
};

const clearVerificationError = () => {
  if (verificationCode.value.length === 4) {
    verificationError.value = false;
    apiError.value = '';
  }
};

const clearNewPasswordError = () => {
  if (newPassword.value && isPasswordValid.value && !isPasswordRepeated.value) {
    newPasswordError.value = false;
    apiError.value = '';
  }
};

const clearConfirmError = () => {
  if (confirmNewPassword.value === newPassword.value) {
    confirmError.value = false;
    apiError.value = '';
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>