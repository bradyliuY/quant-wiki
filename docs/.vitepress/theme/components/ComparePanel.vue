<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType, LineStyle, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { genDemoData, calcSMA, calcEMA, calcRSI, calcBollinger, calcMACD, toSeries, type OHLC } from '../lib/indicators'
import { toggleExpand } from '../lib/expand'

/**
 * 对比面板：左右两个同步滚动的图表，用于参数/指标/策略对比。
 * 通过 leftOverlay / rightOverlay 传入计算函数（接收 closes 返回 series 数据）。
 */
const props = withDefaults(
  defineProps<{
    data?: OHLC[]
    leftLabel?: string
    rightLabel?: string
    leftSeries?: { name: string; color: string; values: (number | null)[] }[]
    rightSeries?: { name: string; color: string; values: (number | null)[] }[]
    leftMode?: 'sma' | 'ema' | 'bollinger' | 'rsi' | 'macd' | 'none'
    rightMode?: 'sma' | 'ema' | 'bollinger' | 'rsi' | 'macd' | 'none'
    leftPeriods?: number[]
    rightPeriods?: number[]
    height?: number
    title?: string
  }>(),
  { data: undefined, leftLabel: '方案 A', rightLabel: '方案 B', leftSeries: () => [], rightSeries: () => [], leftMode: 'sma', rightMode: 'sma', leftPeriods: () => [5, 20], rightPeriods: () => [10, 50], height: 300, title: '对比' }
)

/** rsi / macd 需要副窗格，整体加高 130px 给窗格留空间 */
const needsPane = (mode: string) => mode === 'rsi' || mode === 'macd'
const chartHeight = computed(() => props.height + (needsPane(props.leftMode) || needsPane(props.rightMode) ? 130 : 0))

const leftRef = ref<HTMLElement | null>(null)
const rightRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
let leftChart: IChartApi | null = null
let rightChart: IChartApi | null = null
let leftCandles: ISeriesApi<'Candlestick'> | null = null
let rightCandles: ISeriesApi<'Candlestick'> | null = null

const allData = ref<OHLC[]>(props.data?.length ? props.data : genDemoData(120))
const closes = ref(allData.value.map((d) => d.close))

function buildChart(el: HTMLElement) {
  const chart = createChart(el, {
    height: chartHeight.value,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#999' },
    grid: { vertLines: { color: 'rgba(0,0,0,0.05)' }, horzLines: { color: 'rgba(0,0,0,0.05)' } },
    autoSize: true,
    timeScale: { rightOffset: 4 }
  })
  return chart
}

function renderSide(
  chart: IChartApi,
  candles: ISeriesApi<'Candlestick'>,
  series: { name: string; color: string; values: (number | null)[] }[],
  mode: string,
  periods: number[]
) {
  candles.setData(allData.value.map((d) => ({ time: d.time as never, open: d.open, high: d.high, low: d.low, close: d.close })))
  if (series.length) {
    series.forEach((s) => {
      const line = chart.addSeries(LineSeries, { color: s.color, lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
      line.setData(s.values.map((v, i) => ({ time: allData.value[i].time as never, value: v ?? 0 })))
    })
  } else if (mode === 'sma' || mode === 'ema') {
    periods.forEach((p, i) => {
      const color = ['#1e5fd0', '#e69138', '#7b1fa2'][i % 3]
      const line = chart.addSeries(LineSeries, { color, lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
      const vals = mode === 'ema' ? calcEMA(closes.value, p) : calcSMA(closes.value, p)
      line.setData(vals.map((v, i) => ({ time: allData.value[i].time as never, value: v ?? 0 })))
    })
  } else if (mode === 'bollinger') {
    // 参数约定：[周期, 标准差倍数]，默认 (20, 2)
    const period = periods[0] ?? 20
    const mult = periods[1] ?? 2
    const b = calcBollinger(closes.value, period, mult)
    const times = allData.value.map((d) => d.time)
    const upper = chart.addSeries(LineSeries, { color: 'rgba(30,95,208,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const mid = chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
    const lower = chart.addSeries(LineSeries, { color: 'rgba(30,95,208,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    upper.setData(toSeries(times, b.upper))
    mid.setData(toSeries(times, b.mid))
    lower.setData(toSeries(times, b.lower))
  } else if (mode === 'rsi') {
    // 参数约定：[周期]，默认 14；副窗格画 RSI + 30/50/70 参考线
    const period = periods[0] ?? 14
    const line = chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, paneIndex: 1, priceLineVisible: false, lastValueVisible: false })
    line.setData(toSeries(allData.value.map((d) => d.time), calcRSI(closes.value, period)))
    ;[30, 50, 70].forEach((p) => line.createPriceLine({ price: p, color: 'rgba(128,128,128,0.7)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false }))
  } else if (mode === 'macd') {
    // 参数约定：[快线, 慢线, 信号]，默认 (12, 26, 9)；副窗格画 DIF/DEA + MACD 柱
    const [fast = 12, slow = 26, signal = 9] = periods
    const m = calcMACD(closes.value, fast, slow, signal)
    const times = allData.value.map((d) => d.time)
    const dif = chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, paneIndex: 1, priceLineVisible: false, lastValueVisible: false })
    const dea = chart.addSeries(LineSeries, { color: '#e69138', lineWidth: 2, paneIndex: 1, priceLineVisible: false, lastValueVisible: false })
    dif.setData(toSeries(times, m.dif))
    dea.setData(toSeries(times, m.dea))
    const hist = chart.addSeries(HistogramSeries, { paneIndex: 1, priceFormat: { type: 'price' } })
    hist.setData(times.map((t, i) => ({ time: t, value: m.hist[i] ?? 0, color: (m.hist[i] ?? 0) >= 0 ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)' })))
  }
}

function sync() {
  if (!leftRef.value || !rightRef.value) return
  leftChart = buildChart(leftRef.value)
  rightChart = buildChart(rightRef.value)
  leftCandles = leftChart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' })
  rightCandles = rightChart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' })
  renderSide(leftChart, leftCandles, props.leftSeries, props.leftMode, props.leftPeriods)
  renderSide(rightChart, rightCandles, props.rightSeries, props.rightMode, props.rightPeriods)
  // 同步时间轴
  const leftScale = leftChart.timeScale()
  const rightScale = rightChart.timeScale()
  leftScale.subscribeVisibleLogicalRangeChange((range) => {
    if (range) rightScale.setVisibleLogicalRange(range)
  })
  rightScale.subscribeVisibleLogicalRangeChange((range) => {
    if (range) leftScale.setVisibleLogicalRange(range)
  })
}

onMounted(sync)
onBeforeUnmount(() => {
  leftChart?.remove()
  rightChart?.remove()
})
watch(() => props.data, (nd) => {
  if (nd?.length) {
    allData.value = nd
    closes.value = nd.map((d) => d.close)
    sync()
  }
})
</script>

<template>
  <div class="chart-container" ref="rootRef">
    <button class="chart-expand-btn" :title="expanded ? '收起' : '放大'" @click="toggleExpand(rootRef, (v) => (expanded = v))">
      <svg v-if="!expanded" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
    </button>
    <div v-if="title" class="demo-title">{{ title }}</div>
    <div class="compare-grid">
      <div class="compare-item">
        <div class="compare-label">{{ leftLabel }}</div>
        <div ref="leftRef" :style="{ height: chartHeight + 'px', width: '100%' }"></div>
      </div>
      <div class="compare-item">
        <div class="compare-label">{{ rightLabel }}</div>
        <div ref="rightRef" :style="{ height: chartHeight + 'px', width: '100%' }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-title { padding: 8px 12px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--vp-c-divider); }
.compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--vp-c-divider); }
.compare-item { background: var(--vp-c-bg); padding: 8px; }
.compare-label { font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 4px; color: var(--vp-c-text-2); }
</style>
