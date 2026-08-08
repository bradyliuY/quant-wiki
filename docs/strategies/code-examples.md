---
title: 策略代码实现（示意伪代码）
---

# 策略代码实现（示意伪代码）

> **说明**：以下均为**教学用伪代码**，只表达每个策略「信号 → 进出场 → 止损 → 仓位」的核心骨架，**不是可直接运行的实盘代码**。实盘还需处理数据获取、滑点、手续费、复权与风控。
>
> 约定与 [第一个策略](../getting-started/first-strategy) 的 Python 片段一致：`buy(risk=2%)` 表示该笔交易用总资金的 2% 做风险预算（仓位 = 风险额 ÷ 止损距离）。伪代码里的 `SMA/EMA/RSI/KDJ/ATR` 均为本站[指标库](../indicators/)同名指标的示意写法。

## 趋势跟踪

### [双均线交叉](./trend-following/ma-crossover)

```python
ma_fast = SMA(close, 5)                      # 快速均线
ma_slow = SMA(close, 20)                     # 慢速均线

if no_position and cross_up(ma_fast, ma_slow) and slope(ma_slow) > 0:
    buy(risk=2%)                             # 顺势金叉入场，单笔风险 2%
elif has_position and cross_down(ma_fast, ma_slow):
    sell_all()                               # 死叉离场
# 止损：跌破入场 K 线最低价（见 [止损策略](../methodology/risk-management/stop-loss)）
```

### [MACD 交易系统](./trend-following/macd-strategy)

```python
dif = EMA(close, 12) - EMA(close, 26)        # 快慢均线差
dea = EMA(dif, 9)                            # 信号线

if no_position and cross_up(dif, dea) and dif > 0:   # 零轴上方金叉更可靠
    buy(risk=2%)
elif has_position and (cross_down(dif, dea) or dif < 0):
    sell_all()                               # 死叉 / 跌破零轴离场
```

### [海龟交易法则](./trend-following/turtle-trading)

```python
entry_high = highest(high, 20)               # 20 日最高价（入场通道）
exit_low   = lowest(low, 10)                 # 10 日最低价（离场通道）

if no_position and close > entry_high:
    buy(risk=1%)                             # 突破 20 日高入场
elif has_position and close < exit_low:
    sell_all()                               # 跌破 10 日低离场
# 仓位：unit = 1%风险 / ATR(20)；最多 4 单位、每涨 0.5×ATR 加一单位
```

### [通道突破](./trend-following/channel-breakout)

```python
upper = SMA(close, 20) + 2 * STD(close, 20)  # 布林上轨（或唐奇安上沿）
lower = SMA(close, 20) - 2 * STD(close, 20)  # 布林下轨

if no_position and close > upper and VOL > 1.2 * MA(vol, 5):
    buy(risk=2%)                             # 放量突破上轨入场
elif has_position and close < lower:
    sell_all()                               # 跌破下轨离场
```

## 均值回归

### [布林带回归](./mean-reversion/bollinger-bounce)

```python
mid   = SMA(close, 20)
upper = mid + 2 * STD(close, 20)
lower = mid - 2 * STD(close, 20)
bandwidth = (upper - lower) / mid            # 带宽收窄 = 震荡市

if no_position and close <= lower and RSI(14) < 30 and is_bullish_candle():
    buy(risk=1.5%)                           # 触下轨 + 超卖 + 反转 K 线三重共振
elif has_position and close >= mid:
    sell_half()                              # 反弹到中轨先减半仓
elif has_position and close > upper:
    sell_all()                               # 到上轨清仓
# 止损：收盘连续 3 日收于下轨外，或跌破下轨 2×ATR
```

### [RSI 反转](./mean-reversion/rsi-reversal)

```python
rsi = RSI(close, 14)

if no_position and rsi < 30 and cross_up(rsi, 30):
    buy(risk=1.5%)                           # 超卖回升入场
elif no_position and bearish_divergence(price, rsi):   # 底背离（更强信号）
    buy(risk=1%)
elif has_position and rsi > 70:
    sell_all()                               # 超买离场
```

### [KD 超买超卖](./mean-reversion/stochastic-strategy)

```python
k, d, j = KDJ(high, low, close, 9)           # KDJ(9,3,3)

if no_position and k < 20 and cross_up(k, d):        # 超卖区金叉
    buy(risk=1.5%)
elif has_position and k > 80 and cross_down(k, d):   # 超买区死叉
    sell_all()
# 只在 50 上方的超卖金叉 / 50 下方的超买死叉做，过滤震荡
```

### [配对交易](./mean-reversion/pairs-trading)

```python
z = (spread - mean(spread, 60)) / STD(spread, 60)    # 价差 z 值

if no_position and z < -2:                            # 价差被低估
    buy_long(A); short(B, notional=same)             # 做多弱的一只、做空强的一只，等额对冲
elif no_position and z > 2:
    buy_long(B); short(A)
elif has_position and abs(z) < 0.5:                  # 价差回归均值
    close_all()                                      # 双向平仓
# 止损：z 突破 ±3σ，或持仓超 30 天未回归——配对最怕「均值漂移」
```

## 动量策略

### [双动量轮动](./momentum/dual-momentum)

```python
mom_abs = price / price_12m_ago - 1          # 绝对动量：12 个月涨幅
mom_rel = mom_abs - mom_benchmark            # 相对动量：跑赢基准

if mom_abs > 0 and mom_rel > 0:               # 绝对 + 相对双过滤
    buy(portfolio)                           # 持有（或轮入最强资产）
else:
    sell_all(); hold_cash()                  # 任一不满足 → 空仓/现金
# 每月末再平衡一次
```

### [RSI 动量](./momentum/rsi-momentum)

```python
rsi  = RSI(close, 14)
ma20 = SMA(close, 20)

if no_position and cross_up(rsi, 50) and close > ma20:  # 站上 50 + 价在 MA20 上方
    buy(risk=2%)                             # 趋势中的动能延续
elif has_position and cross_down(rsi, 50):
    sell_all()                               # 动能跌破强弱分界离场
```

### [相对强弱排名](./momentum/strength-ranking)

```python
for asset in universe:                       # 候选池（如 20 只行业 ETF）
    rs[asset] = ret(asset, 20/60/120) - ret(benchmark)   # 多周期超额收益

if rs[asset] > 0 and rank(rs, asset) in top_20%:        # 跑赢基准 + 排名前 20%
    buy(asset, weight=1 / N)                 # 入选者等权买入
elif rs[asset] < 0 or rank(rs, asset) not in top_30%:
    sell(asset)                              # 排名淘汰 / RS 转负即剔除
# 每月末重排；不做单票止损，「排名淘汰」就是它的止损
```

## 形态交易

### [双底突破](./pattern-trading/double-bottom-trade)

```python
if pattern == 'double_bottom':               # 识别 W 底（两个相近低点 + 中间反弹）
    neckline = resistance_between_peaks
    if no_position and close > neckline and VOL > 1.5 * MA(vol, 20):
        buy(risk=2%)                         # 放量突破颈线入场
        target = neckline + (neckline - lowest_low)     # 目标价 = 形态高度
elif has_position and close < neckline:
    sell_all()                               # 假突破跌破颈线止损
```

### [三角形突破](./pattern-trading/triangle-breakout)

```python
if pattern == 'triangle_ascending':          # 上升三角：上沿水平、下沿抬高
    if no_position and close > upper_trendline and VOL > MA(vol, 20):
        buy(risk=2%)                         # 放量突破上沿
    elif has_position and close < lower_trendline:
        sell_all()                           # 假突破止损
# 目标价 = 突破点 ± 三角形高度；上下沿都要放量确认
```

### [头肩形态](./pattern-trading/head-shoulders-trade)

```python
if pattern == 'head_shoulders_top':          # 头肩顶：左肩 - 头 - 右肩
    neckline = line(left_shoulder_low, right_shoulder_low)
    if no_position and close < neckline:
        sell_all()                           # 跌破颈线确认反转离场
# 目标价 = 颈线 − (头 − 颈线)；跌破后反抽颈线是最后离场点
```

### [旗形交易](./pattern-trading/flag-consolidation)

```python
if pattern == 'flag':                        # 强趋势后的旗形整理
    flag_upper = highest(high, 20)           # 旗面高点
    if no_position and close > flag_upper and trend_is_up:
        buy(risk=2%)                         # 旗面向上突破，顺势延续
    elif has_position and close < lowest(low, 10):
        sell_all()                           # 跌破旗面下沿离场
# 只在明确上升趋势中做旗形中继，不做底部旗形
```

## 量化进阶

### [多因子模型](./quantitative/factor-model)

```python
for stock in universe:                       # 对股票池打分
    f_value   = zscore(factor_value(stock))  # 价值因子（PE/PB 反向）
    f_moment  = zscore(factor_momentum(stock))  # 动量因子
    f_quality = zscore(factor_quality(stock))   # 质量因子
    score[stock] = w1*f_value + w2*f_moment + w3*f_quality   # 加权总分

buy(top_k(score, k=30))                      # 定期买入得分最高的一篮子
# 每月/季度再平衡；因子要逐期检验 IC，警惕过拟合（见 [回测陷阱](../methodology/backtesting/common-pitfalls)）
```

### [网格交易](./quantitative/grid-trading)

```python
levels = linspace(lo, hi, n=10)              # 在 [下沿, 上沿] 均分 10 格

if close <= lvl and no_position_at(lvl):
    buy_unit(lvl, size=1)                    # 跌到一格买一份
elif close >= lvl and has_position_at(lvl):
    sell_unit(lvl)                           # 涨到一格卖一份
if close < lo - 1 * ATR(14):
    stop_all()                               # 跌破下沿 1×ATR 越界止损
# 网格最怕单边行情——区间判错必须止损，不能无限摊薄
```

### [风险平价](./quantitative/risk-parity)

```python
# 目标：让每个资产对组合总风险的贡献相等
weights = equal_risk_contribution(cov_matrix, assets)

rebalance(weights, every='month')            # 定期按目标权重再平衡
# 高波动资产权重小、低波动资产权重大（债 > 股 > 商品）
# 用样本外协方差估计，避免极端权重（见 [组合风险管理](../methodology/risk-management/portfolio-risk)）
```

## 相关

- [第一个策略](../getting-started/first-strategy)：双均线策略的完整 Python 示例
- [回测方法论](../methodology/backtesting/how-to-backtest)：写对规则后如何验证
- [风险管理](../methodology/risk-management/)：`risk=X%` 背后的仓位与止损框架
