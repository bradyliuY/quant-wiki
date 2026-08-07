<script setup lang="ts">
/**
 * 指标计算演示组件
 * 用一段示例价格序列，通过滑动窗口逐步展示 SMA / EMA / RSI / 布林带 / MACD / CCI / KDJ / W%R / ATR / MFI / OBV 的计算过程。
 * 教学用途：读者可跟随每一步，验证结果。
 * OHLC 系列模式（cci/kdj/wr/atr/mfi/obv）使用内置 BARS（H+L=2C，TP=C），单元格下方显示 H/L 或成交量。
 *
 * 用法：
 * <CalcDemo indicator="sma" period="5" title="MA5 计算演示" />
 * <CalcDemo indicator="macd" title="MACD 计算演示" />
 * <CalcDemo indicator="mfi" period="5" title="MFI 计算演示" />
 */
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    indicator?: 'sma' | 'ema' | 'rsi' | 'boll' | 'macd' | 'cci' | 'kdj' | 'wr' | 'atr' | 'mfi' | 'obv'
    period?: number
    title?: string
  }>(),
  { indicator: 'sma', period: 5, title: '指标计算演示' }
)

/** 周期归一化为数字：Vue 类型声明不生成运行时 Number 类型，period="5" 会以字符串进入，导致 "5"+1=51、slice(1,51) 等错误 */
const periodN = computed(() => Math.max(1, Number(props.period) || 5))

/** 示例收盘价序列（教学用合成数据，非真实行情） */
// MACD 需要 ≥26 天数据，用长序列；其他指标用短序列便于演示
const PRICES_SHORT = [100, 101.5, 102.3, 101.8, 103.2, 104.5, 103.9, 105.1, 106.8, 105.9, 107.2, 108.5, 109.1, 108.4, 110.2]
const PRICES_LONG = (() => {
  const arr: number[] = []
  let p = 100
  for (let i = 0; i < 45; i++) {
    const wave = Math.sin(i / 5) * 2.5
    const drift = (105 - p) * 0.04
    const noise = ((i * 37) % 13) / 13 - 0.5 // 确定性伪随机
    p = p + drift + wave * 0.4 + noise * 2
    arr.push(Math.round(p * 10) / 10)
  }
  return arr
})()
/** 示例 OHLCV 序列（教学用合成数据，非真实行情）：H+L=2C 使 TP=C，便于手算核对 */
const BARS = [
  { h: 104, l: 98, c: 101, v: 40 },
  { h: 105, l: 101, c: 103, v: 50 },
  { h: 106, l: 102, c: 104, v: 60 },
  { h: 104, l: 98, c: 101, v: 35 },
  { h: 107, l: 103, c: 105, v: 80 },
  { h: 108, l: 104, c: 106, v: 90 },
  { h: 110, l: 106, c: 108, v: 110 },
  { h: 107, l: 103, c: 105, v: 60 },
  { h: 111, l: 107, c: 109, v: 120 },
  { h: 112, l: 108, c: 110, v: 130 },
  { h: 109, l: 105, c: 107, v: 70 },
  { h: 113, l: 109, c: 111, v: 140 },
  { h: 114, l: 110, c: 112, v: 150 },
  { h: 110, l: 106, c: 108, v: 80 },
  { h: 115, l: 111, c: 113, v: 160 }
]
const isMacd = computed(() => props.indicator === 'macd')
const isOhlc = computed(() => ['cci', 'kdj', 'wr', 'atr', 'mfi', 'obv'].includes(props.indicator))
const PRICES = computed(() => {
  if (isOhlc.value) return BARS.map((b) => b.c)
  return isMacd.value ? PRICES_LONG : PRICES_SHORT
})
const DAYS = computed(() => PRICES.value.length)
// MACD 从第 26 天开始（EMA26 需要种子）；OBV 从第 2 天开始（需前收盘）；其余从 period 开始
const startIdx = computed(() => {
  if (isMacd.value) return 26
  if (props.indicator === 'obv') return 1
  return periodN.value
})
const cursor = ref(startIdx.value)
const playing = ref(false)
const speed = ref(1)
let timer: ReturnType<typeof setInterval> | null = null

// 窗口（用于 SMA / 布林带）：含 cursor 在内的最近 period 天
const windowStart = computed(() => Math.max(0, cursor.value - periodN.value + 1))
const windowData = computed(() => PRICES.value.slice(windowStart.value, cursor.value + 1))

/** 计算 SMA */
function calcSMA(idx: number): number {
  const start = Math.max(0, idx - periodN.value + 1)
  const slice = PRICES.value.slice(start, idx + 1)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/** 计算 EMA（指数平滑） */
function calcEMA(idx: number): number {
  const alpha = 2 / (periodN.value + 1)
  // 首个值用 SMA 做种子
  let ema = PRICES.value.slice(0, periodN.value).reduce((a, b) => a + b, 0) / periodN.value
  for (let i = periodN.value; i <= idx; i++) {
    ema = alpha * PRICES.value[i] + (1 - alpha) * ema
  }
  return ema
}

/** 计算指定周期的 EMA（MACD 用，周期参数独立） */
function calcEMAperiod(idx: number, period: number): number {
  const alpha = 2 / (period + 1)
  // 种子：可用数据不足 period 时用全部可用数据；否则用前 period 个
  const seedLen = Math.min(period, PRICES.value.length)
  let ema = PRICES.value.slice(0, seedLen).reduce((a, b) => a + b, 0) / seedLen
  for (let i = period; i <= idx; i++) {
    ema = alpha * PRICES.value[i] + (1 - alpha) * ema
  }
  return ema
}

/** 对任意序列计算 EMA（MACD 的 DEA 用） */
function calcEMAonSeries(series: number[], period: number): number {
  const alpha = 2 / (period + 1)
  let ema = series[0]
  for (let i = 1; i < series.length; i++) {
    ema = alpha * series[i] + (1 - alpha) * ema
  }
  return ema
}

/** 计算 RSI(14) 的涨跌均值 */
function calcRSI(idx: number): number {
  if (idx < 2) return 50
  const slice = PRICES.value.slice(0, idx + 1)
  let gains = 0
  let losses = 0
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1]
    if (diff >= 0) gains += diff
    else losses += -diff
  }
  const avgGain = gains / (slice.length - 1)
  const avgLoss = losses / (slice.length - 1)
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** 布林带：中轨 + 上下轨 */
function calcBoll(idx: number) {
  const slice = PRICES.value.slice(windowStart.value, idx + 1)
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length
  const sd = Math.sqrt(variance)
  return { mid: mean, upper: mean + 2 * sd, lower: mean - 2 * sd }
}

/** CCI：典型价格 TP、均值 MA、平均绝对偏差 MD、CCI 值 */
function calcCCI(idx: number) {
  const s = Math.max(0, idx - periodN.value + 1)
  const bars = BARS.slice(s, idx + 1)
  const tps = bars.map((b) => (b.h + b.l + b.c) / 3)
  const ma = tps.reduce((a, b) => a + b, 0) / tps.length
  const md = tps.reduce((a, t) => a + Math.abs(t - ma), 0) / tps.length
  const cci = (tps[tps.length - 1] - ma) / (0.015 * md)
  return { tps, ma, md, cci }
}

/** KDJ：窗口 HH/LL → RSV，K/D 从 50 起步递推 */
function calcKDJ(idx: number) {
  const s = Math.max(0, idx - periodN.value + 1)
  const bars = BARS.slice(s, idx + 1)
  const hh = Math.max(...bars.map((b) => b.h))
  const ll = Math.min(...bars.map((b) => b.l))
  const c = BARS[idx].c
  const rsv = hh === ll ? 50 : ((c - ll) / (hh - ll)) * 100
  let K = 50
  let D = 50
  for (let i = 0; i <= idx; i++) {
    const ws = Math.max(0, i - periodN.value + 1)
    const wb = BARS.slice(ws, i + 1)
    const h2 = Math.max(...wb.map((b) => b.h))
    const l2 = Math.min(...wb.map((b) => b.l))
    const r2 = h2 === l2 ? 50 : ((BARS[i].c - l2) / (h2 - l2)) * 100
    K = (2 / 3) * K + (1 / 3) * r2
    D = (2 / 3) * D + (1 / 3) * K
  }
  const J = 3 * K - 2 * D
  return { hh, ll, c, rsv, K, D, J }
}

/** 威廉 %R：取负值 −100~0（越接近 0 越超买，−80 以下超卖） */
function calcWR(idx: number) {
  const s = Math.max(0, idx - periodN.value + 1)
  const bars = BARS.slice(s, idx + 1)
  const hh = Math.max(...bars.map((b) => b.h))
  const ll = Math.min(...bars.map((b) => b.l))
  const c = BARS[idx].c
  const wr = hh === ll ? 0 : -((hh - c) / (hh - ll)) * 100
  return { hh, ll, c, wr }
}

/** ATR：逐日 TR，再取窗口内平均 */
function calcATR(idx: number) {
  const trs: number[] = []
  for (let i = 1; i <= idx; i++) {
    const b = BARS[i]
    const prev = BARS[i - 1]
    trs.push(Math.max(b.h - b.l, Math.abs(b.h - prev.c), Math.abs(b.l - prev.c)))
  }
  const windowTrs = trs.slice(Math.max(0, trs.length - periodN.value))
  const atr = windowTrs.reduce((a, b) => a + b, 0) / windowTrs.length
  return { trs: windowTrs, atr }
}

/** MFI：MF = TP×V，窗口内正/负资金流，MFI = 100 − 100/(1+MFR) */
function calcMFI(idx: number) {
  const s = Math.max(0, idx - periodN.value + 1)
  let pos = 0
  let neg = 0
  for (let i = s; i <= idx; i++) {
    const b = BARS[i]
    const tp = (b.h + b.l + b.c) / 3
    const mf = tp * b.v
    const up = i === s ? b.c >= (s > 0 ? BARS[s - 1].c : b.c) : b.c >= BARS[i - 1].c
    if (up) pos += mf
    else neg += mf
  }
  const mfr = neg === 0 ? Infinity : pos / neg
  const mfi = neg === 0 ? 100 : 100 - 100 / (1 + mfr)
  return { pos, neg, mfr, mfi }
}

/** OBV：涨加跌减的累计成交量（首日作正向起点） */
function calcOBV(idx: number): number {
  let obv = BARS[0].v
  for (let i = 1; i <= idx; i++) {
    const b = BARS[i]
    if (b.c > BARS[i - 1].c) obv += b.v
    else if (b.c < BARS[i - 1].c) obv -= b.v
  }
  return obv
}

/** 当前结果的展示 */
const result = computed(() => {
  const idx = cursor.value
  const start = Math.max(0, idx - periodN.value + 1)
  const slice = PRICES.value.slice(start, idx + 1)
  const sum = slice.reduce((a, b) => a + b, 0)

  switch (props.indicator) {
    case 'sma': {
      const v = calcSMA(idx)
      return {
        formula: `MA${periodN.value} = (${slice.map((n) => n.toFixed(1)).join(' + ')}) / ${slice.length}`,
        detail: `窗口内 ${slice.length} 天收盘价之和 ${sum.toFixed(1)} ÷ ${slice.length} = ${v.toFixed(2)}`,
        value: v
      }
    }
    case 'ema': {
      const v = calcEMA(idx)
      const alpha = 2 / (periodN.value + 1)
      return {
        formula: `EMA = α×C(t) + (1−α)×EMA(t−1)，α = 2/(n+1) = ${alpha.toFixed(4)}`,
        detail: `第 ${idx + 1} 天 EMA = ${v.toFixed(2)}（从首 ${periodN.value} 天 SMA 种子递推）`,
        value: v
      }
    }
    case 'rsi': {
      const v = calcRSI(idx)
      return {
        formula: `RSI = 100 − 100/(1 + RS)，RS = 平均涨幅/平均跌幅`,
        detail: `第 ${idx + 1} 天 RSI ≈ ${v.toFixed(1)}（50 上=多头，50 下=空头）`,
        value: v
      }
    }
    case 'boll': {
      const b = calcBoll(idx)
      return {
        formula: `中轨 = SMA${periodN.value}，上/下轨 = 中轨 ± 2×σ`,
        detail: `中轨 ${b.mid.toFixed(2)}，上轨 ${b.upper.toFixed(2)}，下轨 ${b.lower.toFixed(2)}`,
        value: b.mid
      }
    }
    case 'macd': {
      const ema12 = calcEMAperiod(idx, 12)
      const ema26 = calcEMAperiod(idx, 26)
      const dif = ema12 - ema26
      // DEA = EMA(DIF, 9)：用 DIF 序列的 EMA
      const difSeries: number[] = []
      for (let i = 0; i <= idx; i++) {
        difSeries.push(calcEMAperiod(i, 12) - calcEMAperiod(i, 26))
      }
      const dea = calcEMAonSeries(difSeries, 9)
      const bar = 2 * (dif - dea)
      return {
        formula: `DIF = EMA12 − EMA26，DEA = EMA(DIF,9)，柱 = 2×(DIF−DEA)`,
        detail: `第 ${idx + 1} 天：EMA12=${ema12.toFixed(2)}，EMA26=${ema26.toFixed(2)}，DIF=${dif.toFixed(2)}，DEA=${dea.toFixed(2)}`,
        value: dif,
        extra: { dea: dea.toFixed(2), bar: bar.toFixed(2) }
      }
    }
    case 'cci': {
      const { tps, ma, md, cci } = calcCCI(idx)
      return {
        formula: `CCI = (TP − MA) / (0.015 × MD)`,
        detail: `窗口 TP：${tps.map((t) => t.toFixed(1)).join('、')}，MA=${ma.toFixed(2)}，MD=${md.toFixed(2)}`,
        value: cci
      }
    }
    case 'kdj': {
      const { hh, ll, rsv, K, D, J } = calcKDJ(idx)
      return {
        formula: `RSV = (C−LL)/(HH−LL)×100；K=⅔K₋₁+⅓RSV；D=⅔D₋₁+⅓K；J=3K−2D`,
        detail: `第 ${idx + 1} 天窗口 HH=${hh}、LL=${ll}，RSV=${rsv.toFixed(1)}`,
        value: K,
        extra: { k: K.toFixed(2), d: D.toFixed(2), j: J.toFixed(2) }
      }
    }
    case 'wr': {
      const { hh, ll, c, wr } = calcWR(idx)
      return {
        formula: `W%R = −(HH−C)/(HH−LL)×100（0 ~ −100，越接近 0 越超买）`,
        detail: `第 ${idx + 1} 天窗口 HH=${hh}、LL=${ll}，收盘 C=${c}`,
        value: wr
      }
    }
    case 'atr': {
      const { trs, atr } = calcATR(idx)
      return {
        formula: `TR = max(H−L, |H−C₋₁|, |L−C₋₁|)；ATR = 窗口内 TR 平均`,
        detail: `第 ${idx + 1} 天窗口 TR：${trs.join('、')} → 平均 ${atr.toFixed(2)}`,
        value: atr
      }
    }
    case 'mfi': {
      const { pos, neg, mfr, mfi } = calcMFI(idx)
      return {
        formula: `MF = TP×V；MFR = Σ+MF / Σ−MF；MFI = 100 − 100/(1+MFR)`,
        detail: `窗口正向资金流 ${pos.toFixed(0)}，负向 ${neg.toFixed(0)}，MFR=${mfr.toFixed(2)}`,
        value: mfi
      }
    }
    case 'obv': {
      const obv = calcOBV(idx)
      return {
        formula: `OBV = OBV₋₁ ± 成交量（收涨加、收跌减）`,
        detail: `第 ${idx + 1} 天累计 OBV = ${obv}`,
        value: obv
      }
    }
  }
})

const progress = computed(() => (cursor.value - startIdx.value) / (DAYS.value - startIdx.value))

/** OHLC 模式价格格副行：累计 OBV / 成交量 / 高低价 */
function cellSub(i: number): string {
  if (props.indicator === 'obv') return `OBV ${calcOBV(i)}`
  if (props.indicator === 'mfi') return `V${BARS[i].v}`
  if (isOhlc.value) return `${BARS[i].h}/${BARS[i].l}`
  return ''
}

function step() {
  if (cursor.value < DAYS.value - 1) cursor.value++
  else stop()
}

function togglePlay() {
  if (playing.value) stop()
  else {
    playing.value = true
    timer = setInterval(() => {
      if (cursor.value >= DAYS.value - 1) stop()
      else cursor.value++
    }, 900 / speed.value)
  }
}

function stop() {
  playing.value = false
  if (timer) clearInterval(timer)
  timer = null
}

function reset() {
  stop()
  cursor.value = startIdx.value
}

watch(() => props.indicator, reset)
watch(() => periodN.value, reset)
</script>

<template>
  <div class="chart-container calc-demo">
    <div v-if="title" class="demo-title">{{ title }}</div>

    <!-- 示例数据 + 滑动窗口 -->
    <div class="calc-zone">
      <div class="calc-labels">
        <span class="calc-hint">下方为示例收盘价序列（教学用合成数据）</span>
        <span class="calc-day">第 {{ cursor + 1 }} 天 · 窗口 [{{ windowStart + 1 }}–{{ cursor + 1 }}]</span>
      </div>
      <div class="price-bars">
        <div
          v-for="(p, i) in PRICES"
          :key="i"
          class="price-cell"
          :class="{
            'in-window': i >= windowStart && i <= cursor,
            'is-last': i === cursor
          }"
        >
          <div class="price-val">{{ p.toFixed(1) }}</div>
          <div v-if="cellSub(i)" class="price-sub">{{ cellSub(i) }}</div>
          <div class="price-day">D{{ i + 1 }}</div>
        </div>
      </div>
      <div v-if="windowData.length && indicator !== 'obv'" class="window-bar">
        <div class="window-label">当前计算窗口</div>
        <div class="window-values">
          <span v-for="(w, i) in windowData" :key="i" class="window-item">{{ w.toFixed(1) }}</span>
        </div>
      </div>
    </div>

    <!-- 计算过程 -->
    <div class="calc-process">
      <div class="calc-formula">{{ result.formula }}</div>
      <div class="calc-detail">{{ result.detail }}</div>
      <div v-if="(result as any).extra" class="calc-extra">
        <template v-if="indicator === 'macd'">
          <span class="extra-item">DEA <b>{{ (result as any).extra.dea }}</b></span>
          <span class="extra-item">MACD 柱 <b>{{ (result as any).extra.bar }}</b></span>
        </template>
        <template v-else-if="indicator === 'kdj'">
          <span class="extra-item">K <b>{{ (result as any).extra.k }}</b></span>
          <span class="extra-item">D <b>{{ (result as any).extra.d }}</b></span>
          <span class="extra-item">J <b>{{ (result as any).extra.j }}</b></span>
        </template>
      </div>
      <div class="calc-result">
        <span class="result-label">{{ indicator.toUpperCase() }} 当前值</span>
        <span class="result-value">{{ result.value.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 进度 + 控制 -->
    <div class="demo-controls">
      <button @click="togglePlay">{{ playing ? '⏸ 暂停' : '▶ 自动播放' }}</button>
      <button @click="step">⏭ 下一步</button>
      <button @click="reset">↺ 重置</button>
      <input
        type="range"
        min="0"
        max="100"
        :value="progress * 100"
        @input="(e) => { const v = Number((e.target as HTMLInputElement).value); cursor.value = Math.round(startIdx.value + (DAYS.value - startIdx.value) * v / 100) }"
        style="flex: 1"
      />
      <select :value="speed" @change="(e) => { speed.value = Number((e.target as HTMLSelectElement).value) }">
        <option :value="0.5">0.5x</option>
        <option :value="1">1x</option>
        <option :value="2">2x</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.calc-demo {
  padding: 0 0 8px;
}
.calc-zone {
  padding: 14px 16px 10px;
}
.calc-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}
.calc-hint { color: #999; }
.calc-day {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.price-bars {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.price-cell {
  min-width: 52px;
  padding: 6px 4px;
  text-align: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 12px;
  background: transparent;
  transition: all 0.3s;
}
.price-val { font-weight: 600; font-variant-numeric: tabular-nums; }
.price-sub { color: #666; font-size: 11px; margin-top: 1px; font-variant-numeric: tabular-nums; }
.price-day { color: #999; font-size: 11px; margin-top: 2px; }
.price-cell.in-window {
  background: rgba(30, 95, 208, 0.08);
  border-color: var(--vp-c-brand-1);
}
.price-cell.is-last {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.price-cell.is-last .price-val { color: #fff; }
.price-cell.is-last .price-sub { color: rgba(255, 255, 255, 0.75); }
.price-cell.is-last .price-day { color: rgba(255,255,255,0.7); }

.window-bar {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(30, 95, 208, 0.05);
  border-radius: 6px;
  border: 1px dashed var(--vp-c-brand-1);
}
.window-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.window-values { display: flex; gap: 6px; flex-wrap: wrap; }
.window-item {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 2px 8px;
  background: #fff;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
.dark .window-item { background: #1e1e1e; }

.calc-process {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
  background: rgba(30, 95, 208, 0.03);
}
.calc-formula {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-brand-1);
  margin-bottom: 6px;
  overflow-wrap: break-word;
}
.calc-detail {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
}
.calc-extra {
  display: flex;
  gap: 14px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.extra-item b { color: var(--vp-c-brand-1); font-variant-numeric: tabular-nums; }
.calc-result {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.result-label { font-size: 12px; color: #888; }
.result-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-brand-1);
}
</style>
