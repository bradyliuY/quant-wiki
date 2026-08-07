<script setup lang="ts">
/**
 * 资产定位图
 * 用散点把 6 类资产放在"流动性 × 波动性"与"杠杆 × 风险"两个坐标系里，
 * 直观回答：这些品种在哪个位置、杠杆到底放大了多少风险。
 *
 * 用法：
 * <AssetMap title="资产类别定位图" />
 */
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '资产类别定位图' }
)

type Asset = {
  name: string
  liquidity: number
  volatility: number
  leverage: number
  risk: number
  color: string
  note: string
}

/** 教学用典型值（示意），非实时行情 */
const ASSETS: Asset[] = [
  { name: '股票',   liquidity: 75, volatility: 50, leverage: 1,  risk: 20, color: '#1e5fd0', note: '所有权，看公司基本面与市场情绪' },
  { name: 'ETF',    liquidity: 80, volatility: 45, leverage: 1,  risk: 18, color: '#7c5cff', note: '一篮子资产，分散度高、成本低' },
  { name: '期货',   liquidity: 60, volatility: 65, leverage: 10, risk: 60, color: '#ff9800', note: '带保证金杠杆的标准化合约' },
  { name: '期权',   liquidity: 40, volatility: 75, leverage: 8,  risk: 70, color: '#e91e63', note: '非线性盈亏，波动与时间双敏感' },
  { name: '外汇',   liquidity: 90, volatility: 55, leverage: 50, risk: 85, color: '#00bcd4', note: '货币对，点差成本 + 高杠杆' },
  { name: '加密货币', liquidity: 50, volatility: 85, leverage: 30, risk: 90, color: '#ffc107', note: '7×24 无休，波动极端' }
]

const mode = ref<'liquidity' | 'leverage'>('liquidity')

// SVG 绘图区坐标（viewBox 0 0 560 400）
const PLOT = { x: 76, y: 24, w: 452, h: 300 }

function mapX(val: number): number {
  return PLOT.x + (val / 100) * PLOT.w
}
function mapY(val: number): number {
  return PLOT.y + PLOT.h - (val / 100) * PLOT.h
}
/** 杠杆用对数轴：log10(lev)/log10(100) → 0-100 */
function leveragePct(lev: number): number {
  return (Math.log10(lev + 1) / Math.log10(101)) * 100
}

const points = computed(() =>
  ASSETS.map((a) => {
    const x = mode.value === 'liquidity' ? a.liquidity : leveragePct(a.leverage)
    const y = mode.value === 'liquidity' ? a.volatility : a.risk
    return { ...a, px: mapX(x), py: mapY(y) }
  })
)

const axisLabel = computed(() =>
  mode.value === 'liquidity'
    ? { x: '流动性 →', y: '波动性 →' }
    : { x: '典型杠杆（对数）→', y: '风险敏感度 →' }
)

// 象限说明
const quadrants = computed(() =>
  mode.value === 'liquidity'
    ? [
        { x: PLOT.x + PLOT.w * 0.26, y: PLOT.y + 18, text: '高流动 · 高波动（主流交易品种）', color: '#26a69a' },
        { x: PLOT.x + PLOT.w * 0.26, y: PLOT.y + PLOT.h - 12, text: '高流动 · 低波动（稳健配置）', color: '#888' },
        { x: PLOT.x + PLOT.w * 0.72, y: PLOT.y + 18, text: '低流动 · 高波动（高风险小众）', color: '#ef5350' },
        { x: PLOT.x + PLOT.w * 0.72, y: PLOT.y + PLOT.h - 12, text: '低流动 · 低波动', color: '#888' }
      ]
    : [
        { x: PLOT.x + PLOT.w * 0.26, y: PLOT.y + 18, text: '高杠杆 · 高风险（爆仓风险区）', color: '#ef5350' },
        { x: PLOT.x + PLOT.w * 0.72, y: PLOT.y + 18, text: '高杠杆区', color: '#ff9800' },
        { x: PLOT.x + PLOT.w * 0.26, y: PLOT.y + PLOT.h - 12, text: '低杠杆 · 低风险（稳健）', color: '#26a69a' },
        { x: PLOT.x + PLOT.w * 0.72, y: PLOT.y + PLOT.h - 12, text: '低风险', color: '#888' }
      ]
)

const hovered = ref<Asset | null>(null)
const hoveredPt = computed(() => points.value.find((p) => p.name === hovered.value?.name) ?? null)

/** 判断文字颜色用：返回 0-1 的相对亮度 */
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// 网格刻度
const gridX = [0, 25, 50, 75, 100].map((v) => ({ pct: v, px: mapX(v) }))
const gridY = [0, 25, 50, 75, 100].map((v) => ({ pct: v, py: mapY(v) }))
</script>

<template>
  <div class="chart-container asset-map">
    <div class="am-head">
      <span class="demo-title">{{ title }}</span>
      <div class="am-tabs">
        <button :class="{ active: mode === 'liquidity' }" @click="mode = 'liquidity'">流动性 × 波动性</button>
        <button :class="{ active: mode === 'leverage' }" @click="mode = 'leverage'">杠杆 × 风险</button>
      </div>
    </div>

    <div class="am-map">
      <svg viewBox="0 0 560 400" role="img" aria-label="资产类别定位图">
        <!-- 网格线 -->
        <g class="am-grid">
          <line v-for="gx in gridX" :key="'x' + gx.pct" :x1="gx.px" :y1="PLOT.y" :x2="gx.px" :y2="PLOT.y + PLOT.h" />
          <line v-for="gy in gridY" :key="'y' + gy.pct" :x1="PLOT.x" :y1="gy.py" :x2="PLOT.x + PLOT.w" :y2="gy.py" />
        </g>
        <!-- 象限分隔中轴 -->
        <line :x1="PLOT.x + PLOT.w / 2" :y1="PLOT.y" :x2="PLOT.x + PLOT.w / 2" :y2="PLOT.y + PLOT.h" class="am-mid" />
        <line :x1="PLOT.x" :y1="PLOT.y + PLOT.h / 2" :x2="PLOT.x + PLOT.w" :y2="PLOT.y + PLOT.h / 2" class="am-mid" />
        <!-- 象限说明 -->
        <text v-for="(q, i) in quadrants" :key="i" :x="q.x" :y="q.y" class="am-quadrant" :fill="q.color" text-anchor="middle">{{ q.text }}</text>
        <!-- 轴标签 -->
        <text :x="PLOT.x + PLOT.w / 2" :y="400 - 6" class="am-axis" text-anchor="middle">{{ axisLabel.x }}</text>
        <text :x="14" :y="PLOT.y + PLOT.h / 2" class="am-axis" text-anchor="middle" transform="rotate(-90 14 180)">{{ axisLabel.y }}</text>
        <!-- 刻度值 -->
        <text v-for="gx in gridX" :key="'xl' + gx.pct" :x="gx.px" :y="PLOT.y + PLOT.h + 16" class="am-tick" text-anchor="middle">{{ gx.pct }}</text>
        <text v-for="gy in gridY" :key="'yl' + gy.pct" :x="PLOT.x - 10" :y="gy.py + 4" class="am-tick" text-anchor="end">{{ gy.pct }}</text>
        <!-- 散点 -->
        <g
          v-for="p in points"
          :key="p.name"
          class="am-dot"
          :class="{ dim: hovered && hovered.name !== p.name }"
          @mouseenter="hovered = p"
          @mouseleave="hovered = null"
        >
          <circle :cx="p.px" :cy="p.py" :r="hovered?.name === p.name ? 16 : 11" :fill="p.color" opacity="0.9" />
          <circle :cx="p.px" :cy="p.py" :r="hovered?.name === p.name ? 26 : 18" :fill="p.color" opacity="0.15" />
          <text :x="p.px" :y="p.py + 4" class="am-name" text-anchor="middle" :fill="luminance(p.color) > 0.6 ? '#000' : '#fff'">{{ p.name }}</text>
        </g>
      </svg>

      <!-- Tooltip -->
      <div
        v-if="hovered && hoveredPt"
        class="am-tooltip"
        :style="{ left: Math.min(hoveredPt.px / 560 * 100, 62) + '%', top: (hoveredPt.py / 400 * 100 - 4) + '%' }"
      >
        <div class="am-tip-name" :style="{ color: hovered.color }">{{ hovered.name }}</div>
        <div class="am-tip-line">流动性 <b>{{ hovered.liquidity }}</b> · 波动性 <b>{{ hovered.volatility }}</b></div>
        <div class="am-tip-line">典型杠杆 <b>{{ hovered.leverage }}×</b> · 风险敏感度 <b>{{ hovered.risk }}</b></div>
        <div class="am-tip-note">{{ hovered.note }}</div>
      </div>
    </div>

    <p class="am-hint">怎么看：{{ mode === 'liquidity' ? '横轴越右流动性越好（进出越容易），纵轴越上波动越大（单日振幅越凶）。' : '横轴是按对数缩放的杠杆倍数，纵轴是 1% 行情对账户的冲击——外汇/加密/期货的高杠杆会把 1% 波动放大成 20%-90% 的账户波动。' }}</p>
  </div>
</template>

<style scoped>
.asset-map { padding: 0 0 8px; }
.am-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px 4px;
}
.am-tabs { display: flex; gap: 6px; }
.am-tabs button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  padding: 5px 12px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}
.am-tabs button.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.am-map { position: relative; padding: 4px 16px 0; }
.am-map svg { width: 100%; height: auto; display: block; }
.am-grid line {
  stroke: var(--vp-c-divider);
  stroke-width: 1;
}
.am-mid { stroke: var(--vp-c-divider); stroke-width: 1; stroke-dasharray: 4 4; }
.am-quadrant { font-size: 11px; opacity: 0.75; }
.am-axis { font-size: 12px; fill: var(--vp-c-text-2); font-weight: 600; }
.am-tick { font-size: 10px; fill: var(--vp-c-text-3); }
.am-dot { cursor: pointer; transition: opacity 0.2s; }
.am-dot.dim { opacity: 0.3; }
.am-dot circle { transition: r 0.2s; }
.am-name { font-size: 12px; font-weight: 700; }
.am-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  padding: 8px 12px;
  min-width: 190px;
  z-index: 5;
  pointer-events: none;
}
.dark .am-tooltip { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5); }
.am-tip-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
.am-tip-line { font-size: 12px; color: var(--vp-c-text-2); line-height: 1.6; }
.am-tip-line b { color: var(--vp-c-text-1); font-variant-numeric: tabular-nums; }
.am-tip-note { font-size: 11px; color: var(--vp-c-text-3); margin-top: 4px; }
.am-hint {
  margin: 8px 16px 0;
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  background: var(--vp-c-brand-soft);
  border-radius: 6px;
  padding: 8px 12px;
}
</style>
