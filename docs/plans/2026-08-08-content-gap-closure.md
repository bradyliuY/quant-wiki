# 策略库与指标板块内容补全实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐策略库与指标板块对照设计模板的 4 个缺口：策略代码示例页、指标参数关系对比（扩展 ComparePanel）、族 index 难度列、新手推荐路径。

**Architecture:** 全部为内容层 + 主题层改动。唯一组件改动是扩展 `ComparePanel.vue` 支持 `rsi` / `bollinger` / `macd` 三种对比模式（复用 `lib/indicators.ts` 既有 `calcRSI` / `calcBollinger` / `calcMACD`，副窗格沿用 `IndicatorDemo.vue` 的 `paneIndex: 1` 模式）。其余为 Markdown 内容编辑与侧边栏配置。遵守组件契约：改动后必须同步 `components/README.md`。

**Tech Stack:** VitePress 1.6、Vue 3、lightweight-charts v5（`addSeries` 具名导入、`paneIndex` 多窗格、`createPriceLine` 参考线）。

**验证（本仓库无测试套件，遵循 CLAUDE.md 强制流程）：**
1. `npm run docs:build` 通过
2. `node scripts/check-links.mjs` 输出 0 死链
3. `npm run docs:preview -- --port 4173` + Edge headless 截图：验证 rsi / bollinger-bands / macd / code-examples / 两个 overview 页，CDP 抓 console 无 JS 错误、ComparePanel 的 canvas 真实渲染（左右图 + RSI/MACD 副窗格出现）

**提交规范：** Conventional Commits，`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

## Task 1: 扩展 ComparePanel 支持 rsi / bollinger / macd 对比模式

**Files:**
- Modify: `docs/.vitepress/theme/components/ComparePanel.vue`
- Modify: `docs/.vitepress/theme/components/README.md`（契约，ComparePanel 一节）

**Step 1: 修改脚本区 import 与类型**

在 ComparePanel.vue 顶部：
- lightweight-charts import 增加 `HistogramSeries, LineStyle`
- indicators import 增加 `calcBollinger, calcMACD, toSeries`（`calcRSI` 已导入）

```ts
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType, LineStyle, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { genDemoData, calcSMA, calcEMA, calcRSI, calcBollinger, calcMACD, toSeries, type OHLC } from '../lib/indicators'
```

**Step 2: 新增副窗格高度计算**

在 `props` 定义之后加入：

```ts
/** rsi / macd 需要副窗格，整体加高 130px 给窗格留空间 */
const needsPane = (mode: string) => mode === 'rsi' || mode === 'macd'
const chartHeight = computed(() => props.height + (needsPane(props.leftMode) || needsPane(props.rightMode) ? 130 : 0))
```

（需从 vue 引入 `computed`。）

**Step 3: 扩展 renderSide 的 else-if 分支**

在现有 `} else if (mode === 'sma' || mode === 'ema') {...}` 之后追加三个分支：

```ts
} else if (mode === 'bollinger') {
  // 参数约定：[周期, 倍数]，默认 (20, 2)
  const period = periods[0] ?? 20
  const mult = periods[1] ?? 2
  const b = calcBollinger(closes.value, period, mult)
  const upper = chart.addSeries(LineSeries, { color: 'rgba(30,95,208,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
  const mid = chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
  const lower = chart.addSeries(LineSeries, { color: 'rgba(30,95,208,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
  const times = allData.value.map((d) => d.time)
  upper.setData(toSeries(times, b.upper))
  mid.setData(toSeries(times, b.mid))
  lower.setData(toSeries(times, b.lower))
} else if (mode === 'rsi') {
  // 参数约定：[周期]，默认 14
  const period = periods[0] ?? 14
  const line = chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, paneIndex: 1, priceLineVisible: false, lastValueVisible: false })
  line.setData(toSeries(allData.value.map((d) => d.time), calcRSI(closes.value, period)))
  ;[30, 50, 70].forEach((p) => line.createPriceLine({ price: p, color: 'rgba(128,128,128,0.7)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false }))
} else if (mode === 'macd') {
  // 参数约定：[快, 慢, 信号]，默认 (12, 26, 9)
  const [fast = 12, slow = 26, signal = 9] = periods
  const m = calcMACD(closes.value, fast, slow, signal)
  const times = allData.value.map((d) => d.time)
  const dif = chart.addSeries(LineSeries, { color: '#1e5fd0', lineWidth: 2, paneIndex: 1, priceLineVisible: false, lastValueVisible: false })
  const dea = chart.addSeries(LineSeries, { color: '#e69138', lineWidth: 2, paneIndex: 1, priceLineVisible: false, lastValueVisible: false })
  dif.setData(toSeries(times, m.dif))
  dea.setData(toSeries(times, m.dea))
  const hist = chart.addSeries(HistogramSeries, { paneIndex: 1, priceFormat: { type: 'price' } })
  hist.setData(times.map((t, i) => ({ time: t, value: m.hist[i] ?? 0, color: (m.hist[i] ?? 0) >= 0 ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)' })))
}
```

**Step 4: buildChart 与容器用 chartHeight**

- `buildChart` 里 `height: props.height` 改为 `height: chartHeight.value`
- template 两个 `:style="{ height: height + 'px', width: '100%' }"` 改为 `:style="{ height: chartHeight + 'px', width: '100%' }"`

**Step 5: 更新 README.md 契约（ComparePanel 一节）**

`leftMode/rightMode` 取值改为 `sma` | `ema` | `bollinger` | `rsi` | `macd` | `none`，并补充：

```md
- 参数约定（`leftPeriods/rightPeriods`）：
  - `sma`/`ema`：周期数组，如 `[5,20]`
  - `bollinger`：`[周期, 标准差倍数]`，如 `[20,2]`
  - `rsi`：`[周期]`，如 `[14]`
  - `macd`：`[快线, 慢线, 信号]`，如 `[12,26,9]`
- `rsi`/`macd` 会自动在 K 线下方追加副窗格（高度 +130px）
- 颜色沿用图例颜色约定：RSI/DIF/中轨 `#1e5fd0`，DEA `#e69138`，布林上/下轨 `rgba(30,95,208,0.5)`，MACD 柱红负绿正
```

**Step 6: 验证本任务**

Run: `npm run docs:build`
Expected: 构建通过（组件是客户端渲染，SSR 只出骨架）

**Step 7: Commit**

```bash
git add docs/.vitepress/theme/components/ComparePanel.vue docs/.vitepress/theme/components/README.md
git commit -m "feat: ComparePanel 支持 rsi/bollinger/macd 参数对比模式"
```

---

## Task 2: 给 rsi / bollinger-bands / macd 三个指标页加「参数关系对比」

**Files:**
- Modify: `docs/indicators/momentum/rsi.md`
- Modify: `docs/indicators/volatility/bollinger-bands.md`
- Modify: `docs/indicators/trend/macd.md`

每个页面在「动态演示」图例之后、「计算演示」之前插入一节「参数关系对比」，配一段简短说明。三处均为 Markdown，唯一需读上下文以定插入点。

**Step 1: rsi.md 插入**

```md
## 参数关系对比

RSI 周期越短越灵敏、越容易触发超买超卖；周期越长越平滑、信号更少但更可靠。对比 RSI(9) 与 RSI(21)：

<ComparePanel title="RSI 周期对比（9 vs 21）" leftLabel="RSI(9) 灵敏" rightLabel="RSI(21) 平滑" leftMode="rsi" :leftPeriods="[9]" rightMode="rsi" :rightPeriods="[21]" />

**图例**：副窗格蓝线为 RSI，灰虚线为 30/50/70 参考线。可见 RSI(9) 上下穿越频繁（信号多、噪声大），RSI(21) 更晚拐头（信号少、更稳）。短线用 9、波段用 21，没有"最优"，只有"匹配周期"。
```

**Step 2: bollinger-bands.md 插入**

```md
## 参数关系对比

标准差倍数决定带宽：2 倍带较窄、信号频繁；2.5 倍带较宽、只有强烈偏离才触轨。对比 2σ 与 2.5σ：

<ComparePanel title="布林带倍数对比（2σ vs 2.5σ）" leftLabel="布林(20, 2)" rightLabel="布林(20, 2.5)" leftMode="bollinger" :leftPeriods="[20,2]" rightMode="bollinger" :rightPeriods="[20,2.5]" />

**图例**：蓝线为中轨，半透明蓝线为上/下轨。2σ 带内约 95% 价格、2.5σ 带内约 98.8%——带越宽，触轨信号越"极端"也越稀有，误触率更低。震荡市用窄带、趋势市用宽带更合适。
```

**Step 3: macd.md 插入**

```md
## 参数关系对比

快慢线参数决定灵敏度：周期越短金叉死叉越早、也越频繁；周期越长信号越滞后但更稳。对比 (12,26,9) 与 (8,21,5)：

<ComparePanel title="MACD 参数对比（12/26/9 vs 8/21/5）" leftLabel="MACD(12,26,9) 标准" rightLabel="MACD(8,21,5) 灵敏" leftMode="macd" :leftPeriods="[12,26,9]" rightMode="macd" :rightPeriods="[8,21,5]" />

**图例**：副窗格蓝线 DIF、橙线 DEA、红绿柱为 MACD 柱（红负绿正）。灵敏版金叉死叉出现更早，但震荡中假信号也更多；标准版更稳。默认 12/26/9 是经过广泛验证的起点，改参前先问"我要更早还是更稳"。
```

**Step 4: 验证本任务**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 构建通过；0 死链

**Step 5: Commit**

```bash
git add docs/indicators/momentum/rsi.md docs/indicators/volatility/bollinger-bands.md docs/indicators/trend/macd.md
git commit -m "docs: 三个核心指标页补参数关系对比（RSI/布林/MACD）"
```

---

## Task 3: 族 index 一览表格加「难度」列

**Files:**
- Modify（策略族 5 个）: `docs/strategies/{trend-following,mean-reversion,momentum,pattern-trading,quantitative}/index.md`
- Modify（指标分类 5 个）: `docs/indicators/{trend,momentum,volatility,volume,overlay}/index.md`

**Step 1: 策略族表格加难度列**

每张「策略一览」表格从 3 列改为 4 列：`| 策略 | 难度 | 核心思想 | 适合市场 |`，难度值取各页 frontmatter：

| 文件 | 难度值 |
|---|---|
| trend-following/index.md | 双均线 入门 · MACD 入门 · 海龟 进阶 · 通道突破 入门 |
| mean-reversion/index.md | 布林回归 进阶 · RSI 反转 进阶 · KD 进阶 · 配对 挑战 |
| momentum/index.md | 双动量 进阶 · RSI 动量 进阶 · 强弱排名 进阶 |
| pattern-trading/index.md | 双底 进阶 · 三角 进阶 · 头肩 进阶 · 旗形 进阶 |
| quantitative/index.md | 多因子 挑战 · 网格 挑战 · 风险平价 挑战 |

**Step 2: 指标分类表格加难度列**

| 文件 | 难度值 |
|---|---|
| indicators/trend/index.md | MA 入门 · MACD 进阶 · ADX 入门 · SAR 入门 |
| indicators/momentum/index.md | RSI 进阶 · KD 进阶 · CCI 进阶 · 威廉 进阶 |
| indicators/volatility/index.md | 布林 进阶 · ATR 入门 · 肯特纳 入门 |
| indicators/volume/index.md | OBV 入门 · 量分布 挑战 · MFI 入门 |
| indicators/overlay/index.md | 一目均衡 挑战 · 枢轴点 入门 |

难度用徽章同色文字提示（如 `入门`=`<span class="qw-ok">入门</span>`，`挑战`=`<span class="qw-no">挑战</span>`，`进阶` 用默认加粗），保持视觉一致。每个分类表下方加一句："难度：入门→进阶→挑战，新手从入门起步。"

**Step 3: 验证 + Commit**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链

```bash
git add docs/strategies/*/index.md docs/indicators/*/index.md
git commit -m "docs: 策略族/指标分类 index 一览表补难度列"
```

---

## Task 4: 两个 overview 页补「新手推荐路径」

**Files:**
- Modify: `docs/strategies/overview.md`
- Modify: `docs/indicators/overview.md`

**Step 1: strategies/overview.md**

在「怎么选策略（决策路径）」之后插入：

```md
## 新手入门路线

完全新手别 18 个策略都学。按难度阶梯先走通一条线，建立"完整一笔交易"的体感：

1. **双均线交叉**（入门）——理解"顺势 + 金叉死叉"，是全站的入门范本
2. **通道突破**（入门）——理解"突破入场 + 追踪离场"，同样是顺势思路
3. **RSI 反转**（进阶）——换个方向：顺势里的回调买点
4. **布林带回归**（进阶）——理解"震荡市 + 均值回归"与趋势策略互为补充

每学完一个，回看它的 [CaseWalk 一笔交易走读](./trend-following/ma-crossover)，比规则清单更接近实战。之后再按「策略×行情矩阵」扩展到别的策略族。
```

**Step 2: indicators/overview.md**

在「指标组合原则」之前插入：

```md
## 新手先看这 4 个

指标有 16 个，新手先掌握 4 个就够搭建第一个策略：

| 指标 | 解决什么问题 | 难度 |
|------|------------|------|
| [MA](../indicators/trend/ma) | 趋势方向 | 入门 |
| [RSI](../indicators/momentum/rsi) | 涨跌动能、超买超卖 | 进阶 |
| [布林带](../indicators/volatility/bollinger-bands) | 波动放大/收窄 | 进阶 |
| [ATR](../indicators/volatility/atr) | 设止损的距离 | 入门 |

这 4 个恰好对应"定方向 → 找买点 → 识波动 → 设止损"的完整交易闭环，学完就能读懂本站大部分策略页。
```

**Step 3: 验证 + Commit**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链

```bash
git add docs/strategies/overview.md docs/indicators/overview.md
git commit -m "docs: 策略/指标总览补新手推荐路径"
```

---

## Task 5: 新增「策略代码实现」参考页

**Files:**
- Create: `docs/strategies/code-examples.md`
- Modify: `docs/.vitepress/config.ts`（strategiesSidebar 加一项）
- Modify: `docs/strategies/index.md`、`docs/strategies/overview.md`（交叉引用）

**Step 1: 创建 `docs/strategies/code-examples.md`**

frontmatter 参照参考页习惯（若 reference 页有 difficulty 则加 `difficulty: 进阶`，否则省略）。结构：

```
# 策略代码实现（示意伪代码）

> 说明：以下为**教学用伪代码**，只表达每个策略的"信号 → 进出场 → 止损 → 仓位"骨架，非可直接运行的实盘代码。实盘需自行处理数据、滑点、手续费与风控。

## 快速定位
| 策略族 | 策略 | 行号/锚点 |
...
```

正文按 5 族组织，每个策略一个 `### 标题` + 一个 6~10 行 Python 风格代码块。风格对齐 `getting-started/first-strategy.md` 的 `generate_signal` 写法（缩进、注释中文、`risk=%` 表示单笔风险）。18 个策略覆盖：ma-crossover、macd-strategy、turtle-trading、channel-breakout；bollinger-bounce、rsi-reversal、stochastic-strategy、pairs-trading；dual-momentum、rsi-momentum、strength-ranking；double-bottom-trade、triangle-breakout、head-shoulders-trade、flag-consolidation；factor-model、grid-trading、risk-parity。

每个策略代码块模板：

```python
# === 双均线交叉 ===
ma_fast = SMA(close, 5)                    # 快速均线
ma_slow = SMA(close, 20)                   # 慢速均线

if no_position and cross_up(ma_fast, ma_slow) and slope(ma_slow) > 0:
    buy(risk=2%)                           # 顺势金叉入场，单笔风险 2%
elif has_position and cross_down(ma_fast, ma_slow):
    sell_all()                             # 死叉离场
# 止损：跌破入场后最低价下方 2%（见 methodology/risk-management/stop-loss）
```

配对交易、风险平价等复杂策略用更抽象的伪代码（z-score、目标权重），仍保持 6~10 行。

**Step 2: config.ts 侧边栏**

strategiesSidebar 在 `{ text: '策略总览', link: '/strategies/overview' },` 之后加：
```ts
{ text: '策略代码实现', link: '/strategies/code-examples' },
```

**Step 3: 交叉引用**

- `docs/strategies/index.md`「参考」小节加一行指向 code-examples
- `docs/strategies/overview.md`「相关」小节加一行

**Step 4: 验证 + Commit**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链

```bash
git add docs/strategies/code-examples.md docs/.vitepress/config.ts docs/strategies/index.md docs/strategies/overview.md
git commit -m "feat: 新增策略代码实现参考页（18 策略示意伪代码）"
```

---

## Task 6: 全量验证

**Step 1: 构建 + 死链**

Run: `npm run docs:build`；`node scripts/check-links.mjs`
Expected: 构建通过；0 死链

**Step 2: 浏览器实测（CLAUDE.md 强制）**

Run:
```bash
npm run docs:preview -- --port 4173
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --window-size=1400,2000 --virtual-time-budget=8000 --screenshot=/tmp/shots/rsi.png "http://localhost:4173/indicators/momentum/rsi"
```
对以下页面截图：`/indicators/momentum/rsi`、`/indicators/volatility/bollinger-bands`、`/indicators/trend/macd`、`/strategies/code-examples`、`/strategies/overview`、`/indicators/overview`。用 CDP 抓 `Runtime.exceptionThrown`，确认无 JS 错误；检查 ComparePanel 区域左右各有一个 canvas、`rsi`/`macd` 页面有副窗格。

**Step 3: 分析截图**

对齐/溢出/留白检查；若无法直接读图，用 vision 工具或 PIL 裁剪放大 ComparePanel 区域。

**Step 4: 收尾 Commit（如有微调）**
