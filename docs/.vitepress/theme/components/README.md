# 动画组件使用契约

本文件是内容页面编写者的接口契约。**不要在内容页之外修改这些组件**；内容页通过 Markdown 标签使用组件。

## 组件注册

所有组件已在 `theme/index.ts` 全局注册，Markdown 中直接写 `<组件名 ...props />` 即可。

## KLinePlayback — K 线回放

用于**策略回放、案例复盘**。逐根 K 线生长 + 买卖点标注 + 可切换收益曲线。

```vue
<KLinePlayback
  title="双均线策略回放"
  :markers="[{ time: 1720000000, side: 'buy' }, { time: 1722000000, side: 'sell' }]"
  :lines="[{ name: 'MA5', color: '#1e5fd0', values: [...null 或数值数组...] }]"
/>
```

- `data`：可选，`{ time, open, high, low, close, volume }[]`。省略则用内置演示数据。
- `markers`：买卖点标注，`{ time, side: 'buy'|'sell' }[]`
- `lines`：叠加指标线 `{ name, color, values }[]`，values 与 data 等长，null 表示缺省
- `height`、`title`：可选

## IndicatorDemo — 指标动态演示

用于**指标页**。上 K 线 + 下指标窗格，支持实时改参数。

```vue
<IndicatorDemo indicator="rsi" title="RSI 指标" />
<IndicatorDemo indicator="macd" title="MACD" />
```

- `indicator`：`ma` | `ema` | `rsi` | `macd` | `boll` | `atr` | `kdj` | `none`
- `maPeriods`：默认 `[5,10,20]`，ma/ema 时生效
- `indicator` 为 `rsi/atr/kdj` 时页面底部有参数滑块

## ComparePanel — 双图对比

用于**参数/指标/策略对比**，左右同步滚动。

```vue
<ComparePanel
  title="SMA vs EMA"
  leftLabel="SMA 5/20" rightLabel="EMA 5/20"
  leftMode="sma" leftPeriods="[5,20]" rightMode="ema" rightPeriods="[5,20]"
/>
```

- `leftMode/rightMode`：`sma` | `ema` | `none`
- `leftPeriods/rightPeriods`：数组，传字符串形式 `"[5,20]"`

## CalcExplorer — 交互式计算器

用于**公式计算**（凯利/仓位/风报比/波动率）。**内含 GSAP 滚动渐显动画**，组件进入视口时淡入上移。

```vue
<CalcExplorer mode="kelly" title="凯利公式" />
<CalcExplorer mode="position" />
<CalcExplorer mode="riskreward" />
<CalcExplorer mode="volatility" />
```

- `mode`：`kelly` | `position` | `riskreward` | `volatility`
- `initial`：初始参数对象，可选

## SignalFlow — 策略信号流程图

**内含 GSAP 滚动动画**，步骤随滚动逐个点亮。

```vue
<SignalFlow :steps="[
  { label: '入场信号', detail: '价格上穿关键均线' },
  { label: '确认', detail: '成交量放大配合' }
]" />
```

- `steps`：步骤数组，每项 `{ label, detail? }`

## PatternGrowth — 形态生长动画

用于**形态识别页**，逐根 K 线生长 + 关键位虚线。

```vue
<PatternGrowth
  pattern="double-bottom"
  title="双底形态"
  :levels="[{ label: '颈线', price: 33 }, { label: '目标', price: 37.5 }]"
/>
```

- `pattern`：`double-bottom` | `head-shoulders` | `ascending-triangle` | `flag` | `rectangle`
- `levels`：水平标注线 `{ label, price, color? }[]`

## ScoreMatrix — 100 分评分模型

用于**评分模型页**。5 维雷达图 + 滑块 + 总分评级。

```vue
<ScoreMatrix
  title="100 分技术评分模型"
  :initial="{ trend: 20, momentum: 15, pattern: 12, sr: 8, sentiment: 5 }"
/>
```

- `initial`：`{ trend(≤30), momentum(≤25), pattern(≤20), sr(≤15), sentiment(≤10) }`

## 注意

1. 组件在 **客户端渲染**，SSR 只输出容器骨架——这是正常的。
2. **不要修改** `docs/.vitepress/theme/components/*.vue` 和 `docs/.vitepress/theme/lib/*.ts`。
3. 如需新的 props 能力，记录在内容页 TODO，不要自行改动组件。
