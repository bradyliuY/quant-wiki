/**
 * 回测引擎纯函数库
 * 输入合成 OHLC + 策略参数，输出交易列表 / 净值曲线 / 绩效指标
 * 与 lib/indicators.ts 同风格，供 BacktestLab 组件复用
 */
import { calcATR, calcBollinger, calcSMA, type OHLC } from './indicators'

export type StrategyKey = 'ma-cross' | 'bollinger'

export interface BacktestParams {
  /** 双均线：快线周期 */
  fast: number
  /** 双均线：慢线周期 */
  slow: number
  /** 布林：周期 */
  period: number
  /** 布林：标准差倍数 */
  mult: number
  /** 单笔风险 %（占总资金） */
  riskPct: number
}

export interface Trade {
  entryTime: number
  entryPrice: number
  exitTime: number
  exitPrice: number
  /** 单笔收益率 %（相对入场价） */
  pnlPct: number
  /** 对净值贡献（起始资金 = 1 时即净值增量） */
  pnl: number
}

export interface BacktestResult {
  trades: Trade[]
  /** 净值曲线（按日 mark-to-market） */
  equity: { time: number; value: number }[]
  markers: { time: number; side: 'buy' | 'sell' }[]
  metrics: {
    annualReturn: number
    maxDrawdown: number
    winRate: number
    profitFactor: number
    tradeCount: number
  }
}

/** 策略元信息：给 UI 渲染参数滑块 */
export const STRATEGIES: Record<
  StrategyKey,
  {
    name: string
    params: {
      key: keyof BacktestParams
      label: string
      min: number
      max: number
      step: number
      def: number
    }[]
  }
> = {
  'ma-cross': {
    name: '双均线交叉',
    params: [
      { key: 'fast', label: '快线周期', min: 3, max: 30, step: 1, def: 5 },
      { key: 'slow', label: '慢线周期', min: 10, max: 80, step: 1, def: 20 },
      { key: 'riskPct', label: '单笔风险 %', min: 0.5, max: 5, step: 0.5, def: 2 }
    ]
  },
  bollinger: {
    name: '布林带回归',
    params: [
      { key: 'period', label: '周期', min: 10, max: 40, step: 1, def: 20 },
      { key: 'mult', label: '标准差倍数', min: 1.5, max: 3, step: 0.1, def: 2 },
      { key: 'riskPct', label: '单笔风险 %', min: 0.5, max: 5, step: 0.5, def: 2 }
    ]
  }
}

/**
 * 生成带趋势段/震荡段的合成回测数据（纯教学用，非真实行情）
 * 4 段行情：震荡 → 上升 → 震荡 → 下降，让趋势/回归策略各有胜负场景
 */
export function genBacktestData(n = 300, seed = 7): OHLC[] {
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
    let drift: number
    let wave: number
    if (i < 75) {
      drift = (100 - price) * 0.06 // 震荡（拉回 100）
      wave = Math.sin(i / 5) * 2.2
    } else if (i < 150) {
      drift = 0.38 // 上升趋势
      wave = Math.sin(i / 9) * 0.7
    } else if (i < 225) {
      drift = (100 - price) * 0.06 // 震荡
      wave = Math.sin(i / 5) * 2.2
    } else {
      drift = -0.38 // 下降趋势
      wave = Math.sin(i / 9) * 0.7
    }
    const gap = (rand() - 0.5) * 6
    const open = price
    const close = open + drift + wave + gap * 0.4
    const high = Math.max(open, close) + rand() * 1.6
    const low = Math.min(open, close) - rand() * 1.6
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

function closeTrade(
  trades: Trade[],
  position: { entryTime: number; entryPrice: number; shares: number },
  exitPrice: number,
  exitTime: number
) {
  const pnl = position.shares * (exitPrice - position.entryPrice)
  trades.push({
    entryTime: position.entryTime,
    entryPrice: position.entryPrice,
    exitTime,
    exitPrice,
    pnlPct: ((exitPrice - position.entryPrice) / position.entryPrice) * 100,
    pnl
  })
}

/**
 * 运行一次回测
 * 信号在 bar 收盘后产生、次根 bar 开盘成交（避免前视）；ATR(2) 止损；单笔风险仓位
 */
export function runBacktest(
  bars: OHLC[],
  strategy: StrategyKey,
  params: BacktestParams
): BacktestResult {
  const closes = bars.map((b) => b.close)
  const atrArr = calcATR(bars, 14)
  const fastArr = calcSMA(closes, params.fast)
  const slowArr = calcSMA(closes, params.slow)
  const boll = calcBollinger(closes, params.period, params.mult)

  const trades: Trade[] = []
  const markers: { time: number; side: 'buy' | 'sell' }[] = []
  const equityByBar: (number | null)[] = bars.map(() => null)

  let cash = 1
  let position: { entryTime: number; entryPrice: number; shares: number; stop: number } | null =
    null
  let pending: 'buy' | 'sell' | null = null
  let atrFallback = 0

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    if (atrArr[i] !== null && atrArr[i]! > 0) atrFallback = atrArr[i]!

    // ① 执行上一根 bar 收盘产生的信号：本根开盘成交
    if (pending === 'buy' && !position) {
      const atr = atrFallback || bar.close * 0.03
      const stop = bar.open - 2 * atr
      const stopDist = (bar.open - stop) / bar.open
      if (stopDist > 0) {
        const posValue = (cash * params.riskPct) / 100 / stopDist
        position = {
          entryTime: bar.time,
          entryPrice: bar.open,
          shares: posValue / bar.open,
          stop
        }
        markers.push({ time: bar.time, side: 'buy' })
      }
    } else if (pending === 'sell' && position) {
      closeTrade(trades, position, bar.open, bar.time)
      markers.push({ time: bar.time, side: 'sell' })
      position = null
    }
    pending = null

    // ② 日内止损：盘中触及止损价即离场
    if (position && bar.low <= position.stop) {
      closeTrade(trades, position, position.stop, bar.time)
      markers.push({ time: bar.time, side: 'sell' })
      position = null
    }

    // ③ 收盘后算信号（供下一根 bar 开盘执行）
    if (strategy === 'ma-cross') {
      const f = fastArr[i]
      const s = slowArr[i]
      const pf = fastArr[i - 1]
      const ps = slowArr[i - 1]
      if (f !== null && s !== null && pf !== null && ps !== null) {
        if (!position && pf <= ps && f > s) pending = 'buy'
        else if (position && pf >= ps && f < s) pending = 'sell'
      }
    } else {
      const lo = boll.lower[i]
      const plo = boll.lower[i - 1]
      const mid = boll.mid[i]
      if (!position && lo !== null && plo !== null && bar.low <= plo && bar.close >= lo) {
        pending = 'buy'
      } else if (position && mid !== null && bar.close > mid) {
        pending = 'sell'
      }
    }

    // ④ 结算净值（mark-to-market）
    if (i >= 1) {
      equityByBar[i] =
        cash + (position ? (position.shares * bar.close) / position.entryPrice : 0)
    }
  }

  // 末根仍持仓则按收盘平仓收尾
  if (position) {
    closeTrade(trades, position, bars[bars.length - 1].close, bars[bars.length - 1].time)
    markers.push({ time: bars[bars.length - 1].time, side: 'sell' })
  }

  const equity = bars
    .map((b, i) => (equityByBar[i] !== null ? { time: b.time, value: equityByBar[i]! } : null))
    .filter((x): x is { time: number; value: number } => x !== null)

  const finalEquity = equity.length ? equity[equity.length - 1].value : 1
  let peak = 1
  let maxDd = 0
  for (const p of equity) {
    if (p.value > peak) peak = p.value
    const dd = (peak - p.value) / peak
    if (dd > maxDd) maxDd = dd
  }

  const wins = trades.filter((t) => t.pnl > 0)
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = trades.filter((t) => t.pnl <= 0).reduce((s, t) => s + Math.abs(t.pnl), 0)

  return {
    trades,
    equity,
    markers,
    metrics: {
      annualReturn: Math.pow(Math.max(finalEquity, 1e-9), 252 / bars.length) - 1,
      maxDrawdown: maxDd,
      winRate: trades.length ? wins.length / trades.length : 0,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
      tradeCount: trades.length
    }
  }
}

/** 参数网格扫描，返回按年化收益排序的最优参数（教学用：演示过拟合） */
export function findBestParams(
  bars: OHLC[],
  strategy: StrategyKey,
  base: BacktestParams
): { params: BacktestParams; result: BacktestResult } {
  let best: { params: BacktestParams; result: BacktestResult } | null = null
  const grid =
    strategy === 'ma-cross'
      ? [5, 8, 10, 13, 15, 20].flatMap((f) =>
          [20, 30, 40, 50, 60].filter((s) => s > f).map((s) => ({ ...base, fast: f, slow: s }))
        )
      : [10, 15, 20, 25, 30].flatMap((p) =>
          [1.5, 2, 2.5, 3].map((m) => ({ ...base, period: p, mult: m }))
        )
  for (const p of grid) {
    const r = runBacktest(bars, strategy, p)
    if (!best || r.metrics.annualReturn > best.result.metrics.annualReturn) {
      best = { params: p, result: r }
    }
  }
  return best!
}
