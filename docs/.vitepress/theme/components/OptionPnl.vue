<script setup lang="ts">
/**
 * 期权到期盈亏图组件
 * 用 SVG 绘制四种基础头寸（Long/Short Call/Put）的到期损益曲线，
 * 标出最大损失/收益、盈亏平衡点，参数可调。
 * 让"期权损益"这种文字讲不透的非线性结构一眼看懂。
 */
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    strike?: number
    premium?: number
    title?: string
  }>(),
  { strike: 100, premium: 5, title: '期权到期盈亏图' }
)

const position = ref<'long-call' | 'short-call' | 'long-put' | 'short-put'>('long-call')
const strike = ref(props.strike)
const premium = ref(props.premium)

// 图表尺寸（视口 0-100 价格轴 → SVG 坐标）
const W = 620
const H = 380
const PAD = { l: 56, r: 16, t: 20, b: 44 }
const plotW = W - PAD.l - PAD.r
const plotH = H - PAD.t - PAD.b

// 价格显示范围：围绕行权价 ±30%
const lo = computed(() => strike.value * 0.7)
const hi = computed(() => strike.value * 1.3)

// 价格 → x 坐标
function xOf(price: number) {
  return PAD.l + ((price - lo.value) / (hi.value - lo.value)) * plotW
}
// 盈亏 → y 坐标
function yOf(pnl: number) {
  // pnl 范围 -premium*2 ~ premium*3
  const maxPnl = premium.value * 3
  const minPnl = -premium.value * 2
  return PAD.t + (1 - (pnl - minPnl) / (maxPnl - minPnl)) * plotH
}

// 四种头寸的到期损益函数
const POSITIONS = {
  'long-call': {
    name: '买入看涨 Long Call',
    color: '#26a69a',
    pnl: (s: number) => Math.max(-premium.value, s - strike.value - premium.value),
    breakeven: () => strike.value + premium.value,
    maxLoss: () => -premium.value,
    maxGain: () => Infinity,
    desc: '最多亏权利金，收益理论上无限'
  },
  'short-call': {
    name: '卖出看涨 Short Call',
    color: '#ef5350',
    pnl: (s: number) => Math.min(premium.value, strike.value + premium.value - s),
    breakeven: () => strike.value + premium.value,
    maxLoss: () => -Infinity,
    maxGain: () => premium.value,
    desc: '最多赚权利金，亏损理论上无限'
  },
  'long-put': {
    name: '买入看跌 Long Put',
    color: '#26a69a',
    pnl: (s: number) => Math.max(-premium.value, strike.value - s - premium.value),
    breakeven: () => strike.value - premium.value,
    maxLoss: () => -premium.value,
    maxGain: () => strike.value - premium.value, // 标的价格跌到 0
    desc: '最多亏权利金，标价跌到 0 时收益封顶'
  },
  'short-put': {
    name: '卖出看跌 Short Put',
    color: '#ef5350',
    pnl: (s: number) => Math.min(premium.value, s - strike.value + premium.value),
    breakeven: () => strike.value - premium.value,
    maxLoss: () => strike.value - premium.value,
    maxGain: () => premium.value,
    desc: '最多赚权利金，标价跌到 0 时亏损封顶'
  }
} as const

const pos = computed(() => POSITIONS[position.value])

// 曲线采样（分段线性折线）
const curvePath = computed(() => {
  const pts: [number, number][] = []
  const steps = 120
  for (let i = 0; i <= steps; i++) {
    const s = lo.value + ((hi.value - lo.value) * i) / steps
    const y = yOf(pos.value.pnl(s))
    // 收益无限的头寸：y 会被推到顶部/底部，夹住避免出界
    pts.push([xOf(s), Math.max(8, Math.min(H - 8, y))])
  }
  return pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
})

// 盈亏平衡点
const be = computed(() => pos.value.breakeven())

// 当前头寸的关键标注
const labels = computed(() => {
  const maxLoss = pos.value.maxLoss()
  const maxGain = pos.value.maxGain()
  const rows: { k: string; v: string }[] = []
  rows.push({ k: '最大亏损', v: maxLoss === -Infinity ? '无限' : `${maxLoss.toFixed(1)}` })
  rows.push({ k: '最大收益', v: maxGain === Infinity ? '无限' : `${maxGain.toFixed(1)}` })
  rows.push({ k: '盈亏平衡', v: `${be.value.toFixed(1)}` })
  return rows
})

// 网格线（价格刻度）
const grid = computed(() => {
  const lines: { x: number; label: string }[] = []
  for (let s = Math.ceil(lo.value / 5) * 5; s <= hi.value; s += Math.ceil((hi.value - lo.value) / 8 / 5) * 5) {
    lines.push({ x: xOf(s), label: `${s}` })
  }
  return lines
})
</script>

<template>
  <div class="chart-container option-pnl">
    <div v-if="title" class="demo-title">{{ title }}</div>

    <div class="pnl-body">
      <svg :viewBox="`0 0 ${W} ${H}`" class="pnl-svg" preserveAspectRatio="xMidYMid meet">
        <!-- 网格 -->
        <g v-for="g in grid" :key="g.x">
          <line :x1="g.x" :y1="PAD.t" :x2="g.x" :y2="H - PAD.b" class="grid-line" />
          <text :x="g.x" :y="H - PAD.b + 16" class="grid-label" text-anchor="middle">{{ g.label }}</text>
        </g>
        <!-- 零盈亏线 -->
        <line :x1="PAD.l" :y1="yOf(0)" :x2="W - PAD.r" :y2="yOf(0)" class="zero-line" />
        <text :x="PAD.l - 6" :y="yOf(0) - 6" class="zero-label" text-anchor="end">0</text>
        <!-- 盈亏平衡点竖线 -->
        <line :x1="xOf(be)" :y1="PAD.t" :x2="xOf(be)" :y2="H - PAD.b" class="be-line" />
        <text :x="xOf(be)" :y="PAD.t + 14" class="be-label" text-anchor="middle">盈亏平衡 {{ be.toFixed(1) }}</text>
        <!-- 行权价竖线 -->
        <line :x1="xOf(strike)" :y1="PAD.t" :x2="xOf(strike)" :y2="H - PAD.b" class="strike-line" />
        <text :x="xOf(strike)" :y="PAD.t + 32" class="strike-label" text-anchor="middle">行权价 {{ strike }}</text>
        <!-- 损益曲线 -->
        <path :d="curvePath" fill="none" :stroke="pos.color" stroke-width="3" />
        <!-- 盈亏平衡点 -->
        <circle :cx="xOf(be)" :cy="yOf(0)" r="5" fill="#fff" :stroke="pos.color" stroke-width="2" />
        <!-- 行权价点 -->
        <circle :cx="xOf(strike)" :cy="yOf(pos.pnl(strike))" r="4" :fill="pos.color" />
      </svg>

      <div class="pnl-side">
        <div class="pnl-position-name" :style="{ color: pos.color }">{{ pos.name }}</div>
        <div class="pnl-desc">{{ pos.desc }}</div>

        <div class="pnl-controls">
          <label class="pnl-slider">
            <span>行权价 K</span>
            <input type="range" min="80" max="120" :value="strike" @input="(e) => (strike = Number((e.target as HTMLInputElement).value))" />
            <span class="pnl-val">{{ strike }}</span>
          </label>
          <label class="pnl-slider">
            <span>权利金 P</span>
            <input type="range" min="1" max="10" :value="premium" @input="(e) => (premium = Number((e.target as HTMLInputElement).value))" />
            <span class="pnl-val">{{ premium }}</span>
          </label>
        </div>

        <div class="pnl-metrics">
          <div v-for="l in labels" :key="l.k" class="pnl-metric">
            <span class="pnl-metric-key">{{ l.k }}</span>
            <span class="pnl-metric-val">{{ l.v }}</span>
          </div>
        </div>

        <div class="pnl-tabs">
          <button v-for="(v, key) in POSITIONS" :key="key" class="pnl-tab" :class="{ active: position === key }" @click="position = key as typeof position">
            {{ v.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pnl-body {
  display: flex;
  gap: 16px;
  padding: 14px;
  flex-wrap: wrap;
}
.pnl-svg {
  flex: 1 1 420px;
  min-width: 300px;
  background: #fff;
  border-radius: 6px;
}
.dark .pnl-svg { background: #1e1e1e; }
.grid-line { stroke: rgba(0, 0, 0, 0.06); stroke-dasharray: 3 3; }
.dark .grid-line { stroke: rgba(255, 255, 255, 0.08); }
.grid-label { fill: #999; font-size: 11px; }
.zero-line { stroke: #bbb; stroke-width: 1.5; }
.dark .zero-line { stroke: #666; }
.zero-label { fill: #888; font-size: 12px; }
.be-line { stroke: #f59e0b; stroke-width: 1; stroke-dasharray: 5 4; }
.be-label { fill: #d97706; font-size: 11px; font-weight: 600; }
.strike-line { stroke: #94a3b8; stroke-width: 1; stroke-dasharray: 3 4; }
.strike-label { fill: #94a3b8; font-size: 11px; }

.pnl-side {
  flex: 0 1 260px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pnl-position-name {
  font-size: 15px;
  font-weight: 700;
}
.pnl-desc { font-size: 13px; color: var(--vp-c-text-2); }
.pnl-slider {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
}
.pnl-slider input { flex: 1; }
.pnl-val {
  min-width: 32px;
  text-align: right;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}
.pnl-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 6px;
  padding: 10px;
}
.pnl-metric {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.pnl-metric-key { color: #888; }
.pnl-metric-val { font-weight: 600; font-variant-numeric: tabular-nums; }
.pnl-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pnl-tab {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.pnl-tab.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.pnl-tab:hover { border-color: var(--vp-c-brand-1); }
</style>
