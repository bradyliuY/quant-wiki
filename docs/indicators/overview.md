---
title: 指标总览与选择
---

# 指标总览与选择

## 一句话总结

指标不是"越多越好"的工具箱，而是**回答特定问题的答案**——先想清楚"我想知道什么"，再选能回答那个问题的指标，最后组合使用。

## 五大分类回顾

| 分类 | 回答的问题 | 代表指标 | 典型用法 |
|------|-----------|----------|----------|
| [趋势指标](../indicators/trend/) | 价格往哪走？ | MA、MACD、ADX、SAR | 定方向、定基调 |
| [动量指标](../indicators/momentum/) | 走势有多强？ | RSI、KD、CCI、%R、ROC | 找超买超卖、找背离 |
| [波动率指标](../indicators/volatility/) | 波动有多剧烈？ | 布林带、ATR、肯特纳、唐奇安 | 设止损、定仓位 |
| [成交量指标](../indicators/volume/) | 谁在推动价格？ | OBV、MFI、VWAP、CMF、成交量分布 | 确认量价配合 |
| [叠加指标](../indicators/overlay/) | 复合工具组合？ | Ichimoku、枢轴点 | 一个图看多要素 |

## 场景 → 指标选择地图

点击左侧"你关心的问题"，查看推荐指标：

<IndicatorPicker title="场景 → 指标选择地图" />

## 新手先看这 4 个

指标有 20 个，新手先掌握 4 个就够搭建第一个策略：

| 指标 | 解决什么问题 | 难度 |
|------|------------|------|
| [MA](../indicators/trend/ma) | 趋势方向 | <span class="dlv dlv-beginner">入门</span> |
| [RSI](../indicators/momentum/rsi) | 涨跌动能、超买超卖 | <span class="dlv dlv-intermediate">进阶</span> |
| [布林带](../indicators/volatility/bollinger-bands) | 波动放大/收窄 | <span class="dlv dlv-intermediate">进阶</span> |
| [ATR](../indicators/volatility/atr) | 设止损的距离 | <span class="dlv dlv-beginner">入门</span> |

这 4 个恰好对应"定方向 → 找买点 → 识波动 → 设止损"的完整交易闭环，学完就能读懂本站大部分策略页。

## 指标组合原则

单指标会骗人（震荡市里 MACD 假金叉、强趋势里 RSI 超买不回调），**多指标共振**才可靠。推荐的组合套路：

1. **趋势指标定方向**：先用 MA / MACD 判断多空基调，只在顺势方向找机会。
2. **动量指标找入场点**：顺势中出现超卖/背离等回调，就是低风险入场点。
3. **波动率指标设止损**：用 ATR 或布林带定止损距离，让风险与波动匹配。

```
组合示例：MA20 确认上升趋势 + RSI 回调到超卖区 + 价格触及布林下轨
→ 三者共振时入场，止损放 ATR×1.5 下方
```

## 常见误区

- <span class="qw-no">✕</span> 指标越多越安全：信号互相矛盾时反而瘫痪，2-3 个不同类别的指标足够。
- <span class="qw-no">✕</span> 只用一个指标：任何单指标都有盲区，必须在另一个维度上交叉验证。
- <span class="qw-no">✕</span> 不看指标类型就混用：趋势指标和震荡指标信号方向相反，同时用会互相打架。

## 相关

- [指标大全](../indicators/)：全部分类与动态演示
- [策略库](../strategies/)：指标在真实策略中的用法
- [100 分评分模型](../methodology/scoring-model)：如何综合多个维度给标的打分
