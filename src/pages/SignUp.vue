<template>
  <q-page class="login-gradient flex flex-center">
    <q-card flat class="login-card q-pa-xl">
      <q-card-section class="q-pb-none">
        <div class="row items-center q-gutter-sm q-mb-md">
          <q-avatar size="32px" class="bg-primary text-white">
            <q-icon name="flight_takeoff" size="20px" />
          </q-avatar>
          <div class="text-h6 text-weight-bold">Planova</div>
        </div>
        <div class="text-h5 text-weight-bold q-mt-sm">Create your account</div>
      </q-card-section>

      <q-card-section class="q-pt-lg">
        <q-form @submit="onSubmit" class="q-gutter-md" greedy>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="name"
                label="Full name"
                filled
                dense
                :rules="[v => !!v || 'Name is required']"
                input-class="login-input"
                class="login-input-wrapper"
                autocomplete="name"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model="email"
                type="email"
                label="Email"
                filled
                dense
                input-class="login-input"
                class="login-input-wrapper"
                autocomplete="email"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model="password"
                :type="isPwd ? 'password' : 'text'"
                label="Password"
                filled
                dense
                :rules="[v => !!v || 'Password is required', v => (v && v.length >= 6) || 'Min 6 characters']"
                input-class="login-input"
                class="login-input-wrapper"
                autocomplete="new-password"
              >
                <template #append>
                  <q-icon
                    :name="isPwd ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-input
                v-model="confirmPassword"
                :type="isPwdConfirm ? 'password' : 'text'"
                label="Confirm password"
                filled
                dense
                :rules="[v => !!v || 'Please confirm password', v => v === password || 'Passwords do not match']"
                input-class="login-input"
                class="login-input-wrapper"
                autocomplete="new-password"
              >
                <template #append>
                  <q-icon
                    :name="isPwdConfirm ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="isPwdConfirm = !isPwdConfirm"
                  />
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-checkbox
                v-model="accept"
                label="I agree to the Terms of Service and Privacy Policy"
                :rules="[val => val === true || 'You must agree before continuing']"
                dense
              />
            </div>
          </div>

          <q-btn
            type="submit"
            label="Create account"
            color="dark"
            class="q-mt-sm login-btn full-width"
            :loading="loading"
            icon-right="arrow_forward"
            unelevated
          />
        </q-form>

        <div class="q-mt-md text-caption text-grey-7">
          Already have an account?
          <q-btn flat padding="0" class="q-ml-xs text-primary text-weight-medium" label="Log in" @click="goLogin" />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const accept = ref(false)
const isPwd = ref(true)
const isPwdConfirm = ref(true)
const loading = ref(false)

// const emailRule = (v: string | null | undefined): true | string => {
//   if (!v) return 'Email is required'
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email'
// }
//


const onSubmit = async () => {
  loading.value = true
  try {
    // TODO: replace with real sign up call
    await new Promise(r => setTimeout(r, 800))
    // Example success route:
    // router.push({ name: 'dashboard' })
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Reuse same look as login page */
.login-gradient {
  min-height: 100vh;
  background: radial-gradient(1200px 700px at 15% 85%, #ffb6c1 0%, rgba(255, 182, 193, 0) 60%),
  radial-gradient(900px 600px at 85% 15%, #c7d2fe 0%, rgba(199, 210, 254, 0) 55%),
  linear-gradient(135deg, #ffe1c7 0%, #f5d9ff 35%, #c9f1ff 70%, #ffd6e7 100%);
}

.login-card {
  width: 540px;
  max-width: 92vw;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.12);
}

.login-input-wrapper :deep(.q-field__control) {
  border-radius: 10px;
  background: #f6f7fb;
  min-height: 46px;
}

.login-input {
  font-size: 14px;
}

.login-btn {
  height: 44px;
  border-radius: 10px;
  background: #131a2a;
  color: #ffffff;
}
</style>
