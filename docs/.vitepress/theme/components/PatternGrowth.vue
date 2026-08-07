<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { createChart, CandlestickSeries, LineSeries, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { genDemoData, type OHLC } from '../lib/indicators'
import { toggleExpand } from '../lib/expand'

/**
 * 形态生长动画：逐根 K 线绘制 + 关键位标注线。
 * pattern: double-bottom | head-shoulders | ascending-triangle | flag | rectangle | none
 */
const props = withDefaults(
  defineProps<{
    pattern?: string
    data?: OHLC[]
    height?: number
    title?: string
    /** 标注线：{ label, price, color } */
    levels?: { label: string; price: number; color?: string }[]
  }>(),
  { pattern: 'double-bottom', data: undefined, height: 320, title: '形态生长动画', levels: () => [] }
)

const containerRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let levelSeries: ISeriesApi<'Line'>[] = []
let timer: ReturnType<typeof setInterval> | null = null
let cursor = 0

const allData = ref<OHLC[]>(props.data?.length ? props.data : genDemoData(90))
const shownCount = ref(0)

function drawLevels(end: number) {
  if (!chart) return
  levelSeries.forEach((s) => chart?.removeSeries(s))
  levelSeries = []
  props.levels.forEach((lv) => {
    if (lv.price === undefined) return
    const line = chart!.addSeries(LineSeries, {
      color: lv.color ?? '#e69138',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false
    })
    line.setData([
      { time: allData.value[0].time as never, value: lv.price },
      { time: allData.value[end - 1].time as never, value: lv.price }
    ])
    levelSeries.push(line)
  })
}

function frame() {
  cursor++
  if (cursor > allData.value.length) {
    if (timer) { clearInterval(timer); timer = null }
    cursor = allData.value.length
  }
  candleSeries?.setData(allData.value.slice(0, cursor).map((d) => ({
    time: d.time as never, open: d.open, high: d.high, low: d.low, close: d.close
  })))
  drawLevels(cursor)
  shownCount.value = cursor
}

function start() {
  cursor = 0
  if (timer) clearInterval(timer)
  timer = setInterval(frame, 35)
}

function reset() {
  start()
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
  start()
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  chart?.remove()
})

watch(() => props.data, (nd) => {
  if (nd?.length) { allData.value = nd; start() }
})
</script>

<template>
  <div class="chart-container" ref="rootRef">
    <button class="chart-expand-btn" :title="expanded ? '收起' : '放大'" @click="toggleExpand(rootRef, (v) => (expanded = v))">
      <svg v-if="!expanded" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
    </button>
    <div v-if="title" class="demo-title">
      {{ title }}
      <span class="counter">{{ shownCount }}/{{ allData.length }} 根</span>
    </div>
    <div ref="containerRef" :style="{ height: height + 'px', width: '100%' }"></div>
    <div class="demo-controls">
      <button @click="reset">↺ 重新生长</button>
      <span style="font-size:12px;color:#999">形态：{{ pattern }}</span>
    </div>
  </div>
</template>

<style scoped>
.demo-title { padding: 8px 12px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--vp-c-divider); display: flex; justify-content: space-between; }
.counter { font-size: 12px; color: var(--vp-c-text-3); font-weight: 400; }
</style>
