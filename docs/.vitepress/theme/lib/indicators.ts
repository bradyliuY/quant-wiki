/**
 * 技术指标纯函数计算库
 * 输入 OHLC 数组，输出指标序列，供图表组件复用
 */

export interface OHLC {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface Point {
  time: number
  value: number
}

/** 简单移动平均 */
export function calcSMA(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null)
  if (period <= 0 || closes.length < period) return out
  let sum = 0
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i]
    if (i >= period) sum -= closes[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

/** 指数移动平均 */
export function calcEMA(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null)
  if (period <= 0 || closes.length < period) return out
  const k = 2 / (period + 1)
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period - 1] = ema
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
    out[i] = ema
  }
  return out
}

/** RSI(14)：Wilder 平滑 */
export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null)
  if (closes.length <= period) return out
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) avgGain += diff
    else avgLoss -= diff
  }
  avgGain /= period
  avgLoss /= period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

export interface MACDResult {
  dif: (number | null)[]
  dea: (number | null)[]
  hist: (number | null)[]
}

/** MACD(12,26,9) */
export function calcMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9
): MACDResult {
  const emaFast = calcEMA(closes, fast)
  const emaSlow = calcEMA(closes, slow)
  const dif: (number | null)[] = closes.map(() => null)
  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      dif[i] = (emaFast[i] as number) - (emaSlow[i] as number)
    }
  }
  const dea: (number | null)[] = closes.map(() => null)
  const difVals: (number | null)[] = dif
  // DEA = 对 DIF 做 EMA
  const deaRaw = calcEMA(difVals.map((v) => v ?? 0), signal)
  let deaSeed = 0
  let seedCount = 0
  for (let i = 0; i < difVals.length; i++) {
    if (difVals[i] !== null) {
      if (seedCount < signal) {
        deaSeed += difVals[i] as number
        seedCount++
        if (seedCount === signal) {
          deaSeed /= signal
          dea[i] = deaSeed
        }
      } else if (seedCount === signal) {
        deaSeed = deaSeed * ((signal - 1) / (signal + 1)) + (difVals[i] as number) * (2 / (signal + 1))
        dea[i] = deaSeed
      }
    }
  }
  const hist: (number | null)[] = closes.map(() => null)
  for (let i = 0; i < closes.length; i++) {
    if (dif[i] !== null && dea[i] !== null) {
      hist[i] = (dif[i] as number) - (dea[i] as number)
    }
  }
  return { dif, dea, hist }
}

/** 布林带(20, 2) */
export function calcBollinger(
  closes: number[],
  period = 20,
  mult = 2
): { upper: (number | null)[]; mid: (number | null)[]; lower: (number | null)[] } {
  const mid = calcSMA(closes, period)
  const upper: (number | null)[] = closes.map(() => null)
  const lower: (number | null)[] = closes.map(() => null)
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = mid[i] as number
    const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period
    const std = Math.sqrt(variance)
    upper[i] = mean + mult * std
    lower[i] = mean - mult * std
  }
  return { upper, mid, lower }
}

/** ATR(14) */
export function calcATR(data: OHLC[], period = 14): (number | null)[] {
  const out: (number | null)[] = data.map(() => null)
  if (data.length <= period) return out
  const trs: number[] = []
  for (let i = 1; i < data.length; i++) {
    const h = data[i].high
    const l = data[i].low
    const pc = data[i - 1].close
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period] = atr
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period
    out[i + 1] = atr
  }
  return out
}

/** 随机指标 KDJ(9,3,3) */
export function calcKDJ(
  data: OHLC[],
  period = 9
): { k: (number | null)[]; d: (number | null)[]; j: (number | null)[] } {
  const k: (number | null)[] = data.map(() => null)
  const d: (number | null)[] = data.map(() => null)
  const j: (number | null)[] = data.map(() => null)
  let prevK = 50
  let prevD = 50
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1)
    const high = Math.max(...slice.map((s) => s.high))
    const low = Math.min(...slice.map((s) => s.low))
    const rsv = high === low ? 50 : ((data[i].close - low) / (high - low)) * 100
    const curK = (2 / 3) * prevK + (1 / 3) * rsv
    const curD = (2 / 3) * prevD + (1 / 3) * curK
    k[i] = curK
    d[i] = curD
    j[i] = 3 * curK - 2 * curD
    prevK = curK
    prevD = curD
  }
  return { k, d, j }
}

/** OBV */
export function calcOBV(data: OHLC[]): (number | null)[] {
  const out: (number | null)[] = data.map(() => null)
  let obv = 0
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) obv += data[i].volume ?? 0
    else if (data[i].close < data[i - 1].close) obv -= data[i].volume ?? 0
    out[i] = obv
  }
  out[0] = 0
  return out
}

/** 将指标数组转为图表 series 数据（跳过 null） */
export function toSeries(
  times: number[],
  values: (number | null)[]
): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = []
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null) out.push({ time: times[i], value: values[i] as number })
  }
  return out
}

/** 生成演示用的合成行情数据（正弦 + 趋势 + 噪声） */
export function genDemoData(n = 120, seed = 42): OHLC[] {
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
    // 均值回归 + 波段 + 单根实体：让 K 线实体清晰可辨
    const drift = (100 - price) * 0.06       // 温和拉回均值，控制价格范围
    const wave = Math.sin(i / 6) * 2.2        // 波段推动
    const gap = (rand() - 0.5) * 7            // 单根涨跌 → 明显实体
    const open = price
    const close = open + drift + wave * 0.35 + gap
    const high = Math.max(open, close) + rand() * 1.8
    const low = Math.min(open, close) - rand() * 1.8
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
