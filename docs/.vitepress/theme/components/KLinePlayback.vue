<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { createChart, CandlestickSeries, LineSeries, ColorType, createSeriesMarkers, type IChartApi, type ISeriesApi, type ISeriesMarkersPluginApi, type Time } from 'lightweight-charts'
import { genDemoData, calcBollinger, type OHLC } from '../lib/indicators'
import { createReplay } from '../lib/charts'
import { toggleExpand } from '../lib/expand'

/**
 * K 线回放组件
 * 用于策略页/案例页：逐根 K 线生长动画 + 买卖点标注 + 累计收益曲线
 */
const props = withDefaults(
  defineProps<{
    /** OHLC 数据；缺省时用内置演示数据 */
    data?: OHLC[]
    /** 入场/出场标注：{ time, side: 'buy'|'sell' } */
    markers?: { time: number; side: 'buy' | 'sell' }[]
    /** 指标线：{ name, color, values: (number|null)[] } */
    lines?: { name: string; color: string; values: (number | null)[] }[]
    /** 策略模式：自动生成指标线 + 买卖点叠加（缺省走 lines/markers） */
    strategy?: 'bollinger'
    height?: number
    title?: string
  }>(),
  { data: undefined, markers: () => [], lines: () => [], strategy: undefined, height: 340, title: 'K 线回放' }
)

const containerRef = ref<HTMLElement | null>(null)
const equityRef = ref<HTMLElement | null>(null)
const statusRef = ref('')
const rootRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let lineSeries: ISeriesApi<'Line'>[] = []
let markersPlugin: ISeriesMarkersPluginApi<Time> | null = null
let equityChart: IChartApi | null = null
let equityLine: ISeriesApi<'Line'> | null = null
let replay: ReturnType<typeof createReplay> | null = null

const allData = ref<OHLC[]>(props.data?.length ? props.data : genDemoData(120))
const useEquity = ref(false)
const playing = ref(false)
const progress = ref(0)
const speed = ref(1)
let currentEnd = 0

/** 策略叠加指标线：strategy 模式下自动从内置数据计算，否则用传入的 lines */
const effectiveLines = computed(() => {
  if (props.strategy === 'bollinger') {
    const closes = allData.value.map((d) => d.close)
    const { upper, mid, lower } = calcBollinger(closes, 20, 2)
    return [
      { name: '上轨', color: '#ef5350', values: upper },
      { name: '中轨', color: '#f2b04b', values: mid },
      { name: '下轨', color: '#26a69a', values: lower }
    ]
  }
  return props.lines
})
const effectiveMarkers = computed(() => {
  if (props.strategy === 'bollinger') return buildBollingerMarkers(allData.value)
  return props.markers
})

/** 布林回归买卖点：低点触下轨后收回带内 → 买入；买入后收盘上穿中轨 → 卖出 */
function buildBollingerMarkers(data: OHLC[]): { time: number; side: 'buy' | 'sell' }[] {
  const closes = data.map((d) => d.close)
  const { lower, mid } = calcBollinger(closes, 20, 2)
  const markers: { time: number; side: 'buy' | 'sell' }[] = []
  let lastBuy = -99
  let pendingBuy = -1
  for (let i = 1; i < data.length; i++) {
    if (lower[i - 1] != null && lower[i] != null && data[i - 1].low < (lower[i - 1] as number) && closes[i] > (lower[i] as number) && i - lastBuy >= 10) {
      markers.push({ time: data[i].time, side: 'buy' })
      pendingBuy = i
      lastBuy = i
    } else if (pendingBuy >= 0 && mid[i] != null && closes[i] >= (mid[i] as number)) {
      markers.push({ time: data[i].time, side: 'sell' })
      pendingBuy = -1
    }
  }
  return markers
}

function setFrame(start: number, end: number) {
  currentEnd = end
  if (!chart || !candleSeries) return
  candleSeries.setData(allData.value.slice(0, end).map((d) => ({
    time: d.time as unknown as string,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close
  })))
  // 指标线（对齐 allData 下标，null 跳过不画）
  lineSeries.forEach((s, idx) => {
    const line = effectiveLines.value[idx]
    if (!line) return
    s.setData(allData.value.slice(0, end).map((d, i) => {
      const v = line.values[i]
      return v == null ? null : { time: d.time as unknown as string, value: v }
    }).filter((p): p is { time: string; value: number } => p !== null))
  })
  // 标注（v5: 通过 createSeriesMarkers 插件更新）
  if (markersPlugin) {
    const visibleMarkers = effectiveMarkers.value
      .filter((m) => allData.value.findIndex((d) => d.time === m.time) < end)
      .map((m) => ({
        time: m.time as Time,
        position: m.side === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
        color: m.side === 'buy' ? '#26a69a' : '#ef5350',
        shape: m.side === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
        text: m.side === 'buy' ? '买入' : '卖出'
      }))
    markersPlugin.setMarkers(visibleMarkers)
  }

  // 收益曲线
  if (useEquity.value && equityChart && equityLine) {
    updateEquity(end)
  }
  progress.value = end / allData.value.length
}

function ensureEquityChart() {
  if (equityChart || !equityRef.value) return
  equityChart = createChart(equityRef.value, {
    height: 90,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#999' },
    grid: { vertLines: { color: 'rgba(0,0,0,0.05)' }, horzLines: { color: 'rgba(0,0,0,0.05)' } },
    autoSize: true,
    timeScale: { visible: false }
  })
  equityLine = equityChart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2 })
}

function updateEquity(end: number) {
  ensureEquityChart()
  if (!equityChart || !equityLine) return
  const startPrice = allData.value[0].close
  const points = allData.value.slice(0, end).map((d) => ({
    time: d.time as unknown as string,
    value: Number((((d.close - startPrice) / startPrice) * 100).toFixed(2))
  }))
  equityLine.setData(points)
}

// 收益图懒创建：勾选"显示收益"时才初始化图表（v-if 容器挂载后 nextTick 创建）
watch(useEquity, (on) => {
  if (on) nextTick(() => updateEquity(currentEnd || allData.value.length))
  else {
    equityChart?.remove()
    equityChart = null
    equityLine = null
  }
})

function togglePlay() {
  if (!replay) return
  if (playing.value) replay.pause()
  else replay.play()
  playing.value = !playing.value
}

function toggleEquity() {
  useEquity.value = !useEquity.value
}

function reset() {
  replay?.reset()
  playing.value = false
}

function jump(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  progress.value = val
  replay?.jump(val)
}

function changeSpeed(e: Event) {
  speed.value = Number((e.target as HTMLInputElement).value)
  replay?.setSpeed(speed.value)
}

onMounted(() => {
  if (!containerRef.value) return
  chart = createChart(containerRef.value, {
    height: props.height,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#999' },
    grid: { vertLines: { color: 'rgba(0,0,0,0.06)' }, horzLines: { color: 'rgba(0,0,0,0.06)' } },
    autoSize: true,
    timeScale: { rightOffset: 4 }
  })
  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
    wickUpColor: '#26a69a', wickDownColor: '#ef5350'
  })
  effectiveLines.value.forEach((line) => {
    const s = chart!.addSeries(LineSeries, { color: line.color, lineWidth: 2 })
    lineSeries.push(s)
  })
  // v5: 买卖点标注用 createSeriesMarkers 插件
  markersPlugin = createSeriesMarkers(candleSeries, [], {})
  markersPlugin.setMarkers([])
  // 收益曲线图懒创建：见 watch(useEquity)，避免在 v-if=false 时对空容器初始化
  replay = createReplay(setFrame, allData.value.length, 40)
  replay.play()
  playing.value = true
})

onBeforeUnmount(() => {
  replay?.dispose()
  chart?.remove()
  equityChart?.remove()
})

watch(
  () => props.data,
  (nd) => {
    if (nd?.length) {
      allData.value = nd
      replay?.reset()
    }
  }
)
</script>

<template>
  <div class="chart-container" ref="rootRef">
    <button class="chart-expand-btn" :title="expanded ? '收起' : '放大'" @click="toggleExpand(rootRef, (v) => (expanded = v))">
      <svg v-if="!expanded" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
    </button>
    <div v-if="title" class="demo-title">{{ title }}</div>
    <div ref="containerRef" :style="{ height: height + 'px', width: '100%' }"></div>
    <div v-if="useEquity" ref="equityRef" style="width: 100%; height: 90px"></div>
    <div class="demo-controls">
      <button @click="togglePlay">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="reset">↺ 重置</button>
      <button @click="toggleEquity">{{ useEquity ? '隐藏收益' : '显示收益' }}</button>
      <input type="range" min="0" max="100" :value="progress * 100" @input="jump" style="flex:1" />
      <select :value="speed" @change="changeSpeed">
        <option :value="0.5">0.5x</option>
        <option :value="1">1x</option>
        <option :value="2">2x</option>
        <option :value="4">4x</option>
      </select>
      <span style="font-size:12px;color:#999">{{ statusRef }}</span>
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
