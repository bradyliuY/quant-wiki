---
paths:
  - "docs/.vitepress/theme/**/*"
  - "scripts/check-links.mjs"
---

# 主题层规则

## lightweight-charts v5

- 使用 `chart.addSeries(CandlestickSeries, options)`，不要使用 v4 的 `addCandlestickSeries()`。
- 买卖点标注使用 `createSeriesMarkers(series, markers, {})`，不要调用已移除的 `series.setMarkers()`。
- 多窗格使用 `paneIndex`。
- `autoSize: true` 的图表容器必须有固定高度，避免容器高度正反馈撑满页面。

## Vue 与数据

- Markdown 传数组或对象 prop 必须使用动态绑定，例如 `:leftPeriods="[5,20]"`。
- `indicators.ts` 的 `genDemoData` 只用于指标和回放演示；`backtest.ts` 的 `genBacktestData` 只用于回测实验室，不能混用。
- 修改 `genDemoData` 后必须确认 K 线实体清晰可见。
- CalcDemo 的 MACD 模式依赖 45 天序列，从第 26 天开始计算；EMA 种子使用 `min(period, len)` 个数据。
- Windows 下 `check-links.mjs` 必须用 `path.posix` 处理路径，绝对链接使用 `normalize` 而不是 `join`，否则会误报死链。

## 回测约束

BacktestLab 必须保持以下规则，与站点方法论一致：

- 信号在 bar 收盘后产生。
- 下一根 bar 开盘成交，避免前视偏差。
- 使用 ATR(2) 止损。
- 按单笔风险计算仓位：风险比例除以止损距离。

## 浏览器验证

组件变更必须检查：控制台无 JS 异常、canvas 已绘制、交互状态会变化。截图模式进程会退出；需要 CDP 交互检查时应常驻启动浏览器并设置远程调试端口。
