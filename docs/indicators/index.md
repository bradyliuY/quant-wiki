---
title: 指标大全
---

# 指标大全

## 一句话定位

指标是把价格、成交量做数学加工，用来回答五个朴素问题：**往哪走、多强、多颠、有没有人推、在哪买卖**。本板块 20 个指标按这五个问题分五类，每个都配动态图表演示。

## 一次真实决策要用到三类指标

假设你持有某只票，想决定"继续拿还是卖掉"，一套完整的判断通常要三类指标配合：

1. [趋势指标](./trend/) 答"方向"：MA 是否多头排列？
2. [动量指标](./momentum/) 答"力气"：RSI 有没有顶背离？
3. [波动率指标](./volatility/) 答"止损"：ATR 告诉你止损放多远才不会被正常波动扫掉。

**单个指标只是工具，组合起来各答一问才是决策**——这是本板块反复强调的核心原则。

## 五大分类

| 分类 | 回答的问题 | 代表指标 | 一句话 |
|------|-----------|----------|--------|
| [趋势指标](./trend/) | 价格往哪走？ | [MA](./trend/ma) [MACD](./trend/macd) [ADX](./trend/adx) [SAR](./trend/parabolic-sar) | 趋势的方向和健康度 |
| [动量指标](./momentum/) | 走势有多强？ | [RSI](./momentum/rsi) [KD](./momentum/stochastic) [CCI](./momentum/cci) [%R](./momentum/williams-r) [ROC](./momentum/roc) | 涨跌还剩多少力气 |
| [波动率指标](./volatility/) | 波动有多剧烈？ | [布林带](./volatility/bollinger-bands) [ATR](./volatility/atr) [肯特纳](./volatility/keltner-channels) [唐奇安](./volatility/donchian) | 浪有多高、止损刻度 |
| [成交量指标](./volume/) | 谁在推动价格？ | [OBV](./volume/obv) [MFI](./volume/mfi) [VWAP](./volume/vwap) [CMF](./volume/cmf) [成交量分布](./volume/volume-profile) | 有没有资金支持 |
| [叠加指标](./overlay/) | 一个图看多要素？ | [一目均衡](./overlay/ichimoku) [枢轴点](./overlay/pivot-points) | 复合工具 |

## 怎么选指标？

```
你关心什么问题？
│
├─ "趋势方向是什么？" → 趋势指标（MA / MACD / 一目均衡）
├─ "这个趋势还走得动吗？" → 动量指标（RSI / MACD 背离 / ADX）
├─ "波动会放大吗？" → 波动率指标（布林带 / ATR）
├─ "涨得有没有人支持？" → 成交量指标（OBV / 成交量分布）
└─ "日内在哪里买卖？" → 叠加指标（枢轴点 / Ichimoku）
```

新手拿不准，直接看[指标总览与选择](./overview)——那里有"新手先学 4 个"和更细的场景地图。

## 快速体验

<IndicatorDemo indicator="macd" title="MACD 指标动态演示" />

> 每个指标页都有类似的动态演示 + 手把手算一遍 + 常见误区，打开一页看就懂。
