# 事件驱动策略

不赌趋势、不赌回归，赌"某个明确事件会改变定价"——在事件窗口里赚确定性较高的钱，平时空仓等待。

## 策略一览

| 策略 | 难度 | 核心思想 | 适合市场 |
|------|------|----------|----------|
| [财报后动量](./earnings-drift) | <span class="dlv dlv-intermediate">进阶</span> | 财报超预期后的惯性上涨 | 财报披露期 |
| [指数调仓博弈](./index-rebalance) | <span class="dlv dlv-challenge">挑战</span> | 埋伏被动基金调仓的确定性买盘 | 主流指数成分股 |

> 难度：入门 → 进阶 → 挑战。财报后动量适合进阶者练手；指数调仓需估算资金流、把握时点，挑战起步。

## 共性特征

- **催化剂驱动**：交易依据是财报、指数调整等明确事件，而非 K 线形态。
- **事件窗口**：收益集中在事件发生前后几周，平时多数时间空仓。
- **确定性溢价**：赢在"事件必然发生"（如调仓必须执行），而非预测涨跌方向。
- **抢跑与内幕风险**：提前泄露的消息会吃掉超额收益，必须严格按公开信息 + 纪律执行。

## 参考

- 市场机制：[市场微观结构](../../fundamentals/market-mechanics/market-microstructure) · [委托类型](../../fundamentals/market-mechanics/order-types)
- 宏观：[经济指标](../../fundamentals/macroeconomics/economic-indicators)（财报与宏观数据联动）
- 风险管理：[止损策略](../../methodology/risk-management/stop-loss) · [组合风险管理](../../methodology/risk-management/portfolio-risk)
