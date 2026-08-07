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
  leftMode="sma" :leftPeriods="[5,20]" rightMode="ema" :rightPeriods="[5,20]"
/>
```

- `leftMode/rightMode`：`sma` | `ema` | `none`
- `leftPeriods/rightPeriods`：数组，必须用 `:` 动态绑定传数组字面量 `:leftPeriods="[5,20]"`（不要写成 `leftPeriods="[5,20]"`，那会被编译成字符串，触发 `periods.forEach is not a function`）

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

## AssetMap — 资产定位图

用于**资产类别总览页**。SVG 散点，双模式切换（流动性×波动性 / 杠杆×风险），hover 显示 tooltip。

```vue
<AssetMap title="资产类别定位图" />
```

## AssetPicker — 品种选择地图

用于**资产类别总览页**。四问向导（交易时间/杠杆/波动/资金），实时匹配度评分条 + 排行榜。

```vue
<AssetPicker title="品种选择地图" />
```

## StrategyFit — 策略×行情匹配矩阵

用于**策略总览页**。行=策略族，列=行情，点击单元格看"为什么"，点击行/列头筛选。

```vue
<StrategyFit title="策略 × 行情 匹配矩阵" />
```

## IndicatorPicker — 场景→指标选择地图

用于**指标总览页**。左侧需求按钮，右侧推荐指标卡片（点击跳转指标页）。

```vue
<IndicatorPicker title="场景 → 指标选择地图" />
```

## PlainTalk — 大白话解释块

用于**所有概念页**，放在页面标题 / 一句话总结之后，先用生活化类比把概念讲成"人话"，再进入公式细节。金色点缀卡片，无动画。

```vue
<PlainTalk>RSI 就像把最近 14 天的涨跌放到天秤上比力气……</PlainTalk>
<PlainTalk title="用大白话说">……</PlainTalk>
```

- 默认插槽：正文（支持 `<b>/<code>/<br/>` 等行内标签）
- `title`：可选，默认"用大白话说"

## CaseWalk — 一笔交易走读

用于**策略页**，用纵向时间线走读一笔完整交易（观察→信号→入场→持仓/止损→止盈→复盘），比规则清单更好记忆。**内含 GSAP 滚动渐显动画**。

```vue
<CaseWalk
  title="一笔布林回归交易的走读"
  result="止损 -1.5% 离场：本次最大教训是……"
  :steps="[
    { label: '观察市场', detail: '带宽走平，进入震荡', type: 'setup' },
    { label: '出现信号', detail: '触下轨 + RSI 超卖', type: 'signal' },
    { label: '执行入场', detail: '阳线收回带内，¥35.20 入场', type: 'entry' },
    { label: '持仓管理', detail: '次日跌破止损位，坚决离场', type: 'stop' },
    { label: '复盘总结', detail: '震荡判定失效，误判环境', type: 'review' }
  ]"
/>
```

- `steps`：步骤数组，每项 `{ label, detail?, type? }`
- `type`：`setup`(观察) | `signal`(信号) | `entry`(入场) | `manage`(持仓) | `stop`(止损) | `exit`(止盈) | `review`(复盘)，决定标签/节点颜色
- `result`：可选，末尾结果小结（虚线框）

## DifficultyBadge — 页面难度徽章

用于**所有内容页**，自动在文档标题上方渲染"入门 / 进阶 / 挑战"难度徽章。**无需在正文写标签**，只需在页面 frontmatter 加一行：

```yaml
---
title: RSI 相对强弱指标
difficulty: 进阶
---
```

- `difficulty` 取值：`入门` | `进阶` | `挑战`
- 实现：主题 `Layout` 的 `doc-before` 插槽注入，读 frontmatter 自动渲染
- 颜色：入门=绿、进阶=蓝、挑战=金

## 通用交互：图表放大

所有图表类组件（`KLinePlayback` / `IndicatorDemo` / `ComparePanel` / `PatternGrowth`）自带**右上角放大按钮**：

- 点击 → 图表容器提升为全屏覆盖层（`position: fixed`），遮罩变暗，lightweight-charts 的 `autoSize` 自动适配大尺寸
- **Esc** 或点击遮罩 → 收起
- 实现：`lib/expand.ts` 的 `toggleExpand(el, cb)`，给 `.chart-container` 加 `.expanded` 类 + 创建 `.expand-mask` 遮罩
- 样式在 `custom.css`（`.chart-container.expanded` / `.expand-mask` / `.chart-expand-btn`）
- 内容页使用无需传 props，放大是内置交互

## 注意

1. 组件在 **客户端渲染**，SSR 只输出容器骨架——这是正常的。
2. **不要修改** `docs/.vitepress/theme/components/*.vue` 和 `docs/.vitepress/theme/lib/*.ts`。
3. 如需新的 props 能力，记录在内容页 TODO，不要自行改动组件。
4. 新增能力（如图表放大）须在此记录并同步 `theme/index.ts` 全局注册。
