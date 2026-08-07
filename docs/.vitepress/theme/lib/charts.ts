import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time
} from 'lightweight-charts'

export interface OHLC {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface KLineChartOptions {
  /** 是否显示成交量副图 */
  showVolume?: boolean
  /** 高度 px */
  height?: number
  /** 主题: light / dark */
  theme?: 'light' | 'dark'
}

export interface IndicatorSeriesApi {
  line: ISeriesApi<'Line'>
  setData: (data: { time: Time; value: number }[]) => void
}

const DARK = {
  background: '#1e1e1e',
  text: '#d4d4d4',
  grid: 'rgba(128,128,128,0.08)',
  up: '#26a69a',
  down: '#ef5350'
}

const LIGHT = {
  background: '#ffffff',
  text: '#333333',
  grid: 'rgba(0,0,0,0.06)',
  up: '#26a69a',
  down: '#ef5350'
}

/**
 * 创建带可选成交量的 K 线图
 * @param container 容器元素
 * @param data OHLC 数据（time 为秒级时间戳）
 * @param opts 配置
 */
export function createKLineChart(
  container: HTMLElement,
  data: OHLC[],
  opts: KLineChartOptions = {}
): IChartApi {
  const { showVolume = false, height = 320, theme = 'light' } = opts
  const colors = theme === 'dark' ? DARK : LIGHT

  const chart = createChart(container, {
    height,
    layout: {
      background: { type: ColorType.Solid, color: colors.background },
      textColor: colors.text
    },
    grid: {
      vertLines: { color: colors.grid },
      horzLines: { color: colors.grid }
    },
    rightPriceScale: { borderColor: colors.grid },
    timeScale: { borderColor: colors.grid, rightOffset: 4 },
    crosshair: {
      mode: 0,
      vertLine: { labelBackgroundColor: '#1e5fd0' },
      horzLine: { labelBackgroundColor: '#1e5fd0' }
    },
    autoSize: true
  })

  const candles: CandlestickData[] = data.map((d) => ({
    time: d.time as Time,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close
  }))

  const candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: colors.up,
    downColor: colors.down,
    borderVisible: false,
    wickUpColor: colors.up,
    wickDownColor: colors.down
  })
  candleSeries.setData(candles)

  if (showVolume) {
    const volumes = data.map((d) => ({
      time: d.time as Time,
      value: d.volume ?? 0,
      color: d.close >= d.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'
    }))
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol'
    })
    volumeSeries.setData(volumes)
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    })
  }

  chart.timeScale().fitContent()
  return chart
}

/**
 * 在已有图表上添加一个指标窗格（线图）
 */
export function addIndicatorPane(
  chart: IChartApi,
  height = 140,
  color = '#1e5fd0'
): IndicatorSeriesApi {
  const container = chart as unknown as { container: HTMLElement }
  // lightweight-charts v5 支持多窗格，通过 paneIndex 添加
  const paneIndex = 1
  const line = chart.addSeries(LineSeries, { color, lineWidth: 2, paneIndex })
  // 窗格高度通过 chart options 控制，这里返回 series 接口
  void container
  void height
  return {
    line,
    setData: (data) => {
      line.setData(data)
    }
  }
}

/**
 * 创建独立的单值指标图表（如 RSI/MACD 副图）
 * 用于多窗格场景：与主 K 线同容器，通过 paneIndex 分离
 */
export function createIndicatorChart(
  container: HTMLElement,
  opts: KLineChartOptions = {}
): { chart: IChartApi; addLine: (color?: string, pane?: number) => IndicatorSeriesApi } {
  const { height = 200, theme = 'light' } = opts
  const colors = theme === 'dark' ? DARK : LIGHT

  const chart = createChart(container, {
    height,
    layout: {
      background: { type: ColorType.Solid, color: colors.background },
      textColor: colors.text
    },
    grid: {
      vertLines: { color: colors.grid },
      horzLines: { color: colors.grid }
    },
    autoSize: true
  })

  return {
    chart,
    addLine: (color = '#1e5fd0', pane = 0) => {
      const line = chart.addSeries(LineSeries, { color, lineWidth: 2, paneIndex: pane })
      return {
        line,
        setData: (data) => line.setData(data)
      }
    }
  }
}

/**
 * 时间推进式数据回放
 * @param setFrame 每帧回调，接收 [start, end] 索引，返回 true 表示继续
 * @param total 总数据长度
 * @param interval 帧间隔 ms
 */
export function createReplay(
  setFrame: (start: number, end: number) => void,
  total: number,
  interval = 50
) {
  let cursor = 1
  let timer: ReturnType<typeof setInterval> | null = null
  let speedMultiplier = 1

  function frame() {
    const step = Math.max(1, Math.round(speedMultiplier))
    cursor = Math.min(total, cursor + step)
    setFrame(0, cursor)
    if (cursor >= total && timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    play() {
      if (timer) return
      timer = setInterval(frame, interval)
    },
    pause() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    },
    reset() {
      cursor = 1
      setFrame(0, cursor)
    },
    jump(percent: number) {
      cursor = Math.max(1, Math.round(total * percent))
      setFrame(0, cursor)
    },
    setSpeed(m: number) {
      speedMultiplier = m
    },
    get isPlaying() {
      return timer !== null
    },
    dispose() {
      if (timer) clearInterval(timer)
      timer = null
    }
  }
}
