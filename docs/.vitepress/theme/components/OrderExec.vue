<script setup lang="ts">
/**
 * 委托执行可视化组件
 * 在价格轴上演示市价单 / 限价单 / 止损单 / 止损限价单 的执行逻辑：
 * - 市价单：立即以当前价成交（蓝色箭头直达）
 * - 限价单：价格跌到限价才成交（价格线动画 + 成交标记）
 * - 止损单：价格跌到止损价触发市价单（红色触发点）
 * 用一段模拟价格走势动画展示，让委托类型差异一目了然。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '委托类型执行演示' }
)

// 模拟价格路径（一波下行 → 回升，让不同委托产生不同结果）
const PRICE_PATH = [100, 99, 98.5, 97, 96, 95, 94, 93.5, 93, 92.5, 93, 94, 95, 96, 97, 98]
const DAYS = PRICE_PATH.length

const mode = ref<'market' | 'limit' | 'stop'>('market')
// 限价 / 止损 参数
const limitPrice = ref(94)
const stopPrice = ref(95)

// 动画进度：当前价格索引（含小数）
const progress = ref(0)
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const priceIndex = computed(() => Math.min(DAYS - 1, Math.floor(progress.value)))

// 执行状态
const filled = ref(false)
const fillIndex = ref(-1)

// 当前价格
const curPrice = computed(() => PRICE_PATH[priceIndex.value])

// 图表几何
const W = 620
const H = 300
const PAD = { l: 50, r: 16, t: 20, b: 40 }
const plotW = W - PAD.l - PAD.r
const plotH = H - PAD.t - PAD.b

const priceLo = 90
const priceHi = 102

function xOf(i: number) {
  return PAD.l + (i / (DAYS - 1)) * plotW
}
function yOf(p: number) {
  return PAD.t + (1 - (p - priceLo) / (priceHi - priceLo)) * plotH
}

// 价格曲线 path
const pricePath = computed(() =>
  PRICE_PATH.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p)}`).join(' ')
)

// 限价线 / 止损线的 y
const limitY = computed(() => yOf(limitPrice.value))
const stopY = computed(() => yOf(stopPrice.value))

// 检测当前模式下的成交
function checkFill() {
  const idx = priceIndex.value
  if (mode.value === 'market') {
    // 市价单立即成交
    if (idx >= 1 && !filled.value) {
      filled.value = true
      fillIndex.value = 1
    }
  } else if (mode.value === 'limit') {
    // 限价单：价格 ≤ 限价时成交
    if (!filled.value && curPrice.value <= limitPrice.value) {
      filled.value = true
      fillIndex.value = idx
    }
  } else if (mode.value === 'stop') {
    // 止损单：价格 ≤ 止损价触发
    if (!filled.value && curPrice.value <= stopPrice.value) {
      filled.value = true
      fillIndex.value = idx
    }
  }
}

function advance() {
  if (progress.value >= DAYS - 1) {
    stop()
    return
  }
  progress.value += 1
  checkFill()
}

function togglePlay() {
  if (playing.value) stop()
  else {
    playing.value = true
    timer = setInterval(advance, 500)
  }
}
function stop() {
  playing.value = false
  if (timer) clearInterval(timer)
  timer = null
}
function reset() {
  stop()
  progress.value = 0
  filled.value = false
  fillIndex.value = -1
}

function switchMode(m: typeof mode.value) {
  mode.value = m
  reset()
}

// 结果说明
const resultText = computed(() => {
  if (!filled.value) return '⏳ 尚未成交（价格未触及条件）'
  const idx = fillIndex.value
  const fillPrice = PRICE_PATH[idx]
  if (mode.value === 'market') return `✅ 市价单立即以 ≈${fillPrice} 成交（第 ${idx + 1} 步）`
  if (mode.value === 'limit') return `✅ 限价单在价格跌至 ${fillPrice} ≤ 限价 ${limitPrice.value} 时成交（第 ${idx + 1} 步）`
  return `✅ 止损单在价格跌至 ${fillPrice} ≤ 止损 ${stopPrice.value} 时触发（第 ${idx + 1} 步）`
})

const resultColor = computed(() => (filled.value ? '#26a69a' : '#888'))

onMounted(() => {
  progress.value = 1
  checkFill()
})
onBeforeUnmount(stop)
</script>

<template>
  <div class="chart-container order-exec">
    <div v-if="title" class="demo-title">{{ title }}</div>

    <div class="oe-tabs">
      <button v-for="m in [['market', '市价单'], ['limit', '限价单'], ['stop', '止损单']] as const" :key="m[0]" class="oe-tab" :class="{ active: mode === m[0] }" @click="switchMode(m[0])">
        {{ m[1] }}
      </button>
    </div>

    <div class="oe-body">
      <svg :viewBox="`0 0 ${W} ${H}`" class="oe-svg" preserveAspectRatio="xMidYMid meet">
        <!-- 网格价格刻度 -->
        <g v-for="p in [92, 94, 96, 98, 100]" :key="p">
          <line :x1="PAD.l" :y1="yOf(p)" :x2="W - PAD.r" :y2="yOf(p)" class="grid-line" />
          <text :x="PAD.l - 6" :y="yOf(p) + 4" class="grid-label" text-anchor="end">{{ p }}</text>
        </g>
        <!-- 限价线 -->
        <line v-if="mode === 'limit'" :x1="PAD.l" :y1="limitY" :x2="W - PAD.r" :y2="limitY" class="order-line limit" />
        <text v-if="mode === 'limit'" :x="W - PAD.r - 4" :y="limitY - 6" class="order-label limit" text-anchor="end">限价 {{ limitPrice }}</text>
        <!-- 止损线 -->
        <line v-if="mode === 'stop'" :x1="PAD.l" :y1="stopY" :x2="W - PAD.r" :y2="stopY" class="order-line stop" />
        <text v-if="mode === 'stop'" :x="W - PAD.r - 4" :y="stopY - 6" class="order-label stop" text-anchor="end">止损 {{ stopPrice }}</text>

        <!-- 价格路径 -->
        <path :d="pricePath" fill="none" stroke="#1e5fd0" stroke-width="2.5" />

        <!-- 已走过的部分高亮 -->
        <path
          v-if="progress > 1"
          :d="PRICE_PATH.slice(0, priceIndex + 1).map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p)}`).join(' ')"
          fill="none"
          stroke="#1e5fd0"
          stroke-width="2.5"
          opacity="0.3"
        />

        <!-- 当前点 -->
        <circle :cx="xOf(priceIndex)" :cy="yOf(curPrice)" r="6" fill="#1e5fd0" stroke="#fff" stroke-width="2" />
        <text :x="xOf(priceIndex)" :y="yOf(curPrice) - 14" class="price-tag" text-anchor="middle">{{ curPrice.toFixed(1) }}</text>

        <!-- 成交标记 -->
        <g v-if="filled" :transform="`translate(${xOf(fillIndex)}, ${yOf(PRICE_PATH[fillIndex])})`">
          <circle r="10" fill="#26a69a" opacity="0.25" />
          <circle r="6" fill="#26a69a" />
          <text y="-14" class="fill-tag" text-anchor="middle">成交</text>
        </g>
      </svg>

      <div class="oe-info">
        <div class="oe-result" :style="{ color: resultColor }">{{ resultText }}</div>
        <div class="oe-controls">
          <button @click="togglePlay">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
          <button @click="reset">↺ 重置</button>
          <input type="range" min="1" max="100" :value="(progress / (DAYS - 1)) * 100" @input="(e) => { progress = Number((e.target as HTMLInputElement).value) / 100 * (DAYS - 1); filled = false; checkFill() }" style="flex: 1" />
        </div>
        <div v-if="mode === 'limit'" class="oe-param">
          <span>限价</span>
          <input type="range" min="92" max="99" :value="limitPrice" @input="(e) => (limitPrice = Number((e.target as HTMLInputElement).value))" />
          <span class="oe-param-val">{{ limitPrice }}</span>
        </div>
        <div v-if="mode === 'stop'" class="oe-param">
          <span>止损</span>
          <input type="range" min="92" max="99" :value="stopPrice" @input="(e) => (stopPrice = Number((e.target as HTMLInputElement).value))" />
          <span class="oe-param-val">{{ stopPrice }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.oe-tabs {
  display: flex;
  gap: 6px;
  padding: 10px 12px 0;
}
.oe-tab {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.oe-tab.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.oe-body {
  display: flex;
  gap: 14px;
  padding: 12px;
  flex-wrap: wrap;
}
.oe-svg {
  flex: 1 1 420px;
  min-width: 300px;
  background: #fff;
  border-radius: 6px;
}
.dark .oe-svg { background: #1e1e1e; }
.grid-line { stroke: rgba(0, 0, 0, 0.06); stroke-dasharray: 3 3; }
.dark .grid-line { stroke: rgba(255, 255, 255, 0.08); }
.grid-label { fill: #999; font-size: 11px; }
.order-line.limit { stroke: #f59e0b; stroke-width: 1.5; stroke-dasharray: 6 4; }
.order-label.limit { fill: #d97706; font-size: 11px; font-weight: 600; }
.order-line.stop { stroke: #ef5350; stroke-width: 1.5; stroke-dasharray: 6 4; }
.order-label.stop { fill: #e53935; font-size: 11px; font-weight: 600; }
.price-tag { fill: #1e5fd0; font-size: 12px; font-weight: 700; }
.fill-tag { fill: #26a69a; font-size: 12px; font-weight: 700; }

.oe-info {
  flex: 0 1 240px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.oe-result {
  font-size: 13px;
  font-weight: 600;
  min-height: 40px;
}
.oe-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}
.oe-controls button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--vp-c-text-1);
}
.oe-controls button:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.oe-param {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
}
.oe-param input { flex: 1; }
.oe-param-val {
  min-width: 30px;
  text-align: right;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
</style>
