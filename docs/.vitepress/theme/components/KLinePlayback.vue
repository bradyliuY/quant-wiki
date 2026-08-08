<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { createChart, CandlestickSeries, LineSeries, ColorType, LineStyle, createSeriesMarkers, type IChartApi, type ISeriesApi, type ISeriesMarkersPluginApi, type Time } from 'lightweight-charts'
import { genDemoData, calcSMA, calcRSI, calcMACD, calcKDJ, calcBollinger, calcOBV, calcSAR, calcIchimoku, calcPivot, calcVWAP, calcCMF, calcROC, type OHLC } from '../lib/indicators'
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
    strategy?: 'bollinger' | 'ma-cross' | 'channel' | 'turtle' | 'macd' | 'rsi-reversal' | 'rsi-momentum' | 'kdj' | 'grid' | 'sar' | 'ichimoku' | 'pivot-points' | 'obv' | 'vwap' | 'cmf' | 'roc'
    /** 渲染形态：line 用于净值/价差等单值序列（组合/配对页），candle 用 K 线 */
    variant?: 'candle' | 'line'
    height?: number
    title?: string
  }>(),
  { data: undefined, markers: () => [], lines: () => [], strategy: undefined, variant: 'candle', height: 340, title: 'K 线回放' }
)

const containerRef = ref<HTMLElement | null>(null)
const equityRef = ref<HTMLElement | null>(null)
const statusRef = ref('')
const rootRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
let chart: IChartApi | null = null
let mainSeries: ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null = null
let lineSeries: ISeriesApi<'Line'>[] = []
let markersPlugin: ISeriesMarkersPluginApi<Time> | null = null
let equityChart: IChartApi | null = null
let equityLine: ISeriesApi<'Line'> | null = null
let replay: ReturnType<typeof createReplay> | null = null

type StratLine = { name: string; color: string; values: (number | null)[]; pane?: number; priceLines?: number[] }
type StratMarker = { time: number; side: 'buy' | 'sell' }

/** 个别策略用能体现其行情的 seed（如 RSI 反转需要 RSI 真跌破 30） */
const STRATEGY_SEED: Record<string, number> = { 'rsi-reversal': 43 }

const allData = ref<OHLC[]>(props.data?.length ? props.data : genDemoData(120, STRATEGY_SEED[props.strategy ?? ''] ?? 42))
const useEquity = ref(false)
const playing = ref(false)
const progress = ref(0)
const speed = ref(1)
let currentEnd = 0

/** 策略叠加指标线：strategy 模式下自动从内置数据计算，否则用传入的 lines */
const effectiveLines = computed<StratLine[]>(() => {
  if (props.strategy) return buildStrategy(allData.value).lines
  return props.lines
})
const effectiveMarkers = computed<StratMarker[]>(() => {
  if (props.strategy) return buildStrategy(allData.value).markers
  return props.markers
})
/** 是否需要指标子窗格（RSI/KDJ/MACD 在第二窗格），主图相应加高 */
const hasSubPane = computed(() => effectiveLines.value.some((l) => l.pane === 1))
const chartHeight = computed(() => props.height + (hasSubPane.value ? 130 : 0))

type LegendItem = { label: string; color: string; glyph?: string }
/** 图上图例：每条叠加线的色块+名称，以及买卖点标注的含义（有标注时才展示） */
const legendItems = computed<LegendItem[]>(() => {
  const items: LegendItem[] = effectiveLines.value.map((l) => ({ label: l.name, color: l.color }))
  if (effectiveMarkers.value.length) {
    items.push({ label: '买入', color: '#26a69a', glyph: '▲' })
    items.push({ label: '卖出', color: '#ef5350', glyph: '▼' })
  }
  return items
})

function crossAbove(a: (number | null)[], b: (number | null)[], i: number): boolean {
  return i >= 1 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i - 1]! <= b[i - 1]! && a[i]! > b[i]!
}
function crossBelow(a: (number | null)[], b: (number | null)[], i: number): boolean {
  return i >= 1 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i - 1]! >= b[i - 1]! && a[i]! < b[i]!
}
/** 唐奇安通道：period 日最高(high=true)/最低(high=false) */
function donchian(data: OHLC[], period: number, high: boolean): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null
    const slice = data.slice(i - period + 1, i + 1)
    return high ? Math.max(...slice.map((d) => d.high)) : Math.min(...slice.map((d) => d.low))
  })
}
/** 状态机：空仓且 buy(i) → 买入；持仓且 sell(i) → 卖出。保证买卖严格配对 */
function runStrategy(data: OHLC[], buy: (i: number) => boolean, sell: (i: number) => boolean): StratMarker[] {
  const markers: StratMarker[] = []
  let holding = false
  for (let i = 1; i < data.length; i++) {
    if (!holding && buy(i)) { markers.push({ time: data[i].time, side: 'buy' }); holding = true }
    else if (holding && sell(i)) { markers.push({ time: data[i].time, side: 'sell' }); holding = false }
  }
  return markers
}

function buildStrategy(data: OHLC[]): { lines: StratLine[]; markers: StratMarker[] } {
  const closes = data.map((d) => d.close)
  switch (props.strategy) {
    case 'bollinger': {
      const { upper, mid, lower } = calcBollinger(closes, 20, 2)
      const markers: StratMarker[] = []
      let lastBuy = -99
      let holding = false
      for (let i = 1; i < data.length; i++) {
        if (!holding && lower[i - 1] != null && lower[i] != null && data[i - 1].low < (lower[i - 1] as number) && closes[i] > (lower[i] as number) && i - lastBuy >= 10) {
          markers.push({ time: data[i].time, side: 'buy' }); lastBuy = i; holding = true
        } else if (holding && mid[i] != null && closes[i] >= (mid[i] as number)) {
          markers.push({ time: data[i].time, side: 'sell' }); holding = false
        }
      }
      return {
        lines: [
          { name: '上轨', color: '#ef5350', values: upper },
          { name: '中轨', color: '#f2b04b', values: mid },
          { name: '下轨', color: '#26a69a', values: lower }
        ],
        markers
      }
    }
    case 'ma-cross': {
      const ma5 = calcSMA(closes, 5)
      const ma20 = calcSMA(closes, 20)
      return {
        lines: [
          { name: 'MA5', color: '#f2b04b', values: ma5 },
          { name: 'MA20', color: '#1e5fd0', values: ma20 }
        ],
        markers: runStrategy(data, (i) => crossAbove(ma5, ma20, i), (i) => crossBelow(ma5, ma20, i))
      }
    }
    case 'channel': {
      const d20h = donchian(data, 20, true)
      const d20l = donchian(data, 20, false)
      return {
        lines: [
          { name: '20日高', color: '#ef5350', values: d20h },
          { name: '20日低', color: '#26a69a', values: d20l }
        ],
        markers: runStrategy(
          data,
          (i) => d20h[i - 1] != null && closes[i] > (d20h[i - 1] as number) && closes[i - 1] <= (d20h[i - 1] as number),
          (i) => d20l[i - 1] != null && closes[i] < (d20l[i - 1] as number) && closes[i - 1] >= (d20l[i - 1] as number)
        )
      }
    }
    case 'turtle': {
      const e20h = donchian(data, 20, true)
      const x10l = donchian(data, 10, false)
      return {
        lines: [
          { name: '入场 20日高', color: '#ef5350', values: e20h },
          { name: '离场 10日低', color: '#26a69a', values: x10l }
        ],
        markers: runStrategy(
          data,
          (i) => e20h[i - 1] != null && closes[i] > (e20h[i - 1] as number) && closes[i - 1] <= (e20h[i - 1] as number),
          (i) => x10l[i - 1] != null && closes[i] < (x10l[i - 1] as number) && closes[i - 1] >= (x10l[i - 1] as number)
        )
      }
    }
    case 'macd': {
      const { dif, dea } = calcMACD(closes)
      return {
        lines: [
          { name: 'DIF', color: '#1e5fd0', values: dif, pane: 1 },
          { name: 'DEA', color: '#f2b04b', values: dea, pane: 1 }
        ],
        markers: runStrategy(data, (i) => crossAbove(dif, dea, i), (i) => crossBelow(dif, dea, i))
      }
    }
    case 'rsi-reversal': {
      const r = calcRSI(closes)
      return {
        lines: [{ name: 'RSI(14)', color: '#ab47bc', values: r, pane: 1, priceLines: [30, 50, 70] }],
        markers: runStrategy(
          data,
          (i) => r[i - 1] != null && r[i] != null && (r[i - 1] as number) < 30 && (r[i] as number) >= 30,
          (i) => r[i - 1] != null && r[i] != null && (r[i - 1] as number) > 70 && (r[i] as number) <= 70
        )
      }
    }
    case 'rsi-momentum': {
      const r = calcRSI(closes)
      const ma20 = calcSMA(closes, 20)
      return {
        lines: [{ name: 'RSI(14)', color: '#ab47bc', values: r, pane: 1, priceLines: [30, 50, 70] }],
        markers: runStrategy(
          data,
          (i) => r[i - 1] != null && r[i] != null && (r[i - 1] as number) < 50 && (r[i] as number) >= 50 && ma20[i] != null && closes[i] > (ma20[i] as number),
          (i) => r[i - 1] != null && r[i] != null && (r[i - 1] as number) > 50 && (r[i] as number) <= 50
        )
      }
    }
    case 'kdj': {
      const { k, d } = calcKDJ(data)
      return {
        lines: [
          { name: 'K', color: '#1e5fd0', values: k, pane: 1, priceLines: [20, 80] },
          { name: 'D', color: '#f2b04b', values: d, pane: 1 }
        ],
        markers: runStrategy(
          data,
          (i) => crossAbove(k, d, i) && (k[i] as number) < 40,
          (i) => crossBelow(k, d, i) && (k[i] as number) > 60
        )
      }
    }
    case 'grid': {
      // 网格策略只画 5 条水平网格线（等分价格区间），买卖发生在各层触点，由文字说明
      const lo = Math.min(...data.map((d) => d.low))
      const hi = Math.max(...data.map((d) => d.high))
      const lines: StratLine[] = []
      for (let k = 0; k < 5; k++) {
        const lv = lo + ((hi - lo) * (k + 1)) / 6
        lines.push({
          name: `网格${k + 1}`,
          color: k % 2 ? 'rgba(158,158,158,0.6)' : 'rgba(117,117,117,0.6)',
          values: closes.map(() => Number(lv.toFixed(2)))
        })
      }
      return { lines, markers: [] }
    }
    case 'sar': {
      return {
        lines: [{ name: 'SAR', color: '#7b1fa2', values: calcSAR(data) }],
        markers: []
      }
    }
    case 'obv': {
      return {
        lines: [{ name: 'OBV', color: '#1e5fd0', values: calcOBV(data), pane: 1 }],
        markers: []
      }
    }
    case 'vwap': {
      return {
        lines: [{ name: 'VWAP', color: '#e69138', values: calcVWAP(data) }],
        markers: []
      }
    }
    case 'cmf': {
      return {
        lines: [{ name: 'CMF', color: '#1e5fd0', values: calcCMF(data), pane: 1 }],
        markers: []
      }
    }
    case 'roc': {
      return {
        lines: [{ name: 'ROC(12)', color: '#1e5fd0', values: calcROC(closes), pane: 1, priceLines: [0] }],
        markers: []
      }
    }
    case 'ichimoku': {
      const { conversion, base, leadingA, leadingB, lagging } = calcIchimoku(data)
      return {
        lines: [
          { name: '转换线', color: '#1e5fd0', values: conversion },
          { name: '基准线', color: '#ef5350', values: base },
          { name: '先行带A', color: '#26a69a', values: leadingA },
          { name: '先行带B', color: '#7b1fa2', values: leadingB },
          { name: '迟行线', color: '#e69138', values: lagging }
        ],
        markers: []
      }
    }
    case 'pivot-points': {
      const { p, r1, s1 } = calcPivot(data)
      const flat = (v: number): (number | null)[] => closes.map(() => Number(v.toFixed(2)))
      return {
        lines: [
          { name: 'P', color: '#1e5fd0', values: flat(p) },
          { name: 'R1', color: '#ef5350', values: flat(r1) },
          { name: 'S1', color: '#26a69a', values: flat(s1) }
        ],
        markers: []
      }
    }
    default:
      return { lines: props.lines, markers: props.markers }
  }
}

function setFrame(start: number, end: number) {
  currentEnd = end
  if (!chart || !mainSeries) return
  if (props.variant === 'line') {
    ;(mainSeries as ISeriesApi<'Line'>).setData(allData.value.slice(0, end).map((d) => ({
      time: d.time as unknown as string,
      value: d.close
    })))
  } else {
    ;(mainSeries as ISeriesApi<'Candlestick'>).setData(allData.value.slice(0, end).map((d) => ({
      time: d.time as unknown as string,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    })))
  }
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
  mainSeries = props.variant === 'line'
    ? chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2 })
    : chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
        wickUpColor: '#26a69a', wickDownColor: '#ef5350'
      })
  effectiveLines.value.forEach((line) => {
    const s = chart!.addSeries(LineSeries, { color: line.color, lineWidth: 2, paneIndex: line.pane ?? 0 })
    // 指标窗格的参考线（如 RSI 的 30/50/70、KDJ 的 20/80）
    if (line.priceLines?.length) {
      line.priceLines.forEach((p) => {
        s.createPriceLine({ price: p, color: 'rgba(128,128,128,0.7)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false })
      })
    }
    lineSeries.push(s)
  })
  // v5: 买卖点标注用 createSeriesMarkers 插件
  markersPlugin = createSeriesMarkers(mainSeries as ISeriesApi<'Line'>, [], {})
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
    <div v-if="legendItems.length" class="chart-legend" aria-label="图例">
      <span v-for="(it, idx) in legendItems" :key="idx" class="chart-legend-item">
        <i v-if="it.glyph" class="chart-legend-glyph" :style="{ color: it.color }">{{ it.glyph }}</i>
        <i v-else class="chart-legend-swatch" :style="{ background: it.color }"></i>
        {{ it.label }}
      </span>
    </div>
    <div ref="containerRef" :style="{ height: chartHeight + 'px', width: '100%' }"></div>
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
