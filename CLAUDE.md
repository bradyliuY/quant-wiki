# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**量化交易知识库** — 带动画的个人量化学习站点，基于 VitePress 构建，已上线 GitHub Pages（https://bradyliuy.github.io/quant-wiki/）。内容是纯静态 Markdown + 全局注册的 Vue 动画组件，无后端、无测试套件。

架构与实施文档都在 `docs/plans/`（历次设计/计划文档，按日期命名）：
- `2026-08-07-quant-wiki-design.md` — 设计决策与组件规划
- `2026-08-07-quant-wiki-phase1-3.md` — 前三阶段实施细节
- `2026-08-07-project-status.md` — 状态收尾
- `2026-08-08-practice-layer-design.md` / `2026-08-08-practice-layer-plan.md` — 动手实践层（实战板块）
- `2026-08-08-expert-upgrade-design.md` / `2026-08-08-expert-upgrade-plan.md` — 专家进阶板块（MVP 设计/实施）

全站 **140 个 Markdown 页面（9 板块）**已完成并上线 GitHub Pages。

另有项目技能 `.claude/skills/`：其中 13 个目录是空占位（design-taste / imagegen-frontend-* / minimalist-ui 等，无内容，不可调用），**唯一可用的是 `feishu-wiki-downloader`**（Playwright 把飞书 Wiki 文档下载为 Markdown，`node .claude/skills/feishu-wiki-downloader/scripts/feishu-download.js "<链接>" "<输出.md>"`）。

## 常用命令

```bash
npm run docs:dev       # 开发服务器 http://localhost:5173
npm run docs:build     # 构建静态站点到 docs/.vitepress/dist
npm run docs:preview   # 预览构建产物（默认 4173 端口）
node scripts/check-links.mjs   # 死链扫描 + 导航可达性校验（构建后跑，应 0 死链 / 0 未接入）
```

**验证流程**：每次改完组件/内容 → `npm run docs:build`（确认通过）→ `node scripts/check-links.mjs`（确认 0 死链、0 未接入导航）→ 浏览器实测改动页（见下方"可视化验证"）。

## 技术栈与关键约束

- **VitePress 1.6** + Vue 3，`"type": "module"`（ESM，不能 require）
- **lightweight-charts v5**：必须用 v5 API
  - `chart.addSeries(CandlestickSeries, {...})`（具名 series 导入），**不是** v4 的 `addCandlestickSeries()`
  - 买卖点标注用 `createSeriesMarkers(series, markers, {})` 插件，**不是** `series.setMarkers()`（v5 已移除，会抛 `TypeError: setMarkers is not a function`）
  - 多窗格用 `paneIndex` 参数
- **GSAP + ScrollTrigger**：`gsap.registerPlugin(ScrollTrigger)` 后用于滚动触发动画（CalcExplorer、SignalFlow）

## 架构：两大层

### 1. 内容层（`docs/`）

Markdown 页面，9 个板块（getting-started / fundamentals / indicators / strategies / methodology / cases / practice / expert / reference），每个板块一个 `index.md`。侧边栏在 `docs/.vitepress/config.ts` 中**手写维护**（新增页面必须同步加进对应板块的 sidebar 数组，否则不可达）。

**实战板块（`practice/`）**是动手实践层，教"做出来"而非"看懂"：`backtest-lab.md` 用 `BacktestLab` 组件在浏览器内跑真实回测，另有 Python 环境/数据获取、pandas 数据处理与画图、回测框架走读、模拟盘 4 页（工具链止于模拟盘），与 `reading-list.md` 学习路线第四阶段互链。方法论下另有「统计与概率基础」子板块（`methodology/statistics/`，期望值/波动回撤/相关性）。策略族现为 **7 个**（趋势跟踪/均值回归/动量/形态/量化进阶/价值低估/事件驱动）。

**专家进阶板块（`expert/`）**是从"会跑回测"到"会做研究"的升级层，教"怎么判断结果可靠"：`research-methods/`（策略假设/多重检验/样本外/过拟合）、`system-trading/`（交易成本）、`capstone/`（研究报告模板）。机器学习规划为该板块后续专题，顺序先研究纪律后 ML。第一批为纯内容 + 复用现有组件，不新增 .vue。

页面模板标准：
- **指标页**：一句话总结 → 公式 → 参数表 → `IndicatorDemo` → 信号解读 → 实战用法 → 常见误区 → 相关
- **策略页**：概述 → `SignalFlow` 流程图 → `KLinePlayback` 回放 → 入场/出场/止损规则 → 回测参考表（标注"示意数据"）→ 相关

**内容规范**：所有演示数据均为**教学用合成数据**，禁止编造真实股票价格/行情。回测表须标注"示意数据"。站点定位明确排除"具体股票推荐/实时行情"。

**目录架构纪律**：
- **目录 = 导航 = URL 三合一**：`docs/` 的目录结构必须与 `config.ts` 的 nav/sidebar 一一对应，新增页面必须同步进对应板块的 sidebar，否则不可达
- **最深三层**：`板块/分类/页面`（如 `fundamentals/asset-classes/stocks`），不超过三层
- **每个分类目录必须有 `index.md`**（分类 landing 页），并在 sidebar 中作为该分组标题的 `link` 可达（分组标题加 `link: '/path/'`）
- **`plans/` 随站发布**：设计文档是站点的一部分，按 `YYYY-MM-DD-<topic>-design.md` / `-plan.md` 命名，不加进 sidebar（经 nav 外的 URL 可达）
- **`check-links.mjs` 同时校验死链与导航可达性**：新增页面后跑一遍，需 `死链 0` 且 `导航可达性 0 未接入`

### 2. 主题层（`docs/.vitepress/theme/`）

- **`config.ts`**：`base: process.env.BASE_URL || '/'`（本地根路径，GitHub Pages 用 `/quant-wiki/`）、`ignoreDeadLinks: true`、`cleanUrls: true`、本地搜索
- **`index.ts`**：全局注册 20 个组件（Markdown 直接 `<组件名 />` 调用；另有 `DifficultyBadge` 通过 Layout `doc-before` 插槽注入，读 frontmatter `difficulty` 渲染难度徽章）
- **`sidebar-active.ts`**：客户端增强，按当前 URL 为侧边栏补上 `is-active`（VitePress 1.6.4 在本项目下该 class 不生效，详见文件头注释；`enhanceApp` 里调用）
- **`components/*.vue`**：20 个可视化组件，分四类：
  - 图表类（lightweight-charts）：`KLinePlayback`（K线回放+买卖点）、`IndicatorDemo`（K线+指标窗格）、`ComparePanel`（双图同步对比）、`PatternGrowth`（形态生长）、`BacktestLab`（浏览器内真实回测：双策略/参数滑块/净值曲线/交易明细）
  - 概念可视化类（SVG/交互）：`CalcDemo`（指标逐步计算）、`CalcExplorer`（公式计算器，GSAP 动画）、`SignalFlow`（信号流程图，GSAP）、`OptionPnl`（期权盈亏图）、`OrderExec`（委托执行动画）、`LeverageSim`（杠杆/做空模拟器）、`PESim`（PE 估值）、`ScoreMatrix`（雷达图评分）
  - 板块总览交互类（SVG/向导）：`AssetMap`（资产定位散点）、`AssetPicker`（品种选择向导）、`StrategyFit`（策略×行情矩阵，7 个策略族）、`IndicatorPicker`（场景→指标向导）
  - 说明/叙事类：`PlainTalk`（大白话解释块）、`CaseWalk`（一笔交易走读，GSAP）、`LoopCycle`（闭环循环图）
- **`lib/`**：纯函数数据层
  - `indicators.ts`：指标计算 `calcSMA/calcEMA/calcRSI/calcMACD/calcBollinger/calcATR/calcKDJ/calcOBV`、`toSeries`、`genDemoData(n, seed)`（合成 OHLC，均值回归+单根波动使实体清晰）
  - `charts.ts`：`createKLineChart`、`addIndicatorPane`、`createIndicatorChart`、`createReplay`（时间推进回放控制器）
  - `backtest.ts`：回测引擎 `runBacktest`/`findBestParams`/`STRATEGIES` + `genBacktestData(n, seed)`（**4 段行情**：震荡→上升→震荡→下降，供 BacktestLab 用）
  - `expand.ts`：`toggleExpand`（图表放大交互，`.chart-container` + `.expand-mask`）

**组件契约**：`components/README.md` 是内容编写者的接口契约——每个组件的 props 用法都在这里。**不要在内容页之外随意修改 .vue / lib 文件**；新增能力需记录后统一改。

## 已知陷阱（重要）

- **SSR 只输出容器骨架**：组件在客户端渲染，SSR 时 `.chart-container` / `.calc-demo` 等容器存在但内部空——这是正常的，不是 bug。验证组件真实渲染必须用 headless 浏览器（见下）。
- **`genDemoData` 数据已优化**：默认数据 K 线实体应清晰可见（实体占价格范围 ~7%）。若改数据生成，务必验证实体比例，避免"看着像折线"。
- **Mac 无影响，Windows 注意**：`check-links.mjs` 用 `path.posix` 处理路径，绝对链接用 `normalize` 而非 `join`（否则误报大量死链）。
- **CalcDemo 的 MACD 模式**：用 45 天长期序列（`PRICES_LONG`），从第 26 天开始计算（EMA26 需种子）；`calcEMAperiod` 种子用 `min(period, len)` 个数据。
- **Markdown 里传数组/对象 prop 必须用 `:` 动态绑定**：`leftPeriods="[5,20]"`（无冒号）会被 Vue 编译成字符串，组件内 `periods.forEach` 直接抛 `TypeError`；必须写成 `:leftPeriods="[5,20]"`。ComparePanel 曾因此报错，README 已更正。
- **`autoSize: true` 的图表容器必须有固定高度**：容器 div 只写 `width:100%` 不给高度时，轻量图表 `autoSize` 会与内容高度形成正反馈，把容器撑到整页高。须仿照 KLinePlayback/IndicatorDemo 写 `:style="{ height: height + 'px', width: '100%' }"`。
- **两个合成数据生成器别混用**：`indicators.ts` 的 `genDemoData`（均值回归+正弦，给回放/指标演示）；`backtest.ts` 的 `genBacktestData`（4 段趋势/震荡行情，给回测实验室）。改 `genBacktestData` 的行情段会连锁改变 BacktestLab 里两个策略的相对表现。
- **BacktestLab 回测引擎规则**（在 `lib/backtest.ts`，与站点回测方法论一致）：信号在 bar 收盘后产生、**次根 bar 开盘成交**（避免前视）、ATR(2) 止损、单笔风险仓位（仓位 = 风险% / 止损距离）。改引擎时必须保持这三条，否则与 `how-to-backtest.md` 的教导冲突。

## 可视化验证（必须真实截图）

不要只读代码判断 UI/动画，必须用 headless 浏览器实测：

```bash
# 启动预览
npm run docs:preview -- --port 4173
# 用 Edge headless 截图（可配合 --remote-debugging-port 做 CDP 检查 console 错误）
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --window-size=1400,2000 \
  --virtual-time-budget=8000 --screenshot=/tmp/shots/page.png \
  "http://localhost:4173/<路径>"
```

验证点：
1. **console 无 JS 错误**（CDP 抓 `Runtime.exceptionThrown`）——组件若用错 v5 API 会在这里暴露
2. **canvas 真实渲染**（`.chart-container` 内有 canvas 元素 = 图表真实绘制）
3. **交互可用**（点击下一步/切换 tab/拖滑块后状态变化）
4. 截图过大时用 PIL 裁剪图表区域放大，或用 vision 工具分析

注意：若 4173 已被旧 `docs:preview` 进程占用且返回 404（读到旧产物），换端口 `--port 4174` 起新预览即可；`--screenshot` 模式截图后进程会退出，要做 CDP 交互验证需以 `--remote-debugging-port` 常驻启动。截图无法直接读图时，用 `~/.claude/skills/vision/vision.py <png> "<检查提示>"` 做布局分析（本会话为 external 视觉路由）。

## 部署

- **GitHub Pages**（已配置）：`.github/workflows/deploy.yml`，push master 自动构建部署到 `/quant-wiki/`
- 仓库：`bradyliuY/quant-wiki`（公开，因为 Pages 免费版不支持私有仓库）
- 手动验证线上：`curl https://bradyliuy.github.io/quant-wiki/` 应返回 200

## 提交规范

- 遵循 Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:`），中英文描述皆可
- 提交信息需含 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
