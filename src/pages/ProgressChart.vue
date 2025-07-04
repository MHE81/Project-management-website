<template>
  <div>
    <q-card class="q-pa-md">
      <div class="text-subtitle2 q-mb-sm">Progress Overview</div>
      <Pie :data="chartData" :options="chartOptions" />
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  items: Array
})

const chartData = computed(() => {
  const statusCounts = {
    backlog: 0,
    inProgress: 0,
    done: 0
  }

  props.items.forEach(item => {
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
        data: [
          statusCounts.backlog,
          statusCounts.inProgress,
          statusCounts.done
        ]
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}
</script>

<style scoped>
.q-card {
  height: 300px;
}
</style>
