<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType, LineStyle, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { genDemoData, calcSMA, calcEMA, calcRSI, calcMACD, calcBollinger, calcATR, calcKDJ, toSeries, type OHLC } from '../lib/indicators'
import { toggleExpand } from '../lib/expand'

/**
 * 指标动态演示组件
 * 上：K 线主图；下：所选指标窗格。支持切换指标类型与参数。
 */
const props = withDefaults(
  defineProps<{
    data?: OHLC[]
    indicator?: 'ma' | 'ema' | 'rsi' | 'macd' | 'boll' | 'atr' | 'kdj' | 'none'
    /** 主图叠加的均线周期，如 [5, 10, 20] */
    maPeriods?: number[]
    /** 主图叠加 MA 时是否显示（ma/ema/boll 时有效） */
    showOverlay?: boolean
    height?: number
    title?: string
  }>(),
  { data: undefined, indicator: 'ma', maPeriods: () => [5, 10, 20], showOverlay: true, height: 380, title: '指标演示' }
)

const containerRef = ref<HTMLElement | null>(null)
const paneRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let overlaySeries: ISeriesApi<'Line'>[] = []
let paneSeries: ISeriesApi<'Line'>[] = []
let histSeries: ISeriesApi<'Histogram'> | null = null

const allData = ref<OHLC[]>(props.data?.length ? props.data : genDemoData(150))
const closes = ref(allData.value.map((d) => d.close))
const times = ref(allData.value.map((d) => d.time))
const indicator = ref(props.indicator)
const period = ref(14)
const overbought = ref(70)
const oversold = ref(30)

/** 有副图窗格（MACD/RSI/ATR/KDJ）时，整体加高给窗格留空间 */
const hasPane = computed(() => ['macd', 'rsi', 'atr', 'kdj'].includes(indicator.value))
const chartHeight = computed(() => props.height + (hasPane.value ? 130 : 0))

const colors = ['#1e5fd0', '#e69138', '#7b1fa2']

type LegendItem = { label: string; color: string; glyph?: string }
/** 图上图例：与 renderOverlay/renderPane 实际画的线一一对应 */
const legendItems = computed<LegendItem[]>(() => {
  const items: LegendItem[] = []
  const ind = props.indicator
  if (ind === 'boll') {
    items.push({ label: '上轨', color: 'rgba(30,95,208,0.5)' })
    items.push({ label: '中轨', color: '#1e5fd0' })
    items.push({ label: '下轨', color: 'rgba(30,95,208,0.5)' })
  } else if (props.showOverlay && (ind === 'ma' || ind === 'ema' || ind === 'none')) {
    props.maPeriods.forEach((p, i) => {
      items.push({ label: `${ind === 'ema' ? 'EMA' : 'MA'}${p}`, color: colors[i % colors.length] })
    })
  }
  if (ind === 'macd') {
    items.push({ label: 'DIF', color: '#1e5fd0' })
    items.push({ label: 'DEA', color: '#e69138' })
    items.push({ label: 'MACD 柱（红负 / 绿正）', color: 'linear-gradient(90deg, #ef5350 50%, #26a69a 50%)' })
  } else if (ind === 'rsi' || ind === 'atr') {
    items.push({ label: `${ind.toUpperCase()}(${period.value})`, color: '#1e5fd0' })
  } else if (ind === 'kdj') {
    items.push({ label: 'K', color: '#1e5fd0' })
    items.push({ label: 'D', color: '#e69138' })
    items.push({ label: 'J', color: '#7b1fa2' })
  }
  return items
})

function renderOverlay() {
  if (!chart || !candleSeries) return
  overlaySeries.forEach((s) => chart?.removeSeries(s))
  overlaySeries = []
  // 布林带本身就是被讲解的指标，始终画在主图
  if (props.indicator === 'boll') { renderBoll(); return }
  // 主图 MA 叠加：仅 ma/ema/none 需要，且受 showOverlay 控制
  if (!props.showOverlay) return
  if (props.indicator !== 'ma' && props.indicator !== 'ema' && props.indicator !== 'none') return
  const periods = props.maPeriods
  periods.forEach((p, i) => {
    const s = chart!.addSeries(LineSeries, { color: colors[i % colors.length], lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
    const vals = props.indicator === 'ema' ? calcEMA(closes.value, p) : calcSMA(closes.value, p)
    s.setData(toSeries(times.value, vals))
    overlaySeries.push(s)
  })
}

function renderBoll() {
  if (!chart || !candleSeries) return
  overlaySeries.forEach((s) => chart?.removeSeries(s))
  overlaySeries = []
  const b = calcBollinger(closes.value, 20, 2)
  const upper = chart.addSeries(LineSeries, { color: 'rgba(30,95,208,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
  const mid = chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
  const lower = chart.addSeries(LineSeries, { color: 'rgba(30,95,208,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
  upper.setData(toSeries(times.value, b.upper))
  mid.setData(toSeries(times.value, b.mid))
  lower.setData(toSeries(times.value, b.lower))
  overlaySeries = [upper, mid, lower]
}

function renderPane() {
  if (!paneRef.value) return
  paneSeries.forEach((s) => chart?.removeSeries(s))
  paneSeries = []
  if (histSeries) chart?.removeSeries(histSeries)
  histSeries = null

  const ind = indicator.value
  if (ind === 'none') return

  const paneChart = chart
  if (ind === 'macd') {
    const m = calcMACD(closes.value)
    const dif = paneChart!.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, paneIndex: 1 })
    const dea = paneChart!.addSeries(LineSeries, { color: '#e69138', lineWidth: 2, paneIndex: 1 })
    dif.setData(toSeries(times.value, m.dif))
    dea.setData(toSeries(times.value, m.dea))
    histSeries = paneChart!.addSeries(HistogramSeries, { paneIndex: 1, priceFormat: { type: 'price' } })
    const histData = times.value.map((t, i) => ({
      time: t,
      value: m.hist[i] ?? 0,
      color: (m.hist[i] ?? 0) >= 0 ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)'
    }))
    histSeries.setData(histData)
    paneSeries = [dif, dea]
  } else {
    let vals: (number | null)[] = []
    if (ind === 'rsi') vals = calcRSI(closes.value, period.value)
    else if (ind === 'atr') vals = calcATR(allData.value, period.value)
    else if (ind === 'kdj') {
      const kd = calcKDJ(allData.value, period.value)
      const k = paneChart!.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, paneIndex: 1 })
      const d = paneChart!.addSeries(LineSeries, { color: '#e69138', lineWidth: 2, paneIndex: 1 })
      const j = paneChart!.addSeries(LineSeries, { color: '#7b1fa2', lineWidth: 1, paneIndex: 1 })
      k.setData(toSeries(times.value, kd.k))
      d.setData(toSeries(times.value, kd.d))
      j.setData(toSeries(times.value, kd.j))
      ;[20, 80].forEach((p) => k.createPriceLine({ price: p, color: 'rgba(128,128,128,0.7)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false }))
      paneSeries = [k, d, j]
      return
    } else {
      return
    }
    const s = paneChart!.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, paneIndex: 1 })
    s.setData(toSeries(times.value, vals))
    if (ind === 'rsi') {
      // 超买 70 / 超卖 30 参考线（成熟行情软件的标配）
      ;[30, 50, 70].forEach((p) => s.createPriceLine({ price: p, color: 'rgba(128,128,128,0.7)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false }))
    }
    paneSeries = [s]
  }
}

function renderAll() {
  renderOverlay()
  renderPane()
}

onMounted(() => {
  if (!containerRef.value) return
  chart = createChart(containerRef.value, {
    height: props.height,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#999' },
    grid: { vertLines: { color: 'rgba(0,0,0,0.05)' }, horzLines: { color: 'rgba(0,0,0,0.05)' } },
    autoSize: true,
    timeScale: { rightOffset: 4 }
  })
  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
    wickUpColor: '#26a69a', wickDownColor: '#ef5350'
  })
  candleSeries.setData(allData.value.map((d) => ({ time: d.time as never, open: d.open, high: d.high, low: d.low, close: d.close })))
  chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.25 } })
  // 创建指标窗格（pane 1）
  renderAll()
})

onBeforeUnmount(() => {
  chart?.remove()
})

watch([indicator, period], () => renderAll())
watch(() => props.data, (nd) => {
  if (nd?.length) {
    allData.value = nd
    closes.value = nd.map((d) => d.close)
    times.value = nd.map((d) => d.time)
    candleSeries?.setData(nd.map((d) => ({ time: d.time as never, open: d.open, high: d.high, low: d.low, close: d.close })))
    renderAll()
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
    <div v-if="legendItems.length" class="chart-legend" aria-label="图例">
      <span v-for="(it, idx) in legendItems" :key="idx" class="chart-legend-item">
        <i v-if="it.glyph" class="chart-legend-glyph" :style="{ color: it.color }">{{ it.glyph }}</i>
        <i v-else class="chart-legend-swatch" :style="{ background: it.color }"></i>
        {{ it.label }}
      </span>
    </div>
    <div ref="containerRef" :style="{ height: chartHeight + 'px', width: '100%' }"></div>
    <div class="demo-controls" v-if="['rsi','atr','kdj'].includes(indicator)">
      <label style="font-size:12px">周期
        <input type="number" v-model.number="period" min="2" max="60" style="width:60px;margin-left:6px" />
      </label>
      <span style="font-size:12px;color:#999">修改参数后图表实时重算</span>
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
</style>
