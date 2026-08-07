# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**量化交易知识库** — 带动画的个人量化学习站点，基于 VitePress 构建，已上线 GitHub Pages（https://bradyliuy.github.io/quant-wiki/）。内容是纯静态 Markdown + 全局注册的 Vue 动画组件，无后端、无测试套件。

架构设计文档在 `docs/plans/2026-08-07-quant-wiki-design.md`，实施状态在 `docs/plans/2026-08-07-project-status.md`。

## 常用命令

```bash
npm run docs:dev       # 开发服务器 http://localhost:5173
npm run docs:build     # 构建静态站点到 docs/.vitepress/dist
npm run docs:preview   # 预览构建产物（默认 4173 端口）
node scripts/check-links.mjs   # 全站死链扫描（构建后跑，应 0 死链）
```

**验证流程**：每次改完组件/内容 → `npm run docs:build`（确认通过）→ `node scripts/check-links.mjs`（确认 0 死链）→ 浏览器实测改动页（见下方"可视化验证"）。

## 技术栈与关键约束

- **VitePress 1.6** + Vue 3，`"type": "module"`（ESM，不能 require）
- **lightweight-charts v5**：必须用 v5 API
  - `chart.addSeries(CandlestickSeries, {...})`（具名 series 导入），**不是** v4 的 `addCandlestickSeries()`
  - 买卖点标注用 `createSeriesMarkers(series, markers, {})` 插件，**不是** `series.setMarkers()`（v5 已移除，会抛 `TypeError: setMarkers is not a function`）
  - 多窗格用 `paneIndex` 参数
- **GSAP + ScrollTrigger**：`gsap.registerPlugin(ScrollTrigger)` 后用于滚动触发动画（CalcExplorer、SignalFlow）

## 架构：两大层

### 1. 内容层（`docs/`）

Markdown 页面，6 个板块（getting-started / fundamentals / indicators / strategies / methodology / reference），每个板块一个 `index.md`。侧边栏在 `docs/.vitepress/config.ts` 中**手写维护**（新增页面必须同步加进对应板块的 sidebar 数组，否则不可达）。

页面模板标准：
- **指标页**：一句话总结 → 公式 → 参数表 → `IndicatorDemo` → 信号解读 → 实战用法 → 常见误区 → 相关
- **策略页**：概述 → `SignalFlow` 流程图 → `KLinePlayback` 回放 → 入场/出场/止损规则 → 回测参考表（标注"示意数据"）→ 相关

**内容规范**：所有演示数据均为**教学用合成数据**，禁止编造真实股票价格/行情。回测表须标注"示意数据"。站点定位明确排除"具体股票推荐/实时行情"。

### 2. 主题层（`docs/.vitepress/theme/`）

- **`config.ts`**：`base: process.env.BASE_URL || '/'`（本地根路径，GitHub Pages 用 `/quant-wiki/`）、`ignoreDeadLinks: true`、`cleanUrls: true`、本地搜索
- **`index.ts`**：全局注册 12 个组件（Markdown 直接 `<组件名 />` 调用）
- **`components/*.vue`**：12 个可视化组件，分两类：
  - 图表类（lightweight-charts）：`KLinePlayback`（K线回放+买卖点）、`IndicatorDemo`（K线+指标窗格）、`ComparePanel`（双图同步对比）、`PatternGrowth`（形态生长）
  - 概念可视化类（SVG/交互）：`CalcDemo`（指标逐步计算）、`CalcExplorer`（公式计算器，GSAP 动画）、`SignalFlow`（信号流程图，GSAP）、`OptionPnl`（期权盈亏图）、`OrderExec`（委托执行动画）、`LeverageSim`（杠杆/做空模拟器）、`PESim`（PE 估值）、`ScoreMatrix`（雷达图评分）
- **`lib/`**：纯函数数据层
  - `indicators.ts`：指标计算 `calcSMA/calcEMA/calcRSI/calcMACD/calcBollinger/calcATR/calcKDJ/calcOBV`、`toSeries`、`genDemoData(n, seed)`（合成 OHLC，均值回归+单根波动使实体清晰）
  - `charts.ts`：`createKLineChart`、`addIndicatorPane`、`createIndicatorChart`、`createReplay`（时间推进回放控制器）

**组件契约**：`components/README.md` 是内容编写者的接口契约——每个组件的 props 用法都在这里。**不要在内容页之外随意修改 .vue / lib 文件**；新增能力需记录后统一改。

## 已知陷阱（重要）

- **SSR 只输出容器骨架**：组件在客户端渲染，SSR 时 `.chart-container` / `.calc-demo` 等容器存在但内部空——这是正常的，不是 bug。验证组件真实渲染必须用 headless 浏览器（见下）。
- **`genDemoData` 数据已优化**：默认数据 K 线实体应清晰可见（实体占价格范围 ~7%）。若改数据生成，务必验证实体比例，避免"看着像折线"。
- **Mac 无影响，Windows 注意**：`check-links.mjs` 用 `path.posix` 处理路径，绝对链接用 `normalize` 而非 `join`（否则误报大量死链）。
- **CalcDemo 的 MACD 模式**：用 45 天长期序列（`PRICES_LONG`），从第 26 天开始计算（EMA26 需种子）；`calcEMAperiod` 种子用 `min(period, len)` 个数据。

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

## 部署

- **GitHub Pages**（已配置）：`.github/workflows/deploy.yml`，push master 自动构建部署到 `/quant-wiki/`
- 仓库：`bradyliuY/quant-wiki`（公开，因为 Pages 免费版不支持私有仓库）
- 手动验证线上：`curl https://bradyliuy.github.io/quant-wiki/` 应返回 200

## 提交规范

- 遵循 Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:`），中英文描述皆可
- 提交信息需含 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
