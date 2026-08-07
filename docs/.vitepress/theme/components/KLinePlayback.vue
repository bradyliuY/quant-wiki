<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { createChart, CandlestickSeries, LineSeries, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { genDemoData, type OHLC } from '../lib/indicators'
import { createReplay } from '../lib/charts'

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
    height?: number
    title?: string
  }>(),
  { data: undefined, markers: () => [], lines: () => [], height: 340, title: 'K 线回放' }
)

const containerRef = ref<HTMLElement | null>(null)
const equityRef = ref<HTMLElement | null>(null)
const statusRef = ref('')
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let lineSeries: ISeriesApi<'Line'>[] = []
let equityChart: IChartApi | null = null
let equityLine: ISeriesApi<'Line'> | null = null
let replay: ReturnType<typeof createReplay> | null = null

const allData = ref<OHLC[]>(props.data?.length ? props.data : genDemoData(120))
const useEquity = ref(false)
const playing = ref(false)
const progress = ref(0)
const speed = ref(1)

function setFrame(start: number, end: number) {
  if (!chart || !candleSeries) return
  candleSeries.setData(allData.value.slice(0, end).map((d) => ({
    time: d.time as unknown as string,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close
  })))
  // 指标线
  lineSeries.forEach((s, idx) => {
    const line = props.lines[idx]
    if (!line) return
    s.setData(line.values.slice(0, end).map((v, i) => ({
      time: allData.value[i].time as unknown as string,
      value: v ?? 0
    })).filter((p) => allData.value[allData.value.findIndex((d) => d.time === (p.time as unknown as number))]))
  })
  // 标注
  const visibleMarkers = props.markers
    .filter((m) => allData.value.findIndex((d) => d.time === m.time) < end)
    .map((m) => ({
      time: m.time as unknown as string,
      position: m.side === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
      color: m.side === 'buy' ? '#26a69a' : '#ef5350',
      shape: m.side === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
      text: m.side === 'buy' ? '买入' : '卖出'
    }))
  // @ts-expect-error markers 类型
  candleSeries.setMarkers(visibleMarkers)

  // 收益曲线
  if (useEquity.value && equityChart && equityLine) {
    updateEquity(end)
  }
  progress.value = end / allData.value.length
}

function updateEquity(end: number) {
  if (!equityChart || !equityLine) return
  const startPrice = allData.value[0].close
  const points = allData.value.slice(0, end).map((d, i) => ({
    time: d.time as unknown as string,
    value: Number((((d.close - startPrice) / startPrice) * 100).toFixed(2))
  }))
  equityLine.setData(points)
}

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
  props.lines.forEach((line) => {
    const s = chart!.addSeries(LineSeries, { color: line.color, lineWidth: 2 })
    lineSeries.push(s)
  })
  // 收益曲线图
  if (equityRef.value) {
    equityChart = createChart(equityRef.value, {
      height: 90,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#999' },
      grid: { vertLines: { color: 'rgba(0,0,0,0.05)' }, horzLines: { color: 'rgba(0,0,0,0.05)' } },
      autoSize: true,
      timeScale: { visible: false }
    })
    equityLine = equityChart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2 })
  }
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
  <div class="chart-container">
    <div v-if="title" class="demo-title">{{ title }}</div>
    <div ref="containerRef" :style="{ height: height + 'px', width: '100%' }"></div>
    <div v-if="useEquity" ref="equityRef" style="width: 100%"></div>
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
