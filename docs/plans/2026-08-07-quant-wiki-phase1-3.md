# 量化知识库 Phase 1-3 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成量化知识库的 Phase 1（站点壳 + 组件骨架）、Phase 2（指标大全板块）、Phase 3（方法论板块），产出可运行的 VitePress 站点。

**Architecture:** VitePress 静态站 + lightweight-charts 动态图表 + GSAP 滚动动画。Markdown 内容页嵌入 Vue 组件。内容主要来源于现有 quant-trading 技能的知识资产，指标/金融基础为新增。

**Tech Stack:** VitePress (Vue 3 + Vite)、lightweight-charts、GSAP + ScrollTrigger、TypeScript。

**设计文档:** `docs/plans/2026-08-07-quant-wiki-design.md`

---

## 前置准备

### Task 0: 初始化 VitePress 项目

**Files:**
- Create: `package.json`
- Create: `docs/index.md`
- Create: `docs/.vitepress/config.ts`
- Create: `.gitignore`

**Step 1: 创建 package.json**

```json
{
  "name": "quant-wiki",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

**Step 2: 安装依赖**

Run: `npm install -D vitepress@latest`

**Step 3: 创建 docs/index.md 占位首页**

```markdown
# 量化交易知识库

欢迎来到量化交易知识库。
```

**Step 4: 创建 docs/.vitepress/config.ts**

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '量化交易知识库',
  description: '带动画的量化投资学习平台',
  lang: 'zh-CN',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '新手指南', link: '/getting-started/' },
      { text: '指标大全', link: '/indicators/' },
      { text: '策略库', link: '/strategies/' },
      { text: '方法论', link: '/methodology/' },
      { text: '金融基础', link: '/fundamentals/' }
    ],
    sidebar: {}
  }
})
```

**Step 5: 创建 .gitignore**

```
node_modules/
docs/.vitepress/cache/
docs/.vitepress/dist/
```

**Step 6: 验证站点可运行**

Run: `npx vitepress dev docs`
Expected: 本地服务启动，访问 http://localhost:5173 能看到占位首页。

**Step 7: 初始化 git 并提交**

```bash
git init
git add .
git commit -m "chore: init vitepress project"
```

---

## Phase 1: 站点壳 + 组件骨架

### Task 1: 主题配置与全局布局

**Files:**
- Modify: `docs/.vitepress/config.ts`
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/.vitepress/theme/custom.css`

**Step 1: 完善 config.ts 的 sidebar**

为六个板块配置完整侧边栏（先建目录结构，侧边栏引用实际页面）。

**Step 2: 创建 theme/index.ts**

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

export default {
  extends: DefaultTheme
} satisfies Theme
```

**Step 3: 创建 custom.css 基础样式**

设置中文字体、主题色（金融深蓝）、排版微调。

**Step 4: 验证**

Run: `npx vitepress dev docs`
Expected: 站点主题色、字体生效。

---

### Task 2: 创建目录骨架与占位页

**Files:**
- Create: 各板块 `index.md`（fundamentals / getting-started / indicators / strategies / methodology / reference）
- Create: 各子目录占位页面

**Step 1: 按设计文档创建目录结构**

```
docs/
├── fundamentals/asset-classes/
├── fundamentals/fundamental-analysis/
├── fundamentals/macroeconomics/
├── fundamentals/market-mechanics/
├── getting-started/
├── indicators/trend/
├── indicators/momentum/
├── indicators/volatility/
├── indicators/volume/
├── indicators/overlay/
├── strategies/trend-following/
├── strategies/mean-reversion/
├── strategies/momentum/
├── strategies/pattern-trading/
├── strategies/quantitative/
├── methodology/pattern-library/
├── methodology/risk-management/
├── methodology/backtesting/
├── methodology/trading-psychology/
└── reference/
```

每个子目录创建 `index.md`，标注板块定位和计划内容。

**Step 2: 验证侧边栏与导航正常**

Run: `npx vitepress dev docs`
Expected: 导航和侧边栏显示所有板块。

---

### Task 3: 动画引擎依赖与公共工具

**Files:**
- Modify: `package.json`（添加依赖）
- Create: `docs/.vitepress/theme/lib/charts.ts`
- Create: `docs/.vitepress/theme/lib/indicators.ts`

**Step 1: 安装依赖**

Run: `npm install lightweight-charts gsap`

**Step 2: 创建 charts.ts 图表封装**

封装 lightweight-charts 创建实例、加载数据、时间轴控制的公共函数：
- `createKLineChart(container, data)` — 创建带 OHLC + 成交量面板的图表
- `createIndicatorChart(container, series)` — 创建下方指标窗格
- `animateReplay(chart, data, speed)` — 数据回放控制

**Step 3: 创建 indicators.ts 指标计算库**

纯函数计算常用技术指标，供动画组件复用：
- `calcSMA(data, period)` / `calcEMA(data, period)`
- `calcRSI(data, period)`
- `calcMACD(data, fast, slow, signal)`
- `calcBollinger(data, period, mult)`
- `calcATR(data, period)`
- `calcKDJ(data, period)`

每函数带返回值类型定义。

**Step 4: 验证构建**

Run: `npx vitepress build docs`
Expected: 构建成功无 TS 错误。

---

### Task 4: 7 个组件骨架

**Files:**
- Create: `docs/.vitepress/theme/components/KLinePlayback.vue`
- Create: `docs/.vitepress/theme/components/IndicatorDemo.vue`
- Create: `docs/.vitepress/theme/components/ComparePanel.vue`
- Create: `docs/.vitepress/theme/components/CalcExplorer.vue`
- Create: `docs/.vitepress/theme/components/SignalFlow.vue`
- Create: `docs/.vitepress/theme/components/PatternGrowth.vue`
- Create: `docs/.vitepress/theme/components/ScoreMatrix.vue`

**Step 1: 每个组件先写最小可运行版本**

- 定义 props / emits 接口
- 骨架：容器 div + 基本布局
- 内嵌一段示例数据跑通渲染
- 未完成的动画逻辑用 TODO 标注

**Step 2: 注册全局组件**

修改 `theme/index.ts`，用 `app.component()` 注册所有组件。

**Step 3: 组件自测**

在临时页面引用各组件，确认能渲染。

---

## Phase 2: 指标大全板块

### Task 5: 指标板块首页与决策树

**Files:**
- Create: `docs/indicators/index.md`

**Step 1: 编写板块首页**

- 指标五大分类总览（趋势/动量/波动率/成交量/叠加）
- 每个分类一句话定位 + 图标
- "怎么选指标"决策树（可视化/文字版）
- 各类指标导航卡片

**Step 2: 完成 IndicatorDemo 组件**

支持：
- K 线主图 + 下方指标窗格
- 指标类型 prop（ma/rsi/macd/boll/atr/kdj）
- 参数 prop
- 数据回放控制条（播放/暂停/速度/拖拽）

---

### Task 6: 趋势指标 4 页 + 组件落地

**Files:**
- Create: `docs/indicators/trend/ma.md`
- Create: `docs/indicators/trend/macd.md`
- Create: `docs/indicators/trend/adx.md`
- Create: `docs/indicators/trend/parabolic-sar.md`

**Step 1: 按指标页模板编写 ma.md**

模板：一句话 → 公式 → 参数表 → **动态演示(C2)** → 信号解读 → 实战用法 → 常见误区 → 参数对比(C3) → 相关。

MA 页含 MA/EMA/SMA/WMA 对比（ComparePanel）。

**Step 2: macd.md**

含 DIF/DEA/柱状图三联展示 + 金叉/死叉/背离动画标注。

**Step 3: adx.md**

趋势强弱判断，不判断方向，配合 +DI/-DI。

**Step 4: parabolic-sar.md**

追踪止损，SAR 点动画。

**Step 5: 逐页验证动画组件渲染**

Run: `npx vitepress dev docs`
Expected: 每页图表正常渲染，可回放。

---

### Task 7: 动量指标 4 页

**Files:**
- Create: `docs/indicators/momentum/rsi.md`
- Create: `docs/indicators/momentum/stochastic.md`
- Create: `docs/indicators/momentum/cci.md`
- Create: `docs/indicators/momentum/williams-r.md`

**Step 1: rsi.md**（核心页）
- RSI 超买超卖区间动画
- RSI 背离动画（顶背离/底背离）
- 不同周期 RSI 对比（ComparePanel）

**Step 2: stochastic.md**
- KD 快慢线 + 超买超卖

**Step 3: cci.md**
- 顺周期转折识别

**Step 4: williams-r.md**
- %R 极端值

---

### Task 8: 波动率指标 3 页

**Files:**
- Create: `docs/indicators/volatility/bollinger-bands.md`
- Create: `docs/indicators/volatility/atr.md`
- Create: `docs/indicators/volatility/keltner-channels.md`

**Step 1: bollinger-bands.md**
- 标准差通道动画
- 收窄/张口动画
- 布林回归策略预告

**Step 2: atr.md**
- ATR 用于止损设定动画

**Step 3: keltner-channels.md**
- ATR 版通道

---

### Task 9: 成交量指标 3 页 + 叠加指标 2 页

**Files:**
- Create: `docs/indicators/volume/obv.md`
- Create: `docs/indicators/volume/volume-profile.md`
- Create: `docs/indicators/volume/mfi.md`
- Create: `docs/indicators/overlay/ichimoku.md`
- Create: `docs/indicators/overlay/pivot-points.md`

**Step 1: 成交量 3 页**

OBV（能量潮）、成交量分布（水平直方图）、MFI（量价结合 RSI）。

**Step 2: 叠加 2 页**

Ichimoku（云层可视化）、枢轴点（日内关键位）。

**Step 3: 指标板块完稿**

- 侧边栏分组核对
- 交叉引用完整
- 全部页面动画组件可用

**Step 4: 提交 Phase 2**

```bash
git add .
git commit -m "feat(indicators): complete indicators section with 17 pages"
```

---

## Phase 3: 方法论板块

### Task 10: 评分模型页 + ScoreMatrix 组件

**Files:**
- Create: `docs/methodology/scoring-model.md`
- Modify: `docs/.vitepress/theme/components/ScoreMatrix.vue`

**Step 1: 完成 ScoreMatrix 组件**

- 5 维度（趋势/动量/形态/支阻/情绪）雷达图
- 每个维度滑块可调
- 总分动态累加 + 评级徽章（⭐⭐⭐⭐⭐）

**Step 2: 从现有 technical-analysis.md 迁移内容**

来源: `quant-trading/.agents/skills/openclaw-tradingview-quant/references/technical-analysis.md`

- 5 维度评分规则完整保留
- 两个案例（强势股/弱势股）改写为交互式
- 嵌入 ScoreMatrix

---

### Task 11: 形态识别库 3 页 + PatternGrowth 组件

**Files:**
- Create: `docs/methodology/pattern-library/reversal-patterns.md`
- Create: `docs/methodology/pattern-library/continuation-patterns.md`
- Create: `docs/methodology/pattern-library/candlestick-patterns.md`
- Modify: `docs/.vitepress/theme/components/PatternGrowth.vue`

**Step 1: 完成 PatternGrowth 组件**

- 逐根 K 线生长动画
- 支持形态类型 prop（double-bottom / head-shoulders / ascending-triangle / flag / rectangle）
- 关键位标注（颈线/支阻/目标/止损线）

**Step 2: 反转形态页**

来源: `pattern-library.md` 反转部分
- 双底/双顶/头肩底/头肩顶/圆底/圆顶
- 每个形态：特征 + 识别条件 + 置信度 + 交易策略
- 嵌入 PatternGrowth 演示

**Step 3: 中继形态页**

- 三角（上升/下降/对称）/旗形/矩形/楔形

**Step 4: K 线形态页**

- 锤子/吞没/晨星黄昏星/十字星

---

### Task 12: 风险管理 5 页 + CalcExplorer 组件

**Files:**
- Create: `docs/methodology/risk-management/kelly-criterion.md`
- Create: `docs/methodology/risk-management/position-sizing.md`
- Create: `docs/methodology/risk-management/stop-loss.md`
- Create: `docs/methodology/risk-management/take-profit.md`
- Create: `docs/methodology/risk-management/portfolio-risk.md`
- Modify: `docs/.vitepress/theme/components/CalcExplorer.vue`

**Step 1: 完成 CalcExplorer 组件**

- 通用交互式计算器框架
- 支持公式模式（凯利/仓位/风险回报比）
- 滑块输入 + 结果渐变动画
- GSAP 滚动触发公式步骤动画

**Step 2: kelly-criterion.md**

来源: `risk-management.md` 凯利部分
- 公式推导动画（滚动触发）
- 胜率/盈亏比滑块 → 实时仓位
- 半凯利 + 25% 上限说明
- 实例：60% 胜率 × 2:1 = 20% 仓位

**Step 3: position-sizing.md**

- 固定比例 / 波动率调整 / 金字塔
- 三种方法对比

**Step 4: stop-loss.md**

- 固定百分比 / 技术位 / 时间 / 移动止损
- 止损线动画演示

**Step 5: take-profit.md**

- 分批止盈 / 移动止盈 / 目标止盈

**Step 6: portfolio-risk.md**

- 分散化 / 相关性 / 最大回撤控制

---

### Task 13: 回测方法论 4 页

**Files:**
- Create: `docs/methodology/backtesting/how-to-backtest.md`
- Create: `docs/methodology/backtesting/common-pitfalls.md`
- Create: `docs/methodology/backtesting/performance-metrics.md`
- Create: `docs/methodology/backtesting/walk-forward.md`

**Step 1: how-to-backtest.md**

回测的正确流程与前置条件。

**Step 2: common-pitfalls.md**

过拟合 / 幸存者偏差 / 未来函数 / 前视偏差 / 数据窥探。

**Step 3: performance-metrics.md**

夏普 / 卡玛 / 最大回撤 / 胜率 / 盈亏比 / 信息比率，含公式。

**Step 4: walk-forward.md**

样本外检验、滚动优化、walk-forward 流程。

---

### Task 14: 交易心理 3 页

**Files:**
- Create: `docs/methodology/trading-psychology/cognitive-biases.md`
- Create: `docs/methodology/trading-psychology/discipline.md`
- Create: `docs/methodology/trading-psychology/drawdown-psychology.md`

**Step 1: cognitive-biases.md**

确认偏误 / 锚定效应 / 过度自信 / 损失厌恶 / 处置效应，每个带交易场景示例。

**Step 2: discipline.md**

止损纪律 / 仓位纪律 / 计划外交易。

**Step 3: drawdown-psychology.md**

回撤期心理管理，结合最大回撤概念。

---

### Task 15: 方法论板块完稿 + 全站联调

**Step 1: 侧边栏完整配置**

methodology 板块四个子块（评分模型/形态库/风控/回测/心理）完整映射。

**Step 2: 交叉引用检查**

方法论 ↔ 指标 ↔ 策略 页面间的关联链接。

**Step 3: 全站构建验证**

Run: `npx vitepress build docs`
Expected: 构建成功，无警告无报错。

**Step 4: 提交 Phase 3**

```bash
git add .
git commit -m "feat(methodology): complete methodology section with 15 pages"
```

---

## 验证清单

Phase 1-3 完成后的验收标准：
- [ ] `npm run docs:dev` 启动正常，导航含 6 大板块
- [ ] `npm run docs:build` 零错误
- [ ] indicators/ 17 页全部完成，动画组件可用
- [ ] methodology/ 15 页全部完成，动画组件可用
- [ ] 现有 quant-trading 内容已迁移（评分模型/风控/形态库）
- [ ] 7 个组件中 C2/C3/C4/C6/C7 完成可用（C1/C5 留给 Phase 4）
- [ ] 页面交叉引用完善
