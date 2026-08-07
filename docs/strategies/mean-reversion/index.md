# 均值回归策略

"跌多了会反弹，涨多了会回落"——利用价格围绕均值的波动规律，逆向交易。

## 策略一览

| 策略 | 核心思想 | 适合市场 |
|------|----------|----------|
| [布林带回归](./bollinger-bounce) | 触碰上下轨反向操作 | 震荡市 |
| [RSI 反转](./rsi-reversal) | RSI 超买超卖反转 | 震荡市 |
| [KD 超买超卖](./stochastic-strategy) | KD 金叉死叉 + 区间位置 | 震荡市 |
| [配对交易](./pairs-trading) | 两个相关资产价差回归 | 任意市场 |

## 共性特征

- **胜率高、盈亏比低**：回归策略赢面可达 55-70%，但单笔盈利通常小于单笔亏损
- **逆向思维**：别人贪婪我恐惧，在极端位置反向建仓
- **必须设边界**：价格可能长期偏离均值（强趋势中），必须设止损
- **趋势市失效**：单边行情中"抄底摸顶"会被反复打脸

## 参考

- 波动率指标：[布林带](../../indicators/volatility/bollinger-bands) · [ATR](../../indicators/volatility/atr)
- 动量指标：[RSI](../../indicators/momentum/rsi) · [随机指标](../../indicators/momentum/stochastic)
- 风险管理：[止损策略](../../methodology/risk-management/stop-loss)
