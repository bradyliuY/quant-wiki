<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * 交互式计算器（GSAP 滚动驱动）
 * 通用框架：公式模式 + 滑块输入 + 结果渐变动画。
 * 支持 kelly / position / riskreward 三种模式。
 */
const props = withDefaults(
  defineProps<{
    mode?: 'kelly' | 'position' | 'riskreward' | 'volatility'
    /** 初始参数 */
    initial?: Record<string, number>
    title?: string
  }>(),
  { mode: 'kelly', initial: () => ({}), title: '交互式计算器' }
)

const mode = ref(props.mode)
const p = ref<Record<string, number>>({ ...props.initial })
const shown = ref(false)

function setDefaultParams() {
  const defaults: Record<string, Record<string, number>> = {
    kelly: { winRate: 60, plRatio: 2 },
    position: { capital: 100000, riskPercent: 2, stopLossPercent: 7 },
    riskreward: { entry: 35.2, target: 40, stopLoss: 33 },
    volatility: { basePosition: 15, stdVol: 30, curVol: 45 }
  }
  const d = defaults[mode.value]
  for (const k in d) {
    if (p.value[k] === undefined) p.value[k] = d[k]
  }
}

watch(mode, () => setDefaultParams(), { immediate: true })
watch(p, () => {
  shown.value = false
  requestAnimationFrame(() => { shown.value = true })
}, { deep: true })

const result = computed(() => {
  const m = mode.value
  if (m === 'kelly') {
    const wr = (p.value.winRate ?? 60) / 100
    const pl = p.value.plRatio ?? 2
    const kelly = (wr * pl - (1 - wr)) / pl
    const half = kelly * 0.5
    return {
      label: '凯利公式最优仓位',
      value: `${(kelly * 100).toFixed(1)}%`,
      sub: `半凯利（保守）: ${(half * 100).toFixed(1)}%`,
      detail: `(胜率 ${p.value.winRate}% × 盈亏比 ${pl} - 败率 ${(100 - p.value.winRate!)}%) / 盈亏比 ${pl}`
    }
  }
  if (m === 'position') {
    const capital = p.value.capital ?? 100000
    const risk = (p.value.riskPercent ?? 2) / 100
    const stop = (p.value.stopLossPercent ?? 7) / 100
    const pos = (capital * risk) / stop
    return {
      label: '建议仓位金额',
      value: `¥${pos.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`,
      sub: `占总资金 ${((pos / capital) * 100).toFixed(1)}%`,
      detail: `(资金 ${capital.toLocaleString()} × 风险 ${p.value.riskPercent}%) / 止损 ${p.value.stopLossPercent}%`
    }
  }
  if (m === 'riskreward') {
    const entry = p.value.entry ?? 35.2
    const target = p.value.target ?? 40
    const stop = p.value.stopLoss ?? 33
    const profit = target - entry
    const loss = entry - stop
    const ratio = profit / loss
    return {
      label: '风险回报比',
      value: `1 : ${ratio.toFixed(1)}`,
      sub: `潜在收益 ${((profit / entry) * 100).toFixed(1)}% / 潜在风险 ${((loss / entry) * 100).toFixed(1)}%`,
      detail: `(目标 ${target} - 入场 ${entry}) / (入场 ${entry} - 止损 ${stop})`
    }
  }
  if (m === 'volatility') {
    const base = p.value.basePosition ?? 15
    const std = p.value.stdVol ?? 30
    const cur = p.value.curVol ?? 45
    const adj = base * (std / cur)
    return {
      label: '波动率调整后仓位',
      value: `${(Math.min(adj, base * 1.5)).toFixed(1)}%`,
      sub: `基准仓位 ${base}% × (标准波动 ${std}% / 实际波动 ${cur}%)`,
      detail: adj > base * 1.5 ? '已封顶 1.5 倍放大' : '未触及放大上限'
    }
  }
  return { label: '', value: '', sub: '', detail: '' }
})

function slider(k: string, min: number, max: number, step = 1) {
  return {
    k,
    min,
    max,
    step,
    label: k,
    value: p.value[k] ?? min
  }
}

const sliders = computed(() => {
  const m = mode.value
  if (m === 'kelly') return [slider('winRate', 10, 90), slider('plRatio', 0.5, 5, 0.1)]
  if (m === 'position') return [slider('capital', 10000, 1000000, 10000), slider('riskPercent', 0.5, 5, 0.5), slider('stopLossPercent', 2, 15, 0.5)]
  if (m === 'riskreward') return [slider('entry', 10, 200, 0.1), slider('target', 10, 250, 0.1), slider('stopLoss', 5, 190, 0.1)]
  return [slider('basePosition', 5, 50), slider('stdVol', 10, 50), slider('curVol', 10, 80)]
})

function fmt(k: string): string {
  const labels: Record<string, string> = {
    winRate: '胜率 (%)', plRatio: '盈亏比', capital: '资金 (¥)',
    riskPercent: '单笔风险 (%)', stopLossPercent: '止损幅度 (%)',
    entry: '入场价', target: '目标价', stopLoss: '止损价',
    basePosition: '基准仓位 (%)', stdVol: '标准波动率 (%)', curVol: '实际波动率 (%)'
  }
  return labels[k] ?? k
}
</script>

<template>
  <div class="chart-container calc-explorer">
    <div class="demo-title">{{ title }}</div>
    <div class="calc-body">
      <div class="calc-inputs">
        <div v-for="s in sliders" :key="s.k" class="slider-row">
          <label>{{ fmt(s.k) }}: <strong>{{ s.value }}</strong></label>
          <input type="range" :min="s.min" :max="s.max" :step="s.step" v-model.number="p[s.k]" />
        </div>
        <div class="calc-mode">
          <button v-for="m in ['kelly','position','riskreward','volatility']" :key="m"
            :class="{ active: mode === m }" @click="mode = m as typeof mode">
            {{ { kelly: '凯利', position: '仓位', riskreward: '风报比', volatility: '波动率调整' }[m] }}
          </button>
        </div>
      </div>
      <div class="calc-output" :class="{ show: shown }">
        <div class="calc-value">{{ result.value }}</div>
        <div class="calc-label">{{ result.label }}</div>
        <div class="calc-sub">{{ result.sub }}</div>
        <div class="calc-detail">{{ result.detail }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calc-explorer { padding: 0; }
.demo-title { padding: 8px 12px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--vp-c-divider); }
.calc-body { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }
.calc-inputs { display: flex; flex-direction: column; gap: 10px; }
.slider-row { display: flex; flex-direction: column; gap: 4px; }
.slider-row label { font-size: 13px; }
.slider-row input { width: 100%; }
.calc-mode { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.calc-mode button { border: 1px solid var(--vp-c-divider); background: transparent; border-radius: 4px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
.calc-mode button.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.calc-output { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 6px; opacity: 0; transform: translateY(8px); transition: all 0.4s ease; }
.calc-output.show { opacity: 1; transform: translateY(0); }
.calc-value { font-size: 32px; font-weight: 700; color: var(--vp-c-brand-1); }
.calc-label { font-size: 14px; font-weight: 600; }
.calc-sub { font-size: 13px; color: var(--vp-c-text-2); }
.calc-detail { font-size: 12px; color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); }
</style>
