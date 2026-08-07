---
title: 图表图例与指标说明增强
date: 2026-08-07
---

# 图表图例与指标说明增强

## 背景

用户反馈 K 线图存在"有线无说明"问题：图表里的彩色线条没有图例标注，读者无法判断"哪条线代表什么"。经代码审查 + Edge headless 截图 + 视觉模型实测确认：

- `KLinePlayback` / `IndicatorDemo` 画的每条叠加线**都没有图上图例**（lightweight-charts series 未设 `title`，`lastValueVisible` 甚至被显式关闭）。
- `IndicatorDemo` 存在 bug：`renderOverlay` 里 `if (!props.showOverlay || props.indicator !== 'boll')` 条件写反——`showOverlay=false` 反而照画 MA，且 RSI/MACD/KDJ/ATR 演示默认在主图叠 3 条**与指标无关**的 MA 线。
- 指标页正文没有"颜色→线"对照说明；只有策略页在文字里解释了颜色。
- ichimoku / volume-profile / pivot-points / parabolic-sar / obv 五个页面的演示只画裸 K 线，被讲解的指标根本没画出来。

## 改动

### 组件层（docs/.vitepress/theme/）

- **`KLinePlayback.vue`**：新增图上图例栏（`.chart-legend`），从 `effectiveLines[].name` 渲染色块+名称；有买卖标注时追加 `▲买入 / ▼卖出`。`StratLine` 支持可选 `priceLines`（RSI 策略加 30/50/70，KDJ 加 20/80 灰虚线参考线）。新增 5 个 strategy：`sar` / `ichimoku` / `pivot-points` / `obv` / `vwap`。
- **`IndicatorDemo.vue`**：修复 `showOverlay` bug（仅 ma/ema/none 叠加均线，rsi/macd/atr/kdj 主图只留 K 线）；新增图上图例栏（按指标类型渲染色块+名称，MACD 柱用红绿渐变块）；有副图窗格时整体加高 130px；RSI 窗格加 30/50/70、KDJ 加 20/80 参考线。
- **`lib/indicators.ts`**：新增 `calcSAR` / `calcIchimoku` / `calcPivot` / `calcVWAP`（obv 复用既有 `calcOBV`）。
- **`custom.css`**：新增 `.chart-legend` / `.chart-legend-item` / `.chart-legend-swatch` / `.chart-legend-glyph` 样式。
- **`components/README.md`**：更新契约（新 strategy 表、图例能力、showOverlay 语义、图例颜色约定表、lib 新增函数）。

### 内容层（docs/indicators/ 16 页）

每个指标页两处增强：

1. **图例对照表**（动态演示下方）：颜色 → 线条 → 含义，与组件实际画的线一一对应。
2. **一次实战解读**（信号解读后）：用演示数据（seed 42）的**真实事件日**写一段交易走读（金叉/死叉、触轨、背离等），标注"示意数据，仅教学用"。

并修复 5 个裸演示页（ichimoku / volume-profile / pivot-points / parabolic-sar / obv）改用对应 strategy，让指标线真正画出并自动获得图例。

## 验证

- `npm run docs:build` 通过（多次）。
- `node scripts/check-links.mjs`：108 文件，0 死链。
- Edge headless + CDP 实测 15+ 页面：全部 console 0 错误、canvas 真实渲染、图例栏正确（如 MA 页 `[MA5,MA10,MA20]`、ma-crossover 页 `[MA5,MA20,▲买入,▼卖出]`、ichimoku 页 5 条线名、macd 页 `[DIF,DEA,MACD柱]`）。
- 视觉模型确认：RSI 副图 30/50/70 参考线、图例色块与线颜色对应、中文无乱码。
