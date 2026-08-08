# 动手实践层（实战板块）设计

> **日期**：2026-08-08
> **状态**：已与用户确认，待实施
> **背景**：站点概念层已完整（117 页、7 板块），但缺"动手实践层"——全站代码均为教学用伪代码，新手看完仍无法独立跑通一次回测。本文是补全该缺口的方案设计。

## 定位

本站定位是"看得懂"（概念层），本板块补上"做得出"（实践层）。核心交付物是一个**浏览器内可运行的交互式回测组件**（BacktestLab），让"回测怎么跑"从概念变成可点击的体验；配套实战页承接真实 Python 动手路径。

同时补方法论下的**统计与概率基础**子板块（数学地基），并把**模拟盘指引**自然并入实战板块。

## 板块结构

### 新增顶层「实战」板块（nav + sidebar）

```
实战 practice/
├── index.md          总览 · 定位（教「做出来」，不是「看懂」）· 三阶段路线
├── backtest-lab.md   回测实验室 ★核心交互（BacktestLab 组件）
├── python-setup.md   Python 环境与数据获取
├── first-backtest.md 用回测框架跑通第一个策略
└── paper-trading.md  模拟盘实操
```

- nav 变为：首页 / 新手指南 / 金融基础 / 指标大全 / 策略库 / 方法论 / **实战** / 经典案例
- sidebar 新增 `practiceSidebar`，映射 `/practice/`

### 方法论下新增「统计与概率基础」子板块

```
methodology/statistics/
├── index.md              总览
├── expected-value.md     期望值：为什么正期望是盈利前提
├── variance-drawdown.md  波动/方差/最大回撤的数学
└── correlation.md        相关性：分散化与配对交易的地基
```

- methodologySidebar 新增 `统计与概率基础` 分组

## BacktestLab 组件（核心交付物）

**定位**：浏览器内真实执行一次回测循环，参数一改、指标/收益曲线/交易明细立刻变。

### 数据

- 新增 `lib/backtest.ts`（纯函数层，与 `lib/indicators.ts` 同风格）
- 含专用合成数据集：2-3 个清晰趋势段 + 震荡段的 OHLC（标注合成数据），**不动共享的 `genDemoData`**
- 数据长度约 300 根，保证统计意义（交易次数足够多）

### 策略

v1 做两个入门策略（新手推荐路径前两个）：
- **双均线交叉**（趋势）：金叉买、死叉卖，可选跌破均线止损
- **布林带回归**（震荡）：触下轨收回买、上穿中轨卖

用策略注册表组织（`lib/backtest.ts` 内 `STRATEGIES`），后续加策略便宜。

### 可调参数（滑块/输入框，防抖重跑）

- 双均线：快线周期 / 慢线周期 / 单笔风险%
- 布林：周期 / 标准差倍数 / 单笔风险%

### 输出

1. 收益曲线（lightweight-charts 线图，复用 `createChart` 思路）
2. 指标卡：年化收益 / 最大回撤 / 胜率 / 盈亏比 / 交易次数
3. K 线 + 买卖点标注（复用 `createKLineChart` 思路）
4. 交易明细表（每笔：入/出场时间与价、盈亏%）

### 教学彩蛋：「找最优参数」按钮

一键扫描参数网格 → 标注回测最优参数 → 提示"这是过拟合"。把「参数过拟合」从警告变成体验。

### 与 KLinePlayback 的区别

预设回放是"我画给你看"；BacktestLab 是"你自己拧，结果跟着变"——提供新手缺的**因果反馈**。

## 实战页内容要点

- **backtest-lab.md**：先用 BacktestLab 玩 → 解释回测循环伪代码 → 为什么用合成数据 → 指标怎么算 → 过拟合警告
- **python-setup.md**：Anaconda/VSCode/Jupyter 安装；数据源对比表（tushare/akshare/yfinance/baostock：免费度、覆盖面、上手难度、合规）；拉数据最小代码。**本站不含真实行情，仅指引外部数据源**
- **first-backtest.md**：backtrader（经典）与 vectorbt（轻量）二选一走读，给**本地可运行的最小完整脚本**（本地 CSV/示例数据），跑出指标后对照 BacktestLab 指标卡
- **paper-trading.md**：模拟盘价值、平台对比（A股券商模拟/美股 paper trading/加密 testnet）、回测→模拟盘的关键差异（滑点/延迟/心理）、上手步骤清单

## 联动改动

- `docs/.vitepress/config.ts`：practiceSidebar + nav 项 + methodologySidebar 统计组
- `docs/.vitepress/theme/index.ts`：注册 BacktestLab
- `docs/.vitepress/theme/components/README.md`：记录 BacktestLab 契约
- 交叉链接：reading-list 学习路线第四阶段 → 实战板块；how-to-backtest ↔ backtest-lab；双均线策略页 ↔ first-backtest
- 统计页可用既有组件：`CalcExplorer`（期望值/回撤计算）、`PlainTalk`（概念解释）

## 技术约束（CLAUDE.md 强制）

- VitePress 1.6 + Vue 3 ESM；lightweight-charts v5（`addSeries` 具名导入、`paneIndex` 多窗格）
- 合成数据原则：不出现真实股票价格/行情；回测表标注"示意数据"
- 组件客户端渲染，SSR 只出骨架——验证必须 headless 浏览器
- 新增能力须同步 `components/README.md`

## 验证

1. `npm run docs:build` 通过
2. `node scripts/check-links.mjs` 0 死链
3. `npm run docs:preview -- --port 4173` + Edge headless 截图：
   - `/practice/backtest-lab` 拖参数后指标卡/收益曲线/交易表变化
   - CDP 抓 `Runtime.exceptionThrown` 无 JS 错误
   - canvas 真实渲染（BacktestLab 区域有 canvas）

## 提交规范

Conventional Commits，`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
