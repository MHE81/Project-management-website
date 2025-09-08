<template>
  <q-page class="q-pa-md login-bg">
    <div class="login-navbar">
      <div class="brand">
        <img src="/logo.png" alt="PLANOVA logo" class="brand-logo" />
        <span class="brand-title">PLANOVA</span>
      </div>
    </div>
    <div>
      <q-card class="q-pa-md">
        <div class="text-subtitle2 q-mb-sm">Progress Overview</div>
        <Pie :data="chartData" :options="chartOptions" />
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  items: Array,
})

const chartData = computed(() => {
  const statusCounts = {
    backlog: 0,
    inProgress: 0,
    done: 0,
  }

  props.items.forEach((item) => {
    if (statusCounts[item.status] !== undefined) {
      statusCounts[item.status]++
    }
  })

  return {
    labels: ['Backlog', 'In Progress', 'Done'],
    datasets: [
      {
        label: 'Status Count',
        backgroundColor: ['#f2c037', '#42a5f5', '#66bb6a'],
        data: [statusCounts.backlog, statusCounts.inProgress, statusCounts.done],
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}
</script>

<style scoped>
.login-bg {
  background-image: url('/back.png');
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

.q-card {
  height: 300px;
}
</style>
