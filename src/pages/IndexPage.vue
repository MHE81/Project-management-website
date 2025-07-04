<template>
  <q-page class="flex flex-center text-white">
    <div class="q-pa-md"> <!-- Optional padding wrapper -->
      <div class="row justify-center q-gutter-md">
        <q-input
          input-class="text-center text-h5 text-white"
          color="teal"
          filled
          placeholder="hello"
        />
      </div>

      <div class="row items-center justify-center q-gutter-md q-mt-md">
        <q-btn round size="xl" glossy icon="remove" />
        <div class="text-h2 q-mx-md">23</div>
        <q-btn round size="xl" glossy icon="add" />
      </div>

      <div class="row justify-center q-mt-md">
        <q-btn round size="xl" glossy icon="restart_alt" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
// No logic yet, so nothing here
</script>
