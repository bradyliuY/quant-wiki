<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * 100 分评分模型：5 维雷达图 + 滑块 + 总分动态累加 + 评级。
 * 维度：趋势30 / 动量25 / 形态20 / 支阻15 / 情绪10
 */
const props = withDefaults(
  defineProps<{
    initial?: Partial<Record<string, number>>
    title?: string
  }>(),
  { initial: () => ({}), title: '100 分技术评分模型' }
)

const dims = [
  { key: 'trend', label: '趋势强度', max: 30, color: '#1e5fd0' },
  { key: 'momentum', label: '动量指标', max: 25, color: '#e69138' },
  { key: 'pattern', label: '形态识别', max: 20, color: '#7b1fa2' },
  { key: 'sr', label: '支撑阻力', max: 15, color: '#26a69a' },
  { key: 'sentiment', label: '市场情绪', max: 10, color: '#ef5350' }
]

const scores = ref<Record<string, number>>({
  trend: props.initial.trend ?? 20,
  momentum: props.initial.momentum ?? 15,
  pattern: props.initial.pattern ?? 12,
  sr: props.initial.sr ?? 8,
  sentiment: props.initial.sentiment ?? 5
})

const total = computed(() =>
  dims.reduce((sum, d) => sum + (scores.value[d.key] ?? 0), 0)
)

const rating = computed(() => {
  const t = total.value
  if (t >= 90) return { stars: '⭐⭐⭐⭐⭐', label: '强烈推荐' }
  if (t >= 80) return { stars: '⭐⭐⭐⭐', label: '推荐' }
  if (t >= 70) return { stars: '⭐⭐⭐', label: '观望' }
  if (t >= 60) return { stars: '⭐⭐', label: '谨慎' }
  return { stars: '⭐', label: '不推荐' }
})

function radarPoints() {
  const cx = 100, cy = 100, r = 72
  const n = dims.length
  return dims.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const val = (scores.value[d.key] ?? 0) / d.max
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
      label: d.label,
      labelX: cx + (r + 26) * Math.cos(angle),
      labelY: cy + (r + 26) * Math.sin(angle),
      maxLabelX: cx + r * Math.cos(angle),
      maxLabelY: cy + r * Math.sin(angle)
    }
  })
}

function ringPoints() {
  const cx = 100, cy = 100, r = 72
  const n = dims.length
  return [0.25, 0.5, 0.75, 1].map((f) =>
    dims.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      return { x: cx + r * f * Math.cos(angle), y: cy + r * f * Math.sin(angle) }
    })
  )
}

const radar = computed(() => {
  const pts = radarPoints()
  return {
    points: pts.map((p) => `${p.x},${p.y}`).join(' '),
    rings: ringPoints().map((ring) => ring.map((p) => `${p.x},${p.y}`).join(' ')),
    labels: pts
  }
})

function updateScore(key: string, value: number) {
  scores.value[key] = value
}

watch(total, () => {})
</script>

<template>
  <div class="chart-container score-matrix">
    <div class="demo-title">{{ title }}</div>
    <div class="sm-body">
      <div class="sm-radar">
        <svg viewBox="0 0 200 200" class="radar-svg">
          <polygon v-for="ring in radar.rings" :key="ring" :points="ring" fill="none" stroke="var(--vp-c-divider)" stroke-width="0.8" />
          <polygon :points="radar.points" fill="rgba(30,95,208,0.18)" stroke="#1e5fd0" stroke-width="2" />
          <text v-for="l in radar.labels" :key="l.label" :x="l.labelX" :y="l.labelY" font-size="8" text-anchor="middle" fill="var(--vp-c-text-2)">
            {{ l.label }}
          </text>
        </svg>
        <div class="sm-total">
          <div class="sm-score">{{ total }}</div>
          <div class="sm-rating">{{ rating.stars }} {{ rating.label }}</div>
        </div>
      </div>
      <div class="sm-sliders">
        <div v-for="d in dims" :key="d.key" class="sm-slider">
          <label>{{ d.label }} <span class="max">(满分 {{ d.max }})</span>: <strong>{{ scores[d.key] }}</strong></label>
          <input type="range" :min="0" :max="d.max" v-model.number="scores[d.key]" @input="(e) => updateScore(d.key, Number((e.target as HTMLInputElement).value))" />
          <div class="bar"><div class="bar-fill" :style="{ width: (scores[d.key] / d.max) * 100 + '%', background: d.color }"></div></div>
        </div>
        <div class="sm-note">拖动滑块模拟不同股票的评分，观察总分与评级变化。</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-matrix { padding: 0; }
.demo-title { padding: 8px 12px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--vp-c-divider); }
.sm-body { display: grid; grid-template-columns: 260px 1fr; gap: 16px; padding: 16px; align-items: center; }
.sm-radar { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.radar-svg { width: 200px; height: 200px; }
.sm-total { text-align: center; }
.sm-score { font-size: 36px; font-weight: 800; color: var(--vp-c-brand-1); line-height: 1; }
.sm-rating { font-size: 14px; margin-top: 4px; }
.sm-sliders { display: flex; flex-direction: column; gap: 10px; }
.sm-slider { display: flex; flex-direction: column; gap: 3px; }
.sm-slider label { font-size: 13px; }
.max { color: var(--vp-c-text-3); font-size: 12px; }
.sm-slider input { width: 100%; }
.bar { height: 4px; background: var(--vp-c-divider); border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 2px; transition: width 0.3s ease; }
.sm-note { font-size: 12px; color: var(--vp-c-text-3); margin-top: 4px; }
</style>
