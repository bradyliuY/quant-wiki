# 量化进阶策略

从"交易"迈向"研究"——用数学、统计和系统工程化的方法构建组合。

## 策略一览

| 策略 | 核心思想 | 适合市场 |
|------|----------|----------|
| [多因子模型](./factor-model) | 多维度因子打分选股 | 股票池 |
| [网格交易](./grid-trading) | 区间内预设网格低买高卖 | 震荡市 |
| [风险平价](./risk-parity) | 按风险贡献分配权重 | 多资产组合 |

## 共性特征

- **系统化流程**：数据清洗 → 因子构建 → 回测 → 风控 → 部署
- **过拟合风险高**：参数越多越容易拟合历史噪声，必须样本外验证
- **组合思维**：关注组合层面的风险与收益，而非单个标的
- **工程化要求**：数据、代码、回测、执行都要严谨

## 参考

- 方法论：[回测方法论](../../methodology/backtesting/how-to-backtest) · [常见陷阱](../../methodology/backtesting/common-pitfalls)
- 风险管理：[组合风险管理](../../methodology/risk-management/portfolio-risk) · [凯利公式](../../methodology/risk-management/kelly-criterion)
- 绩效评价：[绩效指标](../../methodology/backtesting/performance-metrics)
