---
title: 经典案例与闭环
---

# 经典案例与闭环

把抽象的量化原理,落到**真实发生过**的市场事件上。本站的策略页讲"怎么做",这里的案例讲"做错了会怎样"——用历史事件里的闭环,看懂杠杆、流动性、情绪这些看不见的力量。

## 两类闭环

交易世界里的「闭环」分两类,性质完全不同:

| 类别 | 本质 | 颜色 | 例子 |
|------|------|------|------|
| **正反馈闭环(市场陷阱)** | 杠杆或自动规则把小波动放大成大波动,循环越转越快,直到边界打断 | <span class="qw-no">红</span> | 泡沫循环、强平螺旋、轧空闭环 |
| **策略/操作闭环(盈利机器)** | 一次循环的盈亏不重要,重要的是循环**期望值为正** | <span class="qw-ok">蓝</span> | 网格、均值回归、海龟、配对交易 |

正反馈闭环要**识别和躲避**;策略闭环要**理解和坚持**。区别只在:循环转起来时,你是站在赚期望值那边,还是站在被杠杆反噬那边。

## 正反馈闭环(陷阱篇)

<div class="case-grid">

### [泡沫循环](./bubble-loop)
价格上涨被"赚钱效应"自我强化:早期买者赚钱 → 场外资金与杠杆涌入 → 价格再涨 → 直到接盘者或杠杆耗尽,循环反转踩踏。郁金香、南海、2000 互联网、2015 A 股、2021 加密,同一个循环反复上演。

### [强平螺旋](./margin-spiral)
下跌触发保证金追缴与强平,被迫卖出让价格跌得更快,形成"下跌自己制造下跌"。1987 黑色星期一、LTCM、2015 A 股配资、2010 闪崩,杠杆账户的集体绞肉机。

### [轧空闭环](./short-squeeze)
空头持仓越重,上涨时越要回补,回补买盘再推高价格,逼出更多空头。VW/保时捷 2008 两天涨 4 倍、GameStop 2021 一月 17 倍,做空的风险不对称。

</div>

## 行为层:把盈利机器变成绞肉机

### [追涨杀跌死循环](./chase-kill-loop)
同一波行情,策略玩家用规则赚期望值,情绪玩家靠感觉追涨杀跌——大涨追高、回调割肉、反弹踏空、再追高。策略没变,是人在循环里做反了动作。

## 策略闭环(机器篇)

策略库里的经典策略,本身就是闭环。它们的共同点:**不追求单次正确,追求循环的期望值为正**。以下策略页各有一段「闭环视角」,点破循环结构:

- [网格交易](../strategies/quantitative/grid-trading)——下跌逐档买、上涨逐档卖,震荡市反复收割
- [布林带回归](../strategies/mean-reversion/bollinger-bounce)——价格偏离均值买入,回归卖出
- [RSI 反转](../strategies/mean-reversion/rsi-reversal)——超卖买入、超买卖出,均值回归循环
- [海龟交易法则](../strategies/trend-following/turtle-trading)——突破入场、追踪离场,靠"60% 小亏 + 偶发大赚"的期望值结构

## 为什么用案例学量化?

1. **原理是抽象的,事件是具体的**——"杠杆放大波动"很难感受,但 2015 年 A 股千股跌停的强平螺旋一讲就懂
2. **错误比正确更有记忆点**——LTCM 的诺贝尔奖团队照样爆仓,比十条风险警示更有说服力
3. **闭环是市场的 DNA**——看懂一个闭环,你就同时看懂了历史、现在与下一次泡沫

> 说明:本站所有案例均为**公开记录的史实**(年份、点位、金额),不构成投资建议;行情细节为叙事需要做了简化。

## 相关

- 学习路径:[推荐书单与学习路线](../reference/reading-list)
- 方法论:[风险管理](../methodology/risk-management/)、[回测方法论](../methodology/backtesting/how-to-backtest)
- 入门:从[市场基础](../getting-started/market-basics)开始

<style>
.case-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin: 12px 0;
}
.case-grid > div {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--vp-c-bg-soft);
}
.case-grid h3 {
  margin: 0 0 6px;
  font-size: 15px;
}
.case-grid p {
  margin: 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>
