# 方法论

## 一句话定位

指标和策略回答"用什么工具"，方法论回答"**怎么用才不亏**"——如何评估一只标的、下多大的注、亏到哪离场、如何验证策略真的有效、如何在连续亏钱时管住自己。它是把"学会"变成"做对"的那一层。

## 一个例子：一笔交易背后的方法论

假设你用[双均线策略](../strategies/trend-following/ma-crossover)开了一笔仓，从开仓到复盘，每个环节都对应本板块的一页：

| 交易环节 | 你问的问题 | 对应方法论 |
|----------|-----------|-----------|
| 开仓前 | 这只标的综合值不值得关注？ | [100 分评分模型](./scoring-model) |
| 下注时 | 该买多少？ | [仓位管理](./risk-management/position-sizing) |
| 下单后 | 亏到哪认输？ | [止损策略](./risk-management/stop-loss) |
| 上线前 | 这套规则真的有效吗？ | [回测方法论](./backtesting/how-to-backtest) |
| 连续亏钱时 | 我还敢按规则做吗？ | [交易心理](./trading-psychology/discipline) |

## 板块地图

| 子板块 | 回答的问题 |
|--------|-----------|
| [评分模型](./scoring-model) | 一只标的综合值不值得关注？ |
| [形态识别库](./pattern-library/) | 图上的形态在说什么？ |
| [风险管理](./risk-management/) | 下多大注、亏到哪离场？ |
| [回测方法论](./backtesting/) | 策略是真本事，还是数据巧合？ |
| [统计与概率基础](./statistics/) | 期望值、回撤、相关性怎么算？ |
| [交易心理](./trading-psychology/) | 规则写在纸上了，执行得了吗？ |

## 推荐阅读路径

- **新手先看**：[回测的正确流程](./backtesting/how-to-backtest) → [止损策略](./risk-management/stop-loss)
- **进阶研究**：[绩效指标](./backtesting/performance-metrics) → [样本外检验与滚动优化](./backtesting/walk-forward)
- **交易执行**：[认知偏差](./trading-psychology/cognitive-biases) → [纪律执行](./trading-psychology/discipline)

## 相关

- 想先动手：[回测实验室](../practice/backtest-lab)
- 想学工具：[指标大全](../indicators/)
