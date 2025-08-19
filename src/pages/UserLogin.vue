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
            label="Username or Email"
            class="q-mb-md"
            dense
            :error="usernameError"
            error-message="Username or Email is required"
            @input="clearUsernameError"
            autofocus
            aria-label="Enter your username or email"
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
            aria-label="Login with username or email and password"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// Form fields and state
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const apiError = ref('');
const rememberMe = ref(false);

// Error states for validation
const usernameError = ref(false);
const passwordError = ref(false);

// Router instance
const router = useRouter();

// Password strength validator
const isPasswordValid = computed(() => {
  return password.value.length >= 8;
});

const passwordErrorMessage = computed(() => {
  if (!password.value) return 'Password is required';
  if (!isPasswordValid.value) return 'Password must be at least 8 characters';
  return '';
});

// Load saved credentials on mount
onMounted(() => {
  const savedCredentials = localStorage.getItem('rememberedCredentials');
  if (savedCredentials) {
    const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
    username.value = savedUsername;
    password.value = savedPassword;
    rememberMe.value = true;
    console.log('Loaded remembered credentials:', savedUsername);
  }
});

const login = () => {
  // Reset error states
  usernameError.value = false;
  passwordError.value = false;
  apiError.value = '';
  isLoading.value = true;

  // Validate fields
  if (!username.value) {
    usernameError.value = true;
    apiError.value = 'Username or Email is required';
    isLoading.value = false;
    return;
  }
  if (!password.value || !isPasswordValid.value) {
    passwordError.value = true;
    isLoading.value = false;
    return;
  }

  // Simulate backend API call
  setTimeout(() => {
    // Check if username or email exists in kanbanUsers
    const kanbanUsers = JSON.parse(localStorage.getItem('kanbanUsers') || '[]');
    console.log('kanbanUsers:', kanbanUsers); // Debug log
    const user = kanbanUsers.find(
      user => (user.username === username.value || user.email === username.value)
    );
    if (!user) {
      apiError.value = 'Invalid username or email';
      usernameError.value = true;
      isLoading.value = false;
      return;
    }

    // Check if password matches
    if (user.password !== password.value) {
      apiError.value = 'Invalid password';
      passwordError.value = true;
      isLoading.value = false;
      return;
    }

    // Handle Remember Me
    if (rememberMe.value) {
      localStorage.setItem(
        'rememberedCredentials',
        JSON.stringify({
          username: username.value,
          password: password.value
        })
      );
      console.log('Credentials saved for Remember Me');
    } else {
      localStorage.removeItem('rememberedCredentials');
      console.log('Remember Me not selected, cleared saved credentials');
    }

    // Load user profile from kanbanUsers
    const newProfile = {
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      dob: user.dob || '',
      job: user.job || '',
      bio: user.bio || '',
      picture: user.picture || ''
    };
    localStorage.setItem('userProfile', JSON.stringify(newProfile));

    // Store demo token for authenticated redirect
    localStorage.setItem('authToken', 'demo-token');
    console.log('Login successful, redirecting to /home');
    alert('Login successful (demo only)');
    router.push('/home');
    isLoading.value = false;
  }, 1000); // Simulate 1-second delay
};

// Clear error states on input
const clearUsernameError = () => {
  if (username.value !== '') {
    usernameError.value = false;
    apiError.value = '';
  }
};

const clearPasswordError = () => {
  if (password.value && isPasswordValid.value) {
    passwordError.value = false;
    apiError.value = '';
  }
};

const signup = () => {
  router.push('/signup');
};

const forgotPassword = () => {
  router.push('/forgetPass');
};
</script>
