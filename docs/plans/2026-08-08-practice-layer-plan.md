# 动手实践层（实战板块）实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐动手实践层——新增顶层「实战」板块（含浏览器内交互式回测组件 BacktestLab）、方法论「统计与概率基础」子板块，让新手从"看得懂"到"做得出来"。

**Architecture:** 数据层新增 `lib/backtest.ts`（合成回测数据集 + 回测引擎纯函数 + 参数扫描），主题层新增 `BacktestLab.vue`（复用 `createSeriesMarkers` v5 插件、`toggleExpand` 放大、`lib/charts` 图表配色），内容层新增 5 个实战页 + 4 个统计页，`config.ts` 注册导航与侧边栏。回测引擎遵循站点自己的回测方法论：信号收盘后产生、次根 bar 开盘成交、ATR(2) 止损、单笔风险仓位。

**Tech Stack:** VitePress 1.6、Vue 3、lightweight-charts v5（`addSeries` 具名导入、`createSeriesMarkers` 标注插件）、`"type": "module"`。

**验证（本仓库无测试套件，遵循 CLAUDE.md 强制流程）：**
1. `npm run docs:build` 通过
2. `node scripts/check-links.mjs` 输出 0 死链
3. `npm run docs:preview -- --port 4173` + Edge headless 截图：`/practice/backtest-lab` 拖参数后指标卡/净值曲线/交易表变化、CDP 抓 `Runtime.exceptionThrown` 无 JS 错误、两个 chart 容器内 canvas 真实渲染

**提交规范：** Conventional Commits，`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

**顺序依赖：** 页面要先于侧边栏配置创建（`check-links` 需 0 死链），故 config.ts 放在统计页之后。

---

## Task 1: lib/backtest.ts — 回测引擎纯函数库

**Files:**
- Create: `docs/.vitepress/theme/lib/backtest.ts`

**Step 1: 创建文件**

```ts
/**
 * 回测引擎纯函数库
 * 输入合成 OHLC + 策略参数，输出交易列表 / 净值曲线 / 绩效指标
 * 与 lib/indicators.ts 同风格，供 BacktestLab 组件复用
 */
import { calcATR, calcBollinger, calcSMA, type OHLC } from './indicators'

export type StrategyKey = 'ma-cross' | 'bollinger'

export interface BacktestParams {
  /** 双均线：快线周期 */
  fast: number
  /** 双均线：慢线周期 */
  slow: number
  /** 布林：周期 */
  period: number
  /** 布林：标准差倍数 */
  mult: number
  /** 单笔风险 %（占总资金） */
  riskPct: number
}

export interface Trade {
  entryTime: number
  entryPrice: number
  exitTime: number
  exitPrice: number
  /** 单笔收益率 %（相对入场价） */
  pnlPct: number
  /** 对净值贡献（起始资金 = 1 时即净值增量） */
  pnl: number
}

export interface BacktestResult {
  trades: Trade[]
  /** 净值曲线（按日 mark-to-market） */
  equity: { time: number; value: number }[]
  markers: { time: number; side: 'buy' | 'sell' }[]
  metrics: {
    annualReturn: number
    maxDrawdown: number
    winRate: number
    profitFactor: number
    tradeCount: number
  }
}

/** 策略元信息：给 UI 渲染参数滑块 */
export const STRATEGIES: Record<
  StrategyKey,
  {
    name: string
    params: {
      key: keyof BacktestParams
      label: string
      min: number
      max: number
      step: number
      def: number
    }[]
  }
> = {
  'ma-cross': {
    name: '双均线交叉',
    params: [
      { key: 'fast', label: '快线周期', min: 3, max: 30, step: 1, def: 5 },
      { key: 'slow', label: '慢线周期', min: 10, max: 80, step: 1, def: 20 },
      { key: 'riskPct', label: '单笔风险 %', min: 0.5, max: 5, step: 0.5, def: 2 }
    ]
  },
  bollinger: {
    name: '布林带回归',
    params: [
      { key: 'period', label: '周期', min: 10, max: 40, step: 1, def: 20 },
      { key: 'mult', label: '标准差倍数', min: 1.5, max: 3, step: 0.1, def: 2 },
      { key: 'riskPct', label: '单笔风险 %', min: 0.5, max: 5, step: 0.5, def: 2 }
    ]
  }
}

/**
 * 生成带趋势段/震荡段的合成回测数据（纯教学用，非真实行情）
 * 4 段行情：震荡 → 上升 → 震荡 → 下降，让趋势/回归策略各有胜负场景
 */
export function genBacktestData(n = 300, seed = 7): OHLC[] {
  let s = seed
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  const out: OHLC[] = []
  let price = 100
  const base = Date.now() / 1000
  const day = 86400
  for (let i = 0; i < n; i++) {
    let drift: number
    let wave: number
    if (i < 75) {
      drift = (100 - price) * 0.06 // 震荡（拉回 100）
      wave = Math.sin(i / 5) * 2.2
    } else if (i < 150) {
      drift = 0.38 // 上升趋势
      wave = Math.sin(i / 9) * 0.7
    } else if (i < 225) {
      drift = (100 - price) * 0.06 // 震荡
      wave = Math.sin(i / 5) * 2.2
    } else {
      drift = -0.38 // 下降趋势
      wave = Math.sin(i / 9) * 0.7
    }
    const gap = (rand() - 0.5) * 6
    const open = price
    const close = open + drift + wave + gap * 0.4
    const high = Math.max(open, close) + rand() * 1.6
    const low = Math.min(open, close) - rand() * 1.6
    const volume = Math.round(100000 + rand() * 900000)
    out.push({
      time: base - (n - i) * day,
      open,
      high,
      low,
      close,
      volume
    })
    price = close
  }
  return out
}

function closeTrade(
  trades: Trade[],
  position: { entryTime: number; entryPrice: number; shares: number },
  exitPrice: number,
  exitTime: number
) {
  const pnl = position.shares * (exitPrice - position.entryPrice)
  trades.push({
    entryTime: position.entryTime,
    entryPrice: position.entryPrice,
    exitTime,
    exitPrice,
    pnlPct: ((exitPrice - position.entryPrice) / position.entryPrice) * 100,
    pnl
  })
}

/**
 * 运行一次回测
 * 信号在 bar 收盘后产生、次根 bar 开盘成交（避免前视）；ATR(2) 止损；单笔风险仓位
 */
export function runBacktest(
  bars: OHLC[],
  strategy: StrategyKey,
  params: BacktestParams
): BacktestResult {
  const closes = bars.map((b) => b.close)
  const atrArr = calcATR(bars, 14)
  const fastArr = calcSMA(closes, params.fast)
  const slowArr = calcSMA(closes, params.slow)
  const boll = calcBollinger(closes, params.period, params.mult)

  const trades: Trade[] = []
  const markers: { time: number; side: 'buy' | 'sell' }[] = []
  const equityByBar: (number | null)[] = bars.map(() => null)

  let cash = 1
  let position: { entryTime: number; entryPrice: number; shares: number; stop: number } | null =
    null
  let pending: 'buy' | 'sell' | null = null
  let atrFallback = 0

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    if (atrArr[i] !== null && atrArr[i]! > 0) atrFallback = atrArr[i]!

    // ① 执行上一根 bar 收盘产生的信号：本根开盘成交
    if (pending === 'buy' && !position) {
      const atr = atrFallback || bar.close * 0.03
      const stop = bar.open - 2 * atr
      const stopDist = (bar.open - stop) / bar.open
      if (stopDist > 0) {
        const posValue = (cash * params.riskPct) / 100 / stopDist
        position = {
          entryTime: bar.time,
          entryPrice: bar.open,
          shares: posValue / bar.open,
          stop
        }
        markers.push({ time: bar.time, side: 'buy' })
      }
    } else if (pending === 'sell' && position) {
      closeTrade(trades, position, bar.open, bar.time)
      markers.push({ time: bar.time, side: 'sell' })
      position = null
    }
    pending = null

    // ② 日内止损：盘中触及止损价即离场
    if (position && bar.low <= position.stop) {
      closeTrade(trades, position, position.stop, bar.time)
      markers.push({ time: bar.time, side: 'sell' })
      position = null
    }

    // ③ 收盘后算信号（供下一根 bar 开盘执行）
    if (strategy === 'ma-cross') {
      const f = fastArr[i]
      const s = slowArr[i]
      const pf = fastArr[i - 1]
      const ps = slowArr[i - 1]
      if (f !== null && s !== null && pf !== null && ps !== null) {
        if (!position && pf <= ps && f > s) pending = 'buy'
        else if (position && pf >= ps && f < s) pending = 'sell'
      }
    } else {
      const lo = boll.lower[i]
      const plo = boll.lower[i - 1]
      const mid = boll.mid[i]
      if (!position && lo !== null && plo !== null && bar.low <= plo && bar.close >= lo) {
        pending = 'buy'
      } else if (position && mid !== null && bar.close > mid) {
        pending = 'sell'
      }
    }

    // ④ 结算净值（mark-to-market）
    if (i >= 1) {
      equityByBar[i] =
        cash + (position ? (position.shares * bar.close) / position.entryPrice : 0)
    }
  }

  // 末根仍持仓则按收盘平仓收尾
  if (position) {
    closeTrade(trades, position, bars[bars.length - 1].close, bars[bars.length - 1].time)
    markers.push({ time: bars[bars.length - 1].time, side: 'sell' })
  }

  const equity = bars
    .map((b, i) => (equityByBar[i] !== null ? { time: b.time, value: equityByBar[i]! } : null))
    .filter((x): x is { time: number; value: number } => x !== null)

  const finalEquity = equity.length ? equity[equity.length - 1].value : 1
  let peak = 1
  let maxDd = 0
  for (const p of equity) {
    if (p.value > peak) peak = p.value
    const dd = (peak - p.value) / peak
    if (dd > maxDd) maxDd = dd
  }

  const wins = trades.filter((t) => t.pnl > 0)
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = trades.filter((t) => t.pnl <= 0).reduce((s, t) => s + Math.abs(t.pnl), 0)

  return {
    trades,
    equity,
    markers,
    metrics: {
      annualReturn: Math.pow(Math.max(finalEquity, 1e-9), 252 / bars.length) - 1,
      maxDrawdown: maxDd,
      winRate: trades.length ? wins.length / trades.length : 0,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
      tradeCount: trades.length
    }
  }
}

/** 参数网格扫描，返回按年化收益排序的最优参数（教学用：演示过拟合） */
export function findBestParams(
  bars: OHLC[],
  strategy: StrategyKey,
  base: BacktestParams
): { params: BacktestParams; result: BacktestResult } {
  let best: { params: BacktestParams; result: BacktestResult } | null = null
  const grid =
    strategy === 'ma-cross'
      ? [5, 8, 10, 13, 15, 20].flatMap((f) =>
          [20, 30, 40, 50, 60].filter((s) => s > f).map((s) => ({ ...base, fast: f, slow: s }))
        )
      : [10, 15, 20, 25, 30].flatMap((p) =>
          [1.5, 2, 2.5, 3].map((m) => ({ ...base, period: p, mult: m }))
        )
  for (const p of grid) {
    const r = runBacktest(bars, strategy, p)
    if (!best || r.metrics.annualReturn > best.result.metrics.annualReturn) {
      best = { params: p, result: r }
    }
  }
  return best!
}
```

**Step 2: 验证编译**

Run: `npm run docs:build`
Expected: 构建通过（TS 类型检查；组件是客户端渲染，SSR 只出骨架）。行为验证放到 Task 3 浏览器实测。

**Step 3: Commit**

```bash
git add docs/.vitepress/theme/lib/backtest.ts
git commit -m "feat: 新增回测引擎纯函数库 lib/backtest.ts"
```

---

## Task 2: BacktestLab.vue + 全局注册 + 组件契约

**Files:**
- Create: `docs/.vitepress/theme/components/BacktestLab.vue`
- Modify: `docs/.vitepress/theme/index.ts`（注册 BacktestLab）
- Modify: `docs/.vitepress/theme/components/README.md`（契约新增 BacktestLab 一节）

**Step 1: 创建 BacktestLab.vue**

完整代码（含策略切换、参数滑块、指标卡、净值曲线 + K 线双图、找最优参数、交易明细表、放大交互）：

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  ColorType,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time
} from 'lightweight-charts'
import {
  STRATEGIES,
  genBacktestData,
  runBacktest,
  findBestParams,
  type StrategyKey,
  type BacktestParams,
  type BacktestResult
} from '../lib/backtest'
import { toggleExpand } from '../lib/expand'

/**
 * 回测实验室组件
 * 在浏览器内真实跑一次回测：调参数 → 指标/净值曲线/交易明细跟着变
 * 数据为教学用合成数据（genBacktestData），非真实行情
 */
const props = withDefaults(defineProps<{ title?: string }>(), { title: '回测实验室' })

const strategy = ref<StrategyKey>('ma-cross')
const params = ref<BacktestParams>({ fast: 5, slow: 20, period: 20, mult: 2, riskPct: 2 })
const seed = ref(7)
const expanded = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const bars = computed(() => genBacktestData(300, seed.value))
/** 双均线约束：慢线 > 快线 */
function normalized(): BacktestParams {
  const p = { ...params.value }
  if (strategy.value === 'ma-cross' && p.slow <= p.fast) p.slow = p.fast + 5
  return p
}
const result = computed<BacktestResult>(() =>
  runBacktest(bars.value, strategy.value, normalized())
)
const m = computed(() => result.value.metrics)

function setStrategy(k: string) {
  strategy.value = k as StrategyKey
  best.value = null
}

const optimizing = ref(false)
const best = ref<{ params: BacktestParams; result: BacktestResult } | null>(null)
function optimize() {
  if (optimizing.value) return
  optimizing.value = true
  best.value = null
  setTimeout(() => {
    best.value = findBestParams(bars.value, strategy.value, { ...params.value })
    optimizing.value = false
  }, 30)
}
function reseed() {
  seed.value = (seed.value * 9301 + 49297) % 233280
  best.value = null
}

const klineEl = ref<HTMLDivElement | null>(null)
const eqEl = ref<HTMLDivElement | null>(null)
let klineChart: IChartApi | null = null
let klineSeries: ISeriesApi<'Candlestick'> | null = null
let klineMarkers: ISeriesMarkersPluginApi<Time> | null = null
let eqChart: IChartApi | null = null
let eqSeries: ISeriesApi<'Line'> | null = null

const COLORS = { up: '#26a69a', down: '#ef5350', grid: 'rgba(0,0,0,0.06)', text: '#999' }
function makeChart(el: HTMLElement, height: number): IChartApi {
  return createChart(el, {
    height,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: COLORS.text },
    grid: { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
    rightPriceScale: { borderColor: 'rgba(0,0,0,0.06)' },
    timeScale: { borderColor: 'rgba(0,0,0,0.06)', rightOffset: 4 },
    autoSize: true
  })
}

function buildCharts() {
  if (!klineEl.value || !eqEl.value) return
  klineChart = makeChart(klineEl.value, 300)
  klineSeries = klineChart.addSeries(CandlestickSeries, {
    upColor: COLORS.up,
    downColor: COLORS.down,
    borderVisible: false,
    wickUpColor: COLORS.up,
    wickDownColor: COLORS.down
  })
  klineMarkers = createSeriesMarkers(klineSeries, [], {})
  eqChart = makeChart(eqEl.value, 200)
  eqSeries = eqChart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2 })
}

function render() {
  const r = result.value
  if (klineSeries && klineChart) {
    klineSeries.setData(
      bars.value.map((b) => ({
        time: b.time as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close
      }))
    )
    klineMarkers?.setMarkers(
      r.markers.map((mk) => ({
        time: mk.time as Time,
        position: mk.side === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
        color: mk.side === 'buy' ? '#26a69a' : '#ef5350',
        shape: mk.side === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
        text: mk.side === 'buy' ? '买入' : '卖出'
      }))
    )
    klineChart.timeScale().fitContent()
  }
  if (eqSeries && eqChart) {
    eqSeries.setData(
      r.equity.map((p) => ({ time: p.time as Time, value: Number(p.value.toFixed(4)) }))
    )
    eqChart.timeScale().fitContent()
  }
}

watch([strategy, params, seed], render, { deep: true })
onMounted(() => {
  buildCharts()
  render()
})
onBeforeUnmount(() => {
  klineChart?.remove()
  eqChart?.remove()
  klineChart = null
  eqChart = null
})

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`
const fmtPF = (v: number) => (v === Infinity ? '∞' : Number.isFinite(v) ? v.toFixed(2) : '—')
const ts = (t: number) => new Date(t * 1000).toISOString().slice(0, 10)
function bestHint(p: BacktestParams): string {
  return strategy.value === 'ma-cross'
    ? `快线 ${p.fast} / 慢线 ${p.slow}`
    : `周期 ${p.period} / 倍数 ${p.mult}`
}
</script>

<template>
  <div class="chart-container bl-root" ref="rootRef">
    <button
      class="chart-expand-btn"
      :title="expanded ? '收起' : '放大'"
      @click="toggleExpand(rootRef, (v) => (expanded = v))"
    >
      <svg v-if="!expanded" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
    </button>
    <div v-if="props.title" class="demo-title">{{ props.title }}</div>

    <div class="bl-toolbar">
      <div class="bl-tabs">
        <button
          v-for="(meta, key) in STRATEGIES"
          :key="key"
          class="bl-tab"
          :class="{ active: strategy === key }"
          @click="setStrategy(key)"
        >
          {{ meta.name }}
        </button>
      </div>
      <button class="bl-reseed" @click="reseed">↺ 换一段数据</button>
    </div>

    <div class="bl-params">
      <label v-for="p in STRATEGIES[strategy].params" :key="p.key" class="bl-param">
        <span class="bl-param-label">{{ p.label }} <b>{{ params[p.key] }}</b></span>
        <input type="range" :min="p.min" :max="p.max" :step="p.step" v-model.number="params[p.key]" />
      </label>
    </div>

    <div class="bl-metrics">
      <div class="bl-metric">
        <span>年化收益</span>
        <b :class="m.annualReturn >= 0 ? 'pos' : 'neg'">{{ fmtPct(m.annualReturn) }}</b>
      </div>
      <div class="bl-metric">
        <span>最大回撤</span>
        <b class="neg">{{ fmtPct(-m.maxDrawdown) }}</b>
      </div>
      <div class="bl-metric">
        <span>胜率</span>
        <b>{{ fmtPct(m.winRate) }}</b>
      </div>
      <div class="bl-metric">
        <span>盈亏比</span>
        <b>{{ m.tradeCount ? fmtPF(m.profitFactor) : '—' }}</b>
      </div>
      <div class="bl-metric">
        <span>交易次数</span>
        <b>{{ m.tradeCount }}</b>
      </div>
    </div>

    <div class="bl-subtitle">净值曲线（起始 1.0）</div>
    <div ref="eqEl" class="bl-chart" :style="{ height: '200px', width: '100%' }"></div>

    <div class="bl-subtitle">行情与买卖点（教学合成数据）</div>
    <div ref="klineEl" class="bl-chart" :style="{ height: '300px', width: '100%' }"></div>

    <div class="bl-optimize">
      <button class="bl-opt-btn" @click="optimize" :disabled="optimizing">
        {{ optimizing ? '扫描中…' : '找最优参数' }}
      </button>
      <p v-if="best" class="bl-opt-hint">
        ⚠️ 最优参数：{{ bestHint(best.params) }}，在这段数据上年化
        {{ fmtPct(best.result.metrics.annualReturn) }}。
        <em>但这大概率是过拟合——换一段数据它往往就失效。参数不是"扫"出来的，而是想清楚逻辑后验证出来的。</em>
      </p>
    </div>

    <div v-if="m.tradeCount" class="bl-trades">
      <div class="bl-subtitle">交易明细（最近 {{ Math.min(m.tradeCount, 15) }} 笔）</div>
      <div class="bl-table-wrap">
        <table class="bl-table">
          <thead>
            <tr><th>#</th><th>入场日</th><th>入场价</th><th>出场日</th><th>出场价</th><th>盈亏 %</th><th>净值贡献</th></tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in [...result.trades].reverse().slice(0, 15)" :key="i">
              <td>{{ result.trades.length - i }}</td>
              <td>{{ ts(t.entryTime) }}</td>
              <td>{{ t.entryPrice.toFixed(2) }}</td>
              <td>{{ ts(t.exitTime) }}</td>
              <td>{{ t.exitPrice.toFixed(2) }}</td>
              <td :class="t.pnl >= 0 ? 'pos' : 'neg'">{{ t.pnlPct >= 0 ? '+' : '' }}{{ t.pnlPct.toFixed(2) }}%</td>
              <td :class="t.pnl >= 0 ? 'pos' : 'neg'">{{ t.pnl >= 0 ? '+' : '' }}{{ (t.pnl * 100).toFixed(2) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-title {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--vp-c-divider);
}
.bl-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  flex-wrap: wrap;
}
.bl-tabs { display: flex; gap: 6px; }
.bl-tab {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.bl-tab.active { background: #1e5fd0; color: #fff; border-color: #1e5fd0; }
.bl-reseed {
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.bl-params {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px 18px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.bl-param { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--vp-c-text-2); }
.bl-param b { color: var(--vp-c-text-1); }
.bl-param input { width: 100%; }
.bl-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 8px;
  padding: 10px 12px;
}
.bl-metric {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
  text-align: center;
}
.bl-metric span { display: block; font-size: 12px; color: var(--vp-c-text-2); }
.bl-metric b { font-size: 16px; }
.pos { color: #26a69a; }
.neg { color: #ef5350; }
.bl-subtitle { padding: 8px 12px 0; font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); }
.bl-chart { margin-top: 4px; }
.bl-optimize { padding: 10px 12px; }
.bl-opt-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: #1e5fd0;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}
.bl-opt-btn:disabled { opacity: 0.6; cursor: default; }
.bl-opt-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #e69138;
  line-height: 1.6;
}
.bl-opt-hint em { color: var(--vp-c-text-2); }
.bl-trades { padding: 0 12px 12px; }
.bl-table-wrap { overflow-x: auto; }
.bl-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.bl-table th,
.bl-table td {
  border: 1px solid var(--vp-c-divider);
  padding: 5px 8px;
  text-align: right;
  white-space: nowrap;
}
.bl-table th { background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); font-weight: 600; }
.bl-table td:first-child,
.bl-table th:first-child { text-align: left; }
</style>
```

**Step 2: 注册组件**

在 `docs/.vitepress/theme/index.ts`：
- import 区加 `import BacktestLab from './components/BacktestLab.vue'`
- `enhanceApp` 里加 `app.component('BacktestLab', BacktestLab)`

**Step 3: 更新组件契约 README.md**

在 `ComparePanel` 一节之后、`CalcExplorer` 之前插入 `## BacktestLab — 回测实验室` 一节：

```md
## BacktestLab — 回测实验室

用于**实战/回测实验室页**。浏览器内真实跑一次回测：调参数 → 指标卡/净值曲线/交易明细立刻变。数据为教学用合成数据（带趋势段/震荡段），非真实行情。

```vue
<BacktestLab title="回测实验室" />
```

- `title`：可选标题
- 内置两个策略：**双均线交叉**（趋势）与**布林带回归**（震荡）
- 参数滑块随策略切换：双均线=快线周期/慢线周期/单笔风险%；布林=周期/标准差倍数/单笔风险%
- 「换一段数据」重新生成合成行情（同一次点击换种子）；「找最优参数」网格扫描并提示过拟合
- 输出：净值曲线 + K线买卖点 + 5 项指标（年化/回撤/胜率/盈亏比/交易次数）+ 交易明细表
- 引擎逻辑在 `lib/backtest.ts`（信号收盘后产生、次根 bar 开盘成交、ATR(2) 止损、单笔风险仓位）
- 颜色：买 `#26a69a` 绿、卖 `#ef5350` 红、净值线 `#1e5fd0` 蓝
```

**Step 4: 验证编译**

Run: `npm run docs:build`
Expected: 构建通过

**Step 5: Commit**

```bash
git add docs/.vitepress/theme/components/BacktestLab.vue docs/.vitepress/theme/index.ts docs/.vitepress/theme/components/README.md
git commit -m "feat: 新增 BacktestLab 回测实验室组件并全局注册"
```

---

## Task 3: 实战板块页面（5 页）

**Files:**
- Create: `docs/practice/index.md`
- Create: `docs/practice/backtest-lab.md`
- Create: `docs/practice/python-setup.md`
- Create: `docs/practice/first-backtest.md`
- Create: `docs/practice/paper-trading.md`

### Step 1: `docs/practice/index.md`

frontmatter：`title: 实战`。内容结构：

```
# 实战

一句话定位：前面 7 个板块教你「看懂」，这个板块教你「做出来」——跑通一次回测、搭好数据管道、上模拟盘。

## 为什么需要这个板块
- 概念页给的是「示意伪代码」，实战要的是「能跑起来」
- 学习路径图第四阶段（构建策略 → 回测验证 → 模拟盘）在这里落地
- 三句话：回测是把策略规则变成收益曲线；数据是策略的原料；模拟盘是实盘的预演

## 三阶段路线
| 阶段 | 做什么 | 入口 | 难度 |
|------|--------|------|------|
| ① 先玩 | 在浏览器里跑回测，拧参数看指标变 | [回测实验室](./backtest-lab) | 入门 |
| ② 接真数据 | 装 Python、拉行情、跑真实回测框架 | [Python 环境与数据获取](./python-setup) → [用回测框架跑通第一个策略](./first-backtest) | 进阶 |
| ③ 上模拟盘 | 用虚拟资金验证，感受滑点与心理 | [模拟盘实操](./paper-trading) | 进阶 |

## 从哪儿开始
完全新手先玩回测实验室 10 分钟，体会「参数一变、结果就变」再往下走。

## 相关
- [回测方法论](../methodology/backtesting/how-to-backtest) 的理论版
- [第一个策略](../getting-started/first-strategy) 的规则版
```

### Step 2: `docs/practice/backtest-lab.md`

frontmatter：`title: 回测实验室`、`difficulty: 入门`。内容结构：

```
# 回测实验室

一句话：这是本站唯一一个「真的跑」的地方——在浏览器里执行一次真实回测循环，拖参数立刻看到收益/回撤/胜率变化。

<PlainTalk>回测就像给策略做一次「沙盘推演」……</PlainTalk>

<BacktestLab title="回测实验室" />

## 怎么玩（3 步）
1. 切换策略：双均线交叉（顺势）vs 布林带回归（震荡）——感受两类策略在不同行情段的表现
2. 拖参数：快线/慢线周期、单笔风险%……每拖一下，净值曲线和指标卡都变
3. 点「换一段数据」：同一套参数换段行情，结果可能完全相反——这就是为什么要警惕过拟合
4. 点「找最优参数」：看它在当前数据段上多"漂亮"，再换段数据看它还灵不灵

## 回测循环其实就 6 行（组件背后跑的就是这个）
```python
for bar in data:
    if no_position and entry_signal(bar):     # ① 入场信号
        size = risk_pct / stop_distance        # ② 单笔风险仓位
        buy(size)
    if has_position and exit_signal(bar):      # ③ 离场信号（含止损）
        sell_all()
    update_equity(bar)                         # ④ 逐根更新净值
```
组件里的规则：信号在 bar 收盘后产生、**次根 bar 开盘成交**（避免偷看未来）；止损 = 入场价 − 2×ATR；仓位按「单笔风险 / 止损距离」算。

## 指标卡是怎么算的
| 指标 | 算法（示意） |
|------|------------|
| 年化收益 | 终值 ^ (252/总天数) − 1 |
| 最大回撤 | max(峰值 − 现值) / 峰值 |
| 胜率 | 盈利笔数 / 总笔数 |
| 盈亏比 | 总盈利 / 总亏损 |
| 交易次数 | 完整平仓的笔数 |

## 为什么用合成数据
本站不提供真实行情（不构成投资建议）。合成数据用来教**机制**——回测怎么跑、参数怎么影响结果、过拟合长什么样。真实数据见 [Python 环境与数据获取](./python-setup)。

## 常见误区
- <span class="qw-no">✕</span> 看到高年化就兴奋：先在合成数据上理解「同参数换段数据就变脸」再谈真实数据
- <span class="qw-no">✕</span> 一直拧参数直到曲线好看：那就是在拟合噪声
- <span class="qw-ok">✓</span> 先把「信号 → 仓位 → 止损 → 离场」四个环节想清楚

## 下一步
- 理论版：[回测的正确流程](../methodology/backtesting/how-to-backtest)
- 动手版：[Python 环境与数据获取](./python-setup)
```

### Step 3: `docs/practice/python-setup.md`

frontmatter：`title: Python 环境与数据获取`、`difficulty: 入门`。内容结构：

```
# Python 环境与数据获取

一句话：这是从「浏览器里玩回测」到「在电脑上真跑」的桥。

<PlainTalk>……</PlainTalk>

## 一、装环境（30 分钟）
| 工具 | 用途 | 说明 |
|------|------|------|
| Anaconda | Python + 常用库全家桶 | 装 Jupyter 一起带好 |
| VS Code | 写代码 | 装 Python 扩展 |
| Jupyter Notebook | 边写边看 | 新手最友好 |

## 二、数据源对比（本站不包含真实行情，以下为外部指引）
| 数据源 | 覆盖市场 | 免费 | 上手 | 说明 |
|--------|----------|------|------|------|
| Tushare | A股 | 部分 | 中 | 国内最常用，部分接口需积分 |
| AkShare | A股/港股/美股/期货/加密 | 全免费 | 低 | 抓取为主，接口多 |
| yfinance | 全球股票/ETF/加密 | 免费 | 低 | 国外最流行，简单 |
| Baostock | A股 | 全免费 | 低 | 稳定、无需注册 |

## 三、拉一次数据（最小代码）
以 AkShare 为例（示意，运行时以最新文档为准）：
```python
import akshare as ak
df = ak.stock_zh_a_hist(symbol="000001", period="daily",
                        start_date="20200101", end_date="20240101", adjust="qfq")
df.to_csv("data.csv", index=False)
```
拿到 CSV 后就能喂给下一步的回测脚本。

## 四、合规提醒
- 本站为纯教学站点，不含任何真实行情与投资建议
- 使用数据源前阅读其服务条款；A股行情来源请留意授权范围
```

### Step 4: `docs/practice/first-backtest.md`

frontmatter：`title: 用回测框架跑通第一个策略`、`difficulty: 进阶`。内容结构：

```
# 用回测框架跑通第一个策略

一句话：回测实验室教机制，本页给一套**能在你电脑上跑通**的最小真实回测脚本。

<PlainTalk>……</PlainTalk>

## 选哪个框架
| 框架 | 特点 | 适合 |
|------|------|------|
| backtrader | 老牌、功能全、文档多 | 想深入学回测细节 |
| vectorbt | 快、向量化、更"量化" | 会 pandas、想批量实验 |

本页用 **backtrader** 走读（概念最直白）。装：`pip install backtrader`

## 完整脚本（双均线，本地可跑）
```python
import backtrader as bt

class MaCross(bt.Strategy):
    params = dict(fast=5, slow=20)
    def __init__(self):
        sma_fast = bt.ind.SMA(period=self.p.fast)
        sma_slow = bt.ind.SMA(period=self.p.slow)
        self.crossover = bt.ind.CrossOver(sma_fast, sma_slow)
    def next(self):
        if not self.position and self.crossover > 0:
            self.buy()                          # 金叉买入
        elif self.position and self.crossover < 0:
            self.close()                        # 死叉平仓

if __name__ == '__main__':
    cerebro = bt.Cerebro()
    # 用本地 CSV（见《Python 环境与数据获取》）
    data = bt.feeds.GenericCSVData(dataname='data.csv', dtformat='%Y-%m-%d',
                                   openinterest=-1)
    cerebro.adddata(data)
    cerebro.addstrategy(MaCross)
    cerebro.broker.setcash(100000)
    cerebro.broker.setcommission(commission=0.0003)
    print(f'初始资金: {cerebro.broker.getvalue():,.2f}')
    cerebro.run()
    print(f'期末资金: {cerebro.broker.getvalue():,.2f}')
```

## 跑完怎么读
| backtrader 输出 | 对应回测实验室指标卡 |
|-----------------|----------------------|
| 期末资金 | 年化收益（自己换算） |
| 交易笔数 | 交易次数 |
| 手续费/滑点 | 盈亏比的隐性成本 |

把这里的结果和 [回测实验室](./backtest-lab) 的指标卡对照，你会发现**真实框架多出的每一笔手续费和滑点都在吃掉收益**。

## 常见坑
- CSV 列名/日期格式不匹配 → 先打印 data 前几行
- 忘记设手续费 → 回测虚高
- 只用一段数据 → 回测漂亮、实盘打脸（见 [样本外检验](../methodology/backtesting/walk-forward)）
```

### Step 5: `docs/practice/paper-trading.md`

frontmatter：`title: 模拟盘实操`、`difficulty: 进阶`。内容结构：

```
# 模拟盘实操

一句话：回测证明策略「在历史上有效」，模拟盘证明它「在现实里可执行」。

<PlainTalk>……</PlainTalk>

## 为什么先上模拟盘
回测用的是历史数据，模拟盘用的是**实时行情 + 虚拟资金**。它能暴露回测看不到的三件事：
1. 滑点与延迟：挂单价能不能成交
2. 执行成本：手续费/点差吃掉多少
3. 心理：连亏时你还拿得住吗

## 平台对比（示意，以各家最新规则为准）
| 场景 | 平台示例 | 说明 |
|------|----------|------|
| A股 | 券商自带模拟盘 / 同花顺模拟 | 开户即用，规则贴近实盘 |
| 美股 | 券商 Paper Trading（如 IB、TradingView） | 免费、API 可对接策略 |
| 加密 | 交易所 Testnet / 模拟金 | 合约可试杠杆与强平 |

## 从回测到模拟盘的 Checklist
1. 策略参数与回测一致（不要临场改）
2. 明确交易成本假设（佣金、滑点、点差）
3. 先跑 2-4 周，记录每笔偏离预期的成交
4. 只对比「策略净值」与「实际净值」的差距，别管单日盈亏

## 相关
- [回测的正确流程](../methodology/backtesting/how-to-backtest)
- [常见回测陷阱](../methodology/backtesting/common-pitfalls)
```

### Step 6: 验证 + Commit

Run: `npm run docs:build`
Expected: 构建通过。页面还没进侧边栏，`check-links` 此时不扫这些新页面，无需在本任务跑。

```bash
git add docs/practice/
git commit -m "feat: 新增实战板块 5 页（回测实验室/环境与数据/第一个回测/模拟盘）"
```

---

## Task 4: 统计与概率基础子板块（4 页）

**Files:**
- Create: `docs/methodology/statistics/index.md`
- Create: `docs/methodology/statistics/expected-value.md`
- Create: `docs/methodology/statistics/variance-drawdown.md`
- Create: `docs/methodology/statistics/correlation.md`

### Step 1: `docs/methodology/statistics/index.md`

frontmatter：`title: 统计与概率基础`。内容：

```
# 统计与概率基础

一句话：量化策略的地基是数学——期望值回答「长期能不能赚」，波动回答「过程有多颠」，相关性回答「组合怎么配」。

| 页 | 解决什么问题 | 难度 |
|----|------------|------|
| [期望值](./expected-value) | 为什么正期望是盈利前提 | 进阶 |
| [波动与最大回撤](./variance-drawdown) | 收益的另一面是回撤 | 入门 |
| [相关性](./correlation) | 组合分散与配对交易的地基 | 进阶 |

## 为什么放在方法论
回测指标（夏普、回撤）、凯利公式、仓位管理、多因子——全部建立在概率与统计概念上。先有地基，再看上层。

## 相关
- [凯利公式](../risk-management/kelly-criterion)
- [组合风险管理](../risk-management/portfolio-risk)
```

### Step 2: `docs/methodology/statistics/expected-value.md`

frontmatter：`title: 期望值`、`difficulty: 进阶`。内容：

```
# 期望值（Expected Value）

## 一句话理解
期望值 = 把所有可能结果的「概率 × 收益」加起来。正期望 = 长期期望盈利。

<PlainTalk>期望值就像掷硬币游戏：正面你赢 2 元、反面你输 1 元，每次的期望值是 0.5×2 − 0.5×1 = 0.5 元。玩得越多，越接近每次平均赚 0.5——这是"大数定律"，也是正期望策略的根基。</PlainTalk>

## 公式
E = Σ P(i) × R(i)

| 符号 | 含义 |
|------|------|
| P(i) | 第 i 种结果发生的概率 |
| R(i) | 第 i 种结果带来的收益 |

## 与交易的关系
一笔交易的期望值 = 胜率 × 平均盈利 − 败率 × 平均亏损。
例：胜率 40%、平均盈利 8%、平均亏损 4% → E = 0.4×8 − 0.6×4 = 3.2 − 2.4 = +0.8% —— 正期望。
而胜率 70%、平均盈利 1%、平均亏损 6% → E = 0.7×1 − 0.3×6 = 0.7 − 1.8 = −1.1% —— 高胜率也可能亏钱。

## 使用 CalcExplorer
用「风报比」模式直观体验胜率与盈亏比如何组合出正期望：
<CalcExplorer mode="riskreward" title="期望值与风报比" />

## 常见误区
- <span class="qw-no">✕</span> 只看胜率：胜率高≠赚钱，期望值才是裁判
- <span class="qw-no">✕</span> 单笔样本说事：期望值是"长期平均"，一笔交易说明不了任何事
- <span class="qw-ok">✓</span> 先算期望值再决定要不要上这个策略

## 相关
- [凯利公式](../risk-management/kelly-criterion) —— 期望值之后，问"下注多少"
```

### Step 3: `docs/methodology/statistics/variance-drawdown.md`

frontmatter：`title: 波动与最大回撤`、`difficulty: 入门`。内容：

```
# 波动与最大回撤

## 一句话理解
收益回答「涨多少」，波动回答「颠不颠」，回撤回答「从高点摔多深」。回撤 50% 需要涨 100% 才回本。

<PlainTalk>……</PlainTalk>

## 波动（标准差）
σ = √( Σ (rᵢ − r̄)² / n )

## 最大回撤
MDD = max( (Peak − Trough) / Peak )

## 为什么回撤伤不起（数学）
| 回撤 | 需要涨回 | 感受 |
|------|----------|------|
| −10% | +11.1% | 还能忍 |
| −20% | +25% | 难受 |
| −30% | +42.9% | 怀疑人生 |
| −50% | +100% | 大部分人已离场 |

## 与仓位的关系
用 ATR 或百分比设定单笔风险，就是在控制「单笔回撤上限」→ 用 [回测实验室](../../practice/backtest-lab) 把风险% 从 1% 调到 5%，看最大回撤怎么被放大。

## 常见误区
- <span class="qw-no">✕</span> 只看年化不看回撤：年化 30% / 回撤 50% 的策略你根本拿不住
- <span class="qw-ok">✓</span> 把「能承受的回撤」当成选策略的第一约束

## 相关
- [仓位管理](../risk-management/position-sizing)
```

### Step 4: `docs/methodology/statistics/correlation.md`

frontmatter：`title: 相关性`、`difficulty: 进阶`。内容：

```
# 相关性（Correlation）

## 一句话理解
相关系数 ρ ∈ [−1, 1]，衡量两个资产「涨跌是否同步」。分散化的本质是买入低相关资产。

<PlainTalk>……</PlainTalk>

## 公式
ρ = Cov(X, Y) / (σ_X · σ_Y)

## 直觉判断表
| ρ | 含义 | 组合效果 |
|----|------|----------|
| ≈ +1 | 同涨同跌 | 不分散，等于押同一个东西 |
| ≈ 0 | 互不相干 | 分散效果好 |
| ≈ −1 | 此消彼长 | 最强对冲（现实中极少） |

## 用途
- 组合分散：股票 + 债券的低相关 → 降低整体波动
- 配对交易：找到高相关价差回归 → 见 [配对交易](../../strategies/mean-reversion/pairs-trading)
- 风险平价：按「波动贡献」而非「金额」配权重 → 见 [风险平价](../../strategies/quantitative/risk-parity)

## 常见误区
- <span class="qw-no">✕</span> 把相关当因果：黄金与美元负相关是规律，不是因果
- <span class="qw-no">✕</span> 只信历史相关：危机时相关性会「收敛到 1」（一起跌）
- <span class="qw-ok">✓</span> 用「滚动相关」看它是否稳定，而不是只看一段

## 相关
- [组合风险管理](../risk-management/portfolio-risk)
```

### Step 5: 验证 + Commit

Run: `npm run docs:build`
Expected: 构建通过

```bash
git add docs/methodology/statistics/
git commit -m "docs: 方法论新增统计与概率基础子板块 4 页"
```

---

## Task 5: config.ts 注册导航与侧边栏

**Files:**
- Modify: `docs/.vitepress/config.ts`

**Step 1: 新增 practiceSidebar**

在 `referenceSidebar` 定义之后加：

```ts
const practiceSidebar: DefaultTheme.SidebarItem[] = [
  { text: '实战', link: '/practice/' },
  { text: '回测实验室', link: '/practice/backtest-lab' },
  { text: 'Python 环境与数据获取', link: '/practice/python-setup' },
  { text: '用回测框架跑通第一个策略', link: '/practice/first-backtest' },
  { text: '模拟盘实操', link: '/practice/paper-trading' }
]
```

**Step 2: methodologySidebar 新增统计组**

在 `回测方法论` 分组之后、`交易心理` 之前插入：

```ts
{
  text: '统计与概率基础',
  collapsed: false,
  items: [
    { text: '统计基础总览', link: '/methodology/statistics/' },
    { text: '期望值', link: '/methodology/statistics/expected-value' },
    { text: '波动与最大回撤', link: '/methodology/statistics/variance-drawdown' },
    { text: '相关性', link: '/methodology/statistics/correlation' }
  ]
},
```

**Step 3: nav 加「实战」**

`{ text: '方法论', link: '/methodology/' },` 之后加 `{ text: '实战', link: '/practice/' },`。

**Step 4: sidebar 映射加 practice**

```ts
sidebar: {
  ...
  '/practice/': practiceSidebar,
  ...
}
```

**Step 5: 验证**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 构建通过；0 死链

**Step 6: Commit**

```bash
git add docs/.vitepress/config.ts
git commit -m "docs: 注册实战板块导航与侧边栏、方法论统计组"
```

---

## Task 6: 交叉链接

**Files:**
- Modify: `docs/reference/reading-list.md`
- Modify: `docs/methodology/backtesting/how-to-backtest.md`
- Modify: `docs/strategies/trend-following/ma-crossover.md`
- Modify: `docs/strategies/mean-reversion/bollinger-bounce.md`
- Modify: `docs/methodology/backtesting/walk-forward.md`

**Step 1: reading-list.md**

- 「三条学习路线」表后加一行说明：`编程新手把 [实战板块](../practice/) 纳入路线：回测实验室 → 环境与数据 → 第一个回测 → 模拟盘。`
- 学习路径图「第四阶段」改为：

```
第四阶段：实战（持续）
  [回测实验室](../practice/backtest-lab) → [Python 环境与数据获取](../practice/python-setup) → [模拟盘实操](../practice/paper-trading)
```

**Step 2: how-to-backtest.md 相关小节**

在文件末尾「相关」小节（若没有则新建）追加：

```md
- 动手版：[回测实验室](../practice/backtest-lab)
```

**Step 3: ma-crossover.md 与 bollinger-bounce.md 相关小节**

各追加一行：

```md
- 代码实践：[用回测框架跑通第一个策略](../practice/first-backtest)
```

**Step 4: walk-forward.md 相关小节**

若已有「相关」小节，追加：`- 动手理解：[回测实验室](../practice/backtest-lab)`

**Step 5: 验证 + Commit**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 构建通过；0 死链

```bash
git add docs/reference/reading-list.md docs/methodology/backtesting/how-to-backtest.md docs/strategies/trend-following/ma-crossover.md docs/strategies/mean-reversion/bollinger-bounce.md docs/methodology/backtesting/walk-forward.md
git commit -m "docs: 实战板块与既有页面交叉链接"
```

---

## Task 7: 全量验证

**Step 1: 构建 + 死链**

Run: `npm run docs:build`
Expected: 构建通过

Run: `node scripts/check-links.mjs`
Expected: 0 死链

**Step 2: 浏览器实测（CLAUDE.md 强制）**

Run:
```bash
npm run docs:preview -- --port 4173
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --window-size=1400,2000 --virtual-time-budget=8000 --screenshot=/tmp/shots/bl.png "http://localhost:4173/practice/backtest-lab"
```

对以下页面截图：
- `/practice/backtest-lab`（核心：BacktestLab）
- `/practice/`、`/practice/python-setup`、`/practice/first-backtest`、`/practice/paper-trading`
- `/methodology/statistics/expected-value`、`/methodology/statistics/variance-drawdown`

**Step 3: 检查点（backtest-lab）**

- CDP 抓 `Runtime.exceptionThrown`：无 JS 错误（lightweight-charts v5 API 用错会在这里暴露）
- 指标卡渲染出数字（非 NaN / 非 —— 除非 0 笔交易）
- `#` / 交易明细表有行（默认参数交易次数应 > 3）
- `.bl-chart` 两个容器内各有 `<canvas>` = 图表真实绘制
- 若无法直接读图，用 vision 工具或 PIL 裁剪放大 BacktestLab 区域

**Step 4: 分析截图**

对齐/溢出/留白检查；若数字可疑（如年化 NaN、胜率 >100%），回到 Task 1 引擎逻辑排查。

**Step 5: 收尾 Commit（如有微调）**

```bash
git add -A
git commit -m "fix: 回测实验室验证后微调"
```
