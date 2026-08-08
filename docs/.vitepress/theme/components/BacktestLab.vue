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
