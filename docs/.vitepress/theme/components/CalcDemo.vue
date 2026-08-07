<script setup lang="ts">
/**
 * 指标计算演示组件
 * 用一段示例价格序列，通过滑动窗口逐步展示 SMA / EMA / RSI / 布林带 的计算过程。
 * 教学用途：读者可跟随每一步，验证结果。
 *
 * 用法：
 * <CalcDemo indicator="sma" period="5" title="MA5 计算演示" />
 */
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    indicator?: 'sma' | 'ema' | 'rsi' | 'boll'
    period?: number
    title?: string
  }>(),
  { indicator: 'sma', period: 5, title: '指标计算演示' }
)

/** 示例收盘价序列（教学用合成数据，非真实行情） */
const PRICES = [100, 101.5, 102.3, 101.8, 103.2, 104.5, 103.9, 105.1, 106.8, 105.9, 107.2, 108.5, 109.1, 108.4, 110.2]
const DAYS = PRICES.length

const cursor = ref(props.period) // 当前计算的最后一天索引
const playing = ref(false)
const speed = ref(1)
let timer: ReturnType<typeof setInterval> | null = null

// 窗口（用于 SMA / 布林带）：含 cursor 在内的最近 period 天
const windowStart = computed(() => Math.max(0, cursor.value - props.period + 1))
const windowData = computed(() => PRICES.slice(windowStart.value, cursor.value + 1))

/** 计算 SMA */
function calcSMA(idx: number): number {
  const start = Math.max(0, idx - props.period + 1)
  const slice = PRICES.slice(start, idx + 1)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/** 计算 EMA（指数平滑） */
function calcEMA(idx: number): number {
  const alpha = 2 / (props.period + 1)
  // 首个值用 SMA 做种子
  let ema = PRICES.slice(0, props.period).reduce((a, b) => a + b, 0) / props.period
  for (let i = props.period; i <= idx; i++) {
    ema = alpha * PRICES[i] + (1 - alpha) * ema
  }
  return ema
}

/** 计算 RSI(14) 的涨跌均值 */
function calcRSI(idx: number): number {
  if (idx < 2) return 50
  const slice = PRICES.slice(0, idx + 1)
  let gains = 0
  let losses = 0
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1]
    if (diff >= 0) gains += diff
    else losses += -diff
  }
  const avgGain = gains / (slice.length - 1)
  const avgLoss = losses / (slice.length - 1)
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** 布林带：中轨 + 上下轨 */
function calcBoll(idx: number) {
  const slice = PRICES.slice(windowStart.value, idx + 1)
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length
  const sd = Math.sqrt(variance)
  return { mid: mean, upper: mean + 2 * sd, lower: mean - 2 * sd }
}

/** 当前结果的展示 */
const result = computed(() => {
  const idx = cursor.value
  const start = Math.max(0, idx - props.period + 1)
  const slice = PRICES.slice(start, idx + 1)
  const sum = slice.reduce((a, b) => a + b, 0)

  switch (props.indicator) {
    case 'sma': {
      const v = calcSMA(idx)
      return {
        formula: `MA${props.period} = (${slice.map((n) => n.toFixed(1)).join(' + ')}) / ${slice.length}`,
        detail: `窗口内 ${slice.length} 天收盘价之和 ${sum.toFixed(1)} ÷ ${slice.length} = ${v.toFixed(2)}`,
        value: v
      }
    }
    case 'ema': {
      const v = calcEMA(idx)
      const alpha = 2 / (props.period + 1)
      return {
        formula: `EMA = α×C(t) + (1−α)×EMA(t−1)，α = 2/(n+1) = ${alpha.toFixed(4)}`,
        detail: `第 ${idx + 1} 天 EMA = ${v.toFixed(2)}（从首 ${props.period} 天 SMA 种子递推）`,
        value: v
      }
    }
    case 'rsi': {
      const v = calcRSI(idx)
      return {
        formula: `RSI = 100 − 100/(1 + RS)，RS = 平均涨幅/平均跌幅`,
        detail: `第 ${idx + 1} 天 RSI ≈ ${v.toFixed(1)}（50 上=多头，50 下=空头）`,
        value: v
      }
    }
    case 'boll': {
      const b = calcBoll(idx)
      return {
        formula: `中轨 = SMA${props.period}，上/下轨 = 中轨 ± 2×σ`,
        detail: `中轨 ${b.mid.toFixed(2)}，上轨 ${b.upper.toFixed(2)}，下轨 ${b.lower.toFixed(2)}`,
        value: b.mid
      }
    }
  }
})

const progress = computed(() => (cursor.value - props.period) / (DAYS - props.period))

function step() {
  if (cursor.value < DAYS - 1) cursor.value++
  else stop()
}

function togglePlay() {
  if (playing.value) stop()
  else {
    playing.value = true
    timer = setInterval(() => {
      if (cursor.value >= DAYS - 1) stop()
      else cursor.value++
    }, 900 / speed.value)
  }
}

function stop() {
  playing.value = false
  if (timer) clearInterval(timer)
  timer = null
}

function reset() {
  stop()
  cursor.value = props.period
}

watch(() => props.indicator, reset)
watch(() => props.period, reset)
</script>

<template>
  <div class="chart-container calc-demo">
    <div v-if="title" class="demo-title">{{ title }}</div>

    <!-- 示例数据 + 滑动窗口 -->
    <div class="calc-zone">
      <div class="calc-labels">
        <span class="calc-hint">下方为示例收盘价序列（教学用合成数据）</span>
        <span class="calc-day">第 {{ cursor + 1 }} 天 · 窗口 [{{ windowStart + 1 }}–{{ cursor + 1 }}]</span>
      </div>
      <div class="price-bars">
        <div
          v-for="(p, i) in PRICES"
          :key="i"
          class="price-cell"
          :class="{
            'in-window': i >= windowStart && i <= cursor,
            'is-last': i === cursor
          }"
        >
          <div class="price-val">{{ p.toFixed(1) }}</div>
          <div class="price-day">D{{ i + 1 }}</div>
        </div>
      </div>
      <div v-if="windowData.length" class="window-bar">
        <div class="window-label">当前计算窗口</div>
        <div class="window-values">
          <span v-for="(w, i) in windowData" :key="i" class="window-item">{{ w.toFixed(1) }}</span>
        </div>
      </div>
    </div>

    <!-- 计算过程 -->
    <div class="calc-process">
      <div class="calc-formula">{{ result.formula }}</div>
      <div class="calc-detail">{{ result.detail }}</div>
      <div class="calc-result">
        <span class="result-label">{{ indicator.toUpperCase() }} 当前值</span>
        <span class="result-value">{{ result.value.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 进度 + 控制 -->
    <div class="demo-controls">
      <button @click="togglePlay">{{ playing ? '⏸ 暂停' : '▶ 自动播放' }}</button>
      <button @click="step">⏭ 下一步</button>
      <button @click="reset">↺ 重置</button>
      <input
        type="range"
        min="0"
        max="100"
        :value="progress * 100"
        @input="(e) => { const v = Number((e.target as HTMLInputElement).value); cursor.value = Math.round(props.period + (DAYS - props.period) * v / 100) }"
        style="flex: 1"
      />
      <select :value="speed" @change="(e) => { speed.value = Number((e.target as HTMLSelectElement).value) }">
        <option :value="0.5">0.5x</option>
        <option :value="1">1x</option>
        <option :value="2">2x</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.calc-demo {
  padding: 0 0 8px;
}
.calc-zone {
  padding: 14px 16px 10px;
}
.calc-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}
.calc-hint { color: #999; }
.calc-day {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.price-bars {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.price-cell {
  min-width: 52px;
  padding: 6px 4px;
  text-align: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 12px;
  background: transparent;
  transition: all 0.3s;
}
.price-val { font-weight: 600; font-variant-numeric: tabular-nums; }
.price-day { color: #999; font-size: 11px; margin-top: 2px; }
.price-cell.in-window {
  background: rgba(30, 95, 208, 0.08);
  border-color: var(--vp-c-brand-1);
}
.price-cell.is-last {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.price-cell.is-last .price-val { color: #fff; }
.price-cell.is-last .price-day { color: rgba(255,255,255,0.7); }

.window-bar {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(30, 95, 208, 0.05);
  border-radius: 6px;
  border: 1px dashed var(--vp-c-brand-1);
}
.window-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.window-values { display: flex; gap: 6px; flex-wrap: wrap; }
.window-item {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 2px 8px;
  background: #fff;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
.dark .window-item { background: #1e1e1e; }

.calc-process {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
  background: rgba(30, 95, 208, 0.03);
}
.calc-formula {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-brand-1);
  margin-bottom: 6px;
  overflow-wrap: break-word;
}
.calc-detail {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
}
.calc-result {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.result-label { font-size: 12px; color: #888; }
.result-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-brand-1);
}
</style>
