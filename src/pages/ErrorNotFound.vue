<template>
  <q-page class="q-pa-md login-bg flex flex-center">
    <div class="login-navbar">
      <div class="brand">
        <img src="/logo.png" alt="PLANOVA logo" class="brand-logo" />
        <span class="brand-title">PLANOVA</span>
      </div>
    </div>
    <div class="text-white text-center">
      <div style="font-size: 30vh">404</div>
      <div class="text-h2" style="opacity: 0.9">Oops. Nothing here...</div>
    </div>
  </q-page>
</template>

<script setup>
//
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
</style>
