# 趋势跟踪策略

"顺势而为"——跟随价格的主要运动方向，趋势在就持有，趋势破就离场。

## 策略一览

| 策略 | 核心思想 | 适合市场 |
|------|----------|----------|
| [双均线交叉](./ma-crossover) | 快慢均线金叉买、死叉卖 | 强趋势 |
| [MACD 交易系统](./macd-strategy) | MACD 金叉死叉 + 零轴过滤 | 趋势+波段 |
| [海龟交易法则](./turtle-trading) | 唐奇安通道突破 + ATR 仓位 | 大级别趋势 |
| [通道突破](./channel-breakout) | 布林带/肯特纳突破追入 | 波动放大启动 |

## 共性特征

- **胜率低、盈亏比高**：趋势策略赢面通常在 35-45%，靠单笔大盈利覆盖多次小止损
- **顺势加仓**：趋势确认后金字塔式加仓，放大盈利
- **必须止损**：趋势反转信号就是离场信号，绝不扛单
- **震荡市失效**：横盘期信号频繁，需要 ADX 等趋势过滤器

## 参考

- 趋势指标：[移动平均线](../../indicators/trend/ma) · [MACD](../../indicators/trend/macd) · [ADX](../../indicators/trend/adx)
- 风险管理：[止损策略](../../methodology/risk-management/stop-loss) · [仓位管理](../../methodology/risk-management/position-sizing)
