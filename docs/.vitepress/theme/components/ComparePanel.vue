<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { createChart, CandlestickSeries, LineSeries, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { genDemoData, calcSMA, calcEMA, calcRSI, type OHLC } from '../lib/indicators'
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
    leftMode?: 'sma' | 'ema' | 'none'
    rightMode?: 'sma' | 'ema' | 'none'
    leftPeriods?: number[]
    rightPeriods?: number[]
    height?: number
    title?: string
  }>(),
  { data: undefined, leftLabel: '方案 A', rightLabel: '方案 B', leftSeries: () => [], rightSeries: () => [], leftMode: 'sma', rightMode: 'sma', leftPeriods: () => [5, 20], rightPeriods: () => [10, 50], height: 300, title: '对比' }
)

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
    height: props.height,
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
        <div ref="leftRef" style="width:100%"></div>
      </div>
      <div class="compare-item">
        <div class="compare-label">{{ rightLabel }}</div>
        <div ref="rightRef" style="width:100%"></div>
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
