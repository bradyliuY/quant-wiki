# 回测方法论

回测是在历史数据上验证策略的「预演」。但要小心：一个设计糟糕的回测会给出漂亮却虚假的收益曲线。回测方法论的核心是让模拟**尽可能接近真实**，并诚实面对偏差。

## 导航

- [回测的正确流程](/methodology/backtesting/how-to-backtest)：假设定义 → 数据准备 → 执行建模 → 稳健性检验
- [常见陷阱](/methodology/backtesting/common-pitfalls)：过拟合 / 幸存者偏差 / 未来函数 / 前视偏差 / 数据窥探
- [绩效指标](/methodology/backtesting/performance-metrics)：夏普 / 卡玛 / 最大回撤 / 胜率 / 盈亏比
- [样本外检验与滚动优化](/methodology/backtesting/walk-forward)：训练/验证/测试划分与 Walk-Forward 流程

## 一句话原则

- **回测只能排除坏策略，不能证明好策略**
- **信号只用当时可得的信息，最早次日成交**
- **成本（佣金/滑点）必须计入**
- **样本外检验是过拟合的唯一解药**

## 推荐阅读路径

- 先学会流程：[回测的正确流程](/methodology/backtesting/how-to-backtest)
- 再识别坑：[常见陷阱](/methodology/backtesting/common-pitfalls)
- 学会读指标：[绩效指标](/methodology/backtesting/performance-metrics)
- 最后严格验证：[样本外检验与滚动优化](/methodology/backtesting/walk-forward)
