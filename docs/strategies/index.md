# 策略库

## 一句话定位

策略是对"行情会怎么演变"的一个假设：**趋势会延续、价格会回归、强者恒强**……假设对了赚钱，错了亏钱。本板块 22 个策略按假设分 7 个策略族，每个配行情回放动画。

## 一次选策略的思考过程

没有"哪个策略最好"，只有"哪个策略匹配现在的行情"：

> 单边上涨 → 用[趋势跟踪](./trend-following/)顺势吃趋势；横盘震荡 → 用[均值回归](./mean-reversion/)高抛低吸；恐慌暴跌 → 空仓，或[事件驱动](./event-driven/)等错杀机会。

**先判断行情，再选策略族**——这就是[策略总览](./overview)教的核心方法。

## 七大策略族

| 策略族 | 核心假设 | 策略 |
|--------|----------|------|
| [趋势跟踪](./trend-following/) | 趋势会延续 | [双均线](./trend-following/ma-crossover) [MACD](./trend-following/macd-strategy) [海龟](./trend-following/turtle-trading) [通道突破](./trend-following/channel-breakout) |
| [均值回归](./mean-reversion/) | 价格会回归均值 | [布林回归](./mean-reversion/bollinger-bounce) [RSI反转](./mean-reversion/rsi-reversal) [KD超卖](./mean-reversion/stochastic-strategy) [配对交易](./mean-reversion/pairs-trading) |
| [动量策略](./momentum/) | 强者恒强 | [双动量](./momentum/dual-momentum) [RSI动量](./momentum/rsi-momentum) [强弱排名](./momentum/strength-ranking) |
| [形态交易](./pattern-trading/) | 形态会重演 | [双底](./pattern-trading/double-bottom-trade) [三角](./pattern-trading/triangle-breakout) [头肩](./pattern-trading/head-shoulders-trade) [旗形](./pattern-trading/flag-consolidation) |
| [量化进阶](./quantitative/) | 组合比单标的优 | [多因子](./quantitative/factor-model) [网格](./quantitative/grid-trading) [风险平价](./quantitative/risk-parity) |
| [价值低估](./value/) | 便宜买好货 | [低估值筛选](./value/low-valuation) [高股息收息](./value/dividend-yield) |
| [事件驱动](./event-driven/) | 事件改变定价 | [财报后动量](./event-driven/earnings-drift) [指数调仓博弈](./event-driven/index-rebalance) |

## 新手怎么开始

22 个策略不用都学。新手先走通一条线（[策略总览](./overview)有详细路线）：**双均线 → 通道突破 → RSI 反转 → 布林回归**，建立"顺势"和"回归"两种相反思路的体感。

## 策略组合建议

不要只用一个策略，成熟做法是**多策略互补**：

- **趋势跟踪 + 均值回归**：一个吃趋势、一个吃震荡，覆盖大部分行情
- **动量 + 风险平价**：一个进攻、一个防守
- 关键是用[组合管理](../methodology/risk-management/portfolio-risk)控制整体回撤，而非追求单策略最优

## 参考

- 指标工具：[指标大全](../indicators/)
- 系统方法：[方法论](../methodology/)
- 动手实现：[策略代码实现（示意伪代码）](./code-examples)
