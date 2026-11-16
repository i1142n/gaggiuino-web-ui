<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart, Legend, LinearScale, LineElement, PointElement } from 'chart.js'
import type { ChartOptions, ScriptableLineSegmentContext } from 'chart.js'
import type { CurvePoint, IdealCurve } from '../curve.ts'

Chart.register(LineElement, PointElement, LinearScale, Legend)

const props = defineProps<{ curve: IdealCurve }>()

const cssVariable = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const dashedWhenEstimated = (context: ScriptableLineSegmentContext) =>
  props.curve.points[context.p1DataIndex].estimated ? [4, 4] : undefined

const line = (label: string, color: string, value: (point: CurvePoint) => number | null) => ({
  label,
  data: props.curve.points.map((point) => ({ x: point.time, y: value(point) })),
  borderColor: cssVariable(color),
  backgroundColor: cssVariable(color),
  segment: { borderDash: dashedWhenEstimated },
})

const data = computed(() => ({
  datasets: [
    line('Druck (bar)', '--color-primary', (point) => point.pressure),
    line('Fluss (ml/s)', '--color-accent-green', (point) => point.flow),
  ],
}))

const axis = {
  ticks: { color: cssVariable('--color-accent-grey'), font: { family: cssVariable('--font-body'), size: 10 } },
  grid: { color: cssVariable('--color-line') },
}

const options: ChartOptions<'line'> = {
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
  scales: {
    x: { type: 'linear', ...axis, title: { display: true, text: 's', color: cssVariable('--color-accent-grey') } },
    y: { min: 0, suggestedMax: 10, ...axis },
  },
  plugins: {
    legend: {
      labels: { color: cssVariable('--color-text'), boxWidth: 12, boxHeight: 2, font: { family: cssVariable('--font-body'), size: 11 } },
    },
  },
}
</script>

<template>
  <div class="profile-chart">
    <Line :data="data" :options="options" />
  </div>
</template>

<style scoped>
.profile-chart {
  height: 10rem;
}

@media (min-width: 768px) {
  .profile-chart {
    height: 16rem;
  }
}
</style>
