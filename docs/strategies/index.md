# 策略库

按策略族分类的完整量化策略库，每个策略配行情回放动画。

## 策略分类

| 策略族 | 核心思想 | 策略 |
|--------|----------|------|
| [趋势跟踪](./trend-following/) | 顺势而为 | [双均线](./trend-following/ma-crossover) · [MACD](./trend-following/macd-strategy) · [海龟](./trend-following/turtle-trading) · [通道突破](./trend-following/channel-breakout) |
| [均值回归](./mean-reversion/) | 逆向操作 | [布林回归](./mean-reversion/bollinger-bounce) · [RSI反转](./mean-reversion/rsi-reversal) · [KD超卖](./mean-reversion/stochastic-strategy) · [配对交易](./mean-reversion/pairs-trading) |
| [动量策略](./momentum/) | 强者恒强 | [双动量](./momentum/dual-momentum) · [RSI动量](./momentum/rsi-momentum) · [强弱排名](./momentum/strength-ranking) |
| [形态交易](./pattern-trading/) | 形态突破 | [双底](./pattern-trading/double-bottom-trade) · [三角](./pattern-trading/triangle-breakout) · [头肩](./pattern-trading/head-shoulders-trade) · [旗形](./pattern-trading/flag-consolidation) |
| [量化进阶](./quantitative/) | 系统工程 | [多因子](./quantitative/factor-model) · [网格](./quantitative/grid-trading) · [风险平价](./quantitative/risk-parity) |

## 怎么选策略？

```
你的核心假设是什么？
│
├─ "趋势会延续" → 趋势跟踪 / 动量
├─ "价格会回归均值" → 均值回归
├─ "形态会重演" → 形态交易
└─ "组合比单个标的重要" → 量化进阶
```

## 策略组合建议

不要只用一个策略，成熟的做法是**多策略互补**：

- 趋势跟踪 + 均值回归：一个吃趋势、一个吃震荡，覆盖大部分行情
- 动量 + 风险平价：一个进攻、一个防守
- 关键是用**组合管理**控制整体回撤，而非追求单策略最优

## 参考

- 指标工具：[指标大全](../indicators/)
- 系统方法：[方法论](../methodology/)
- 新手入门：[新手指南](../getting-started/)
