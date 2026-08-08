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

<!-- 策略模式：自动叠加指标线与买卖点，无需手写 lines/markers -->
<KLinePlayback strategy="bollinger" title="布林带回归行情回放" />
<KLinePlayback strategy="ma-cross" title="双均线交叉行情回放" />
<KLinePlayback strategy="macd" title="MACD 交易系统回放" />
```

- `data`：可选，`{ time, open, high, low, close, volume }[]`。省略则用内置演示数据。
- `markers`：买卖点标注，`{ time, side: 'buy'|'sell' }[]`
- `lines`：叠加指标线 `{ name, color, values }[]`，values 与 data 等长，null 表示缺省
- `strategy`：可选，自动叠加指标线 + 买卖点（与 `lines`/`markers` 二选一）。已实现模式：

| strategy | 叠加内容 | 买卖点规则 |
|---|---|---|
| `bollinger` | 布林带上/中/下轨 | 触下轨收回买入、上穿中轨卖出 |
| `ma-cross` | MA5 + MA20 | MA5 金叉/死叉 MA20 |
| `channel` | 20 日唐奇安上/下沿 | 突破上沿买、跌破下沿卖 |
| `turtle` | 20 日新高通道 + 10 日新低通道 | 破 20 日高买、破 10 日低卖 |
| `macd` | 子窗格 DIF + DEA | DIF 上/下穿 DEA |
| `rsi-reversal` | 子窗格 RSI(14)，带 30/50/70 参考线 | RSI 上穿 30 买、下穿 70 卖（专用 seed） |
| `rsi-momentum` | 子窗格 RSI(14)，带 30/50/70 参考线 | RSI 上穿 50 且价>MA20 买、下穿 50 卖 |
| `kdj` | 子窗格 K + D，带 20/80 参考线 | 超卖金叉买、超买死叉卖 |
| `grid` | 5 条等分网格横线 | 买卖发生在各层触点，不标注 |
| `sar` | 主图抛物线 SAR（紫线） | 无自动标注，价格跌破/上穿 SAR 即转向提示 |
| `ichimoku` | 转换线/基准线/先行带A/先行带B/迟行线 | 无自动标注 |
| `pivot-points` | P / R1 / S1 三条水平枢轴线 | 无自动标注 |
| `obv` | 子窗格 OBV | 无自动标注 |
| `vwap` | 主图 VWAP 成交量重心 | 无自动标注 |
| `cmf` | 子窗格 CMF（蔡金资金流），值域 ±1 | 无自动标注 |

- `height`、`title`：可选
- `variant`：可选，`'candle'`（默认，K 线）｜`'line'`（平滑净值/价差曲线）。组合净值、配对价差等单值序列页应传 `variant="line"`，不要用蜡烛图假象
- **图上图例**：自动在标题下方渲染图例栏——每条叠加线的**色块 + 名称**（取自 `lines[].name` 或 strategy 内置名），有买卖标注时额外显示 `▲买入` / `▼卖出`。无需手写，内容页不用管
- **收益曲线**：默认隐藏，点"显示收益"在下方追加 90px 净值曲线（懒创建，不会在隐藏时初始化空图表）

## IndicatorDemo — 指标动态演示

用于**指标页**。上 K 线 + 下指标窗格，支持实时改参数。

```vue
<IndicatorDemo indicator="rsi" title="RSI 指标" />
<IndicatorDemo indicator="macd" title="MACD" />
```

- `indicator`：`ma` | `ema` | `rsi` | `macd` | `boll` | `atr` | `kdj` | `none`
- `maPeriods`：默认 `[5,10,20]`，仅 `ma`/`ema`（及作为行情背景的 `none`）时在主图叠加均线
- `showOverlay`：默认 `true`。控制主图 MA 叠加——**仅 `ma`/`ema`/`none` 时生效**；`rsi/macd/atr/kdj` 不再叠无关均线（主图只留 K 线，指标在下方窗格）。`boll` 的布林带本身就是指标，始终显示
- **副图窗格**：`macd`（DIF/DEA/红绿柱）、`rsi`（RSI(14) 带 30/50/70 参考线）、`atr`（ATR(14)）、`kdj`（K/D/J 带 20/80 参考线）会自动加高 130px 给窗格留空间
- **图上图例**：自动在标题下方渲染图例栏（色块 + 名称），内容页无需手写
- `indicator` 为 `rsi/atr/kdj` 时页面底部有参数滑块

### 图例颜色约定（内容页写"图例"表时保持一致）

| 用途 | 颜色 |
|---|---|
| 均线 MA5 / DIF / K / 中轨 / OBV / P | `#1e5fd0` 蓝 |
| MA10 / DEA / D | `#e69138` 橙 |
| MA20 / J | `#7b1fa2` 紫 |
| 布林上/下轨（半透明） | `rgba(30,95,208,0.5)` |
| 卖出 / 压力 R1 / 基准线 | `#ef5350` 红 |
| 买入 / 支撑 S1 / 先行带A / 下轨 | `#26a69a` 绿 |
| SAR / 先行带B / RSI(策略窗格) | `#7b1fa2` 紫 |
| 迟行线 / VWAP | `#e69138` 橙 |
| 参考线（30/50/70、20/80） | 灰虚线 `rgba(128,128,128,0.7)` |
| 买入/卖出标注 | `▲` 绿 `#26a69a` / `▼` 红 `#ef5350` |

## ComparePanel — 双图对比

用于**参数/指标/策略对比**，左右同步滚动。

```vue
<ComparePanel
  title="SMA vs EMA"
  leftLabel="SMA 5/20" rightLabel="EMA 5/20"
  leftMode="sma" :leftPeriods="[5,20]" rightMode="ema" :rightPeriods="[5,20]"
/>
<!-- RSI 周期对比 -->
<ComparePanel leftLabel="RSI(9)" rightLabel="RSI(21)" leftMode="rsi" :leftPeriods="[9]" rightMode="rsi" :rightPeriods="[21]" title="RSI 周期对比" />
```

- `leftMode/rightMode`：`sma` | `ema` | `bollinger` | `rsi` | `macd` | `none`
- `leftPeriods/rightPeriods`：数组，必须用 `:` 动态绑定传数组字面量 `:leftPeriods="[5,20]"`（不要写成 `leftPeriods="[5,20]"`，那会被编译成字符串，触发 `periods.forEach is not a function`）
- **参数约定**（`leftPeriods/rightPeriods`）：
  - `sma` / `ema`：周期数组，如 `[5,20]`
  - `bollinger`：`[周期, 标准差倍数]`，如 `[20,2]`
  - `rsi`：`[周期]`，如 `[14]`
  - `macd`：`[快线, 慢线, 信号]`，如 `[12,26,9]`
- `rsi` / `macd` 模式自动在 K 线下方追加副窗格（整体高度 +130px），内容页无需处理
- 颜色沿用图例颜色约定：RSI / DIF / 中轨 `#1e5fd0`，DEA `#e69138`，布林上/下轨 `rgba(30,95,208,0.5)`，MACD 柱红负绿正

## BacktestLab — 回测实验室

用于**实战/回测实验室页**。浏览器内真实跑一次回测：调参数 → 指标卡/净值曲线/交易明细立刻变。数据为教学用合成数据（带趋势段/震荡段），非真实行情。

```vue
<BacktestLab title="回测实验室" />
```

- `title`：可选标题
- 内置两个策略：**双均线交叉**（趋势）与**布林带回归**（震荡）
- 参数滑块随策略切换：双均线=快线周期/慢线周期/单笔风险%；布林=周期/标准差倍数/单笔风险%
- 「换一段数据」重新生成合成行情（同一次点击换种子）；「找最优参数」网格扫描并提示过拟合
- 输出：净值曲线 + K线买卖点 + 5 项指标（年化/回撤/胜率/盈亏比/交易次数）+ 交易明细表
- 引擎逻辑在 `lib/backtest.ts`（信号收盘后产生、次根 bar 开盘成交、ATR(2) 止损、单笔风险仓位）
- 颜色：买 `#26a69a` 绿、卖 `#ef5350` 红、净值线 `#1e5fd0` 蓝

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

## CalcDemo — 指标逐步计算演示

用于**指标页**。用示例价格序列 + 滑动窗口，一步步展示指标计算过程（播放/下一步/进度条/倍速），页面可附"演算核对"代码块与组件数字一一对应。

```vue
<CalcDemo indicator="sma" period="5" title="MA5 计算演示" />
<CalcDemo indicator="ema" period="5" title="EMA5 计算演示" />
<CalcDemo indicator="rsi" period="5" title="RSI 计算演示" />
<CalcDemo indicator="boll" period="5" title="布林带计算演示" />
<CalcDemo indicator="macd" title="MACD 计算演示" />
<CalcDemo indicator="cci" period="5" title="CCI 计算演示" />
<CalcDemo indicator="kdj" period="5" title="KDJ 计算演示" />
<CalcDemo indicator="wr" period="5" title="威廉指标计算演示" />
<CalcDemo indicator="atr" period="5" title="ATR 计算演示" />
<CalcDemo indicator="mfi" period="5" title="MFI 计算演示" />
<CalcDemo indicator="obv" title="OBV 计算演示" />
```

- `indicator`：`sma` | `ema` | `rsi` | `boll` | `macd` | `cci` | `kdj` | `wr` | `atr` | `mfi` | `obv`
- `period`：滑动窗口周期（macd 固定 12/26/9、obv 无窗口，可不传；其余默认 5）
- `title`：可选标题
- **数据**：close 类模式用内置收盘价序列；`cci/kdj/wr/atr/mfi/obv` 用内置 OHLCV 序列 `BARS`（H+L=2C 使 TP=C），单元格下方显示高/低或成交量。**改 BARS 会连锁影响相关指标页的"演算核对"文字，须同步**。

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

- 矩阵含 **7 个策略族**（2026-08 新增「价值低估」「事件驱动」，数据在 `StrategyFit.vue` 的 `STRATEGIES` 数组）。矩阵仅覆盖「行情」维度；价值/事件族另有估值与事件维度，见策略总览页的「策略族对比」表。

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

## LoopCycle — 闭环循环图

用于**经典案例 / 策略循环视角**，节点绕椭圆排布、箭头逐环相连并回连成环，滚动触发逐节点点亮 + 回连箭头描边动画（与 `SignalFlow` 交互语言一致，只是从「线」变「环」）。

```vue
<LoopCycle
  title="泡沫循环"
  kind="danger"
  backLabel="自我强化"
  :nodes="[
    { label: '叙事点燃', detail: '新故事出现，早期买者赚钱' },
    { label: '赚钱效应', detail: '收益吸引场外资金' },
    { label: '杠杆涌入', detail: '融资/配资放大购买力' },
    { label: '价格加速', detail: '价格新高，越涨越信' },
    { label: '边界到来', detail: '接盘者/杠杆耗尽' },
    { label: '反转踩踏', detail: '去杠杆，循环反向' }
  ]"
/>
```

- `nodes`：循环节点数组 `{ label, detail? }[]`，3–6 个。**必须用 `:` 动态绑定**（`<LoopCycle :nodes="[...]" />`），否则编译成字符串
- `kind`：`danger`(正反馈陷阱，红) | `neutral`(策略循环，蓝) | `positive`(纪律正循环，绿)
- `title`：可选标题；`backLabel`：可选，回连箭头上的标注（默认"自我强化"）

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
4. 新增能力（如图表放大、图上图例）须在此记录并同步 `theme/index.ts` 全局注册。
5. 2026-08：`lib/indicators.ts` 新增 `calcSAR` / `calcIchimoku` / `calcPivot` / `calcVWAP` / `calcCMF`，供 KLinePlayback 的 `sar` / `ichimoku` / `pivot-points` / `vwap` / `cmf` 策略使用；obv 复用既有 `calcOBV`。
