---
title: 用回测框架跑通第一个策略
difficulty: 进阶
---

# 用回测框架跑通第一个策略

一句话：回测实验室教机制，本页给一套**能在你电脑上跑通**的最小真实回测脚本。

<PlainTalk>浏览器里的回测实验室像「试驾」，本页的 backtrader 脚本像「买车开回家」。脚本里的每一行都会真实执行：真实的价格、真实的手续费、真实的成交规则——跑完你就拥有了自己的第一台"回测机器"。</PlainTalk>

## 选哪个框架

| 框架 | 特点 | 适合 |
|------|------|------|
| backtrader | 老牌、功能全、文档多 | 想深入学回测细节 |
| vectorbt | 快、向量化、更"量化" | 会 pandas、想批量实验 |

本页用 **backtrader** 走读（概念最直白）。安装：`pip install backtrader`——注意它自 2020 年后基本停更，若在新版 Python 上安装/运行报错，退回 Python 3.10 即可，或改用 vectorbt。更多框架对比见 [开源工具推荐](../reference/open-source-tools)。

先准备数据：backtrader 默认按 `datetime, open, high, low, close, volume` 的顺序逐列读取 CSV。若你手上还是 [pandas 数据处理与画图](./pandas-basics) 那页之前的 AkShare 原始 CSV（中文列名），先转成它认得的格式（若你已跑过 pandas 那页第七节、`data.csv` 已是英文列名，这段会自动跳过）：

```python
import pandas as pd
df = pd.read_csv('data.csv')
# 兼容两种来源：AkShare 原始中文列名，或 pandas 那页已导出的英文列名
df = df.rename(columns={'日期':'date','开盘':'open','最高':'high','最低':'low','收盘':'close','成交量':'volume'})
df[['date','open','high','low','close','volume']].rename(columns={'date':'datetime'}).to_csv('data.csv', index=False)
```

## 完整脚本（双均线，本地可跑）

```python
import backtrader as bt

class MaCross(bt.Strategy):
    params = dict(fast=5, slow=20)

    def __init__(self):
        sma_fast = bt.ind.SMA(period=self.p.fast)
        sma_slow = bt.ind.SMA(period=self.p.slow)
        self.crossover = bt.ind.CrossOver(sma_fast, sma_slow)

    def next(self):
        if not self.position and self.crossover > 0:
            self.buy()                     # 金叉买入
        elif self.position and self.crossover < 0:
            self.close()                   # 死叉平仓

if __name__ == "__main__":
    cerebro = bt.Cerebro()
    # 用本地 CSV（见《Python 环境与数据获取》）
    data = bt.feeds.GenericCSVData(
        dataname="data.csv",
        dtformat="%Y-%m-%d",
        openinterest=-1,
    )
    cerebro.adddata(data)
    cerebro.addstrategy(MaCross)
    cerebro.broker.setcash(100000)
    cerebro.broker.setcommission(commission=0.0003)

    print(f"初始资金: {cerebro.broker.getvalue():,.2f}")
    cerebro.run()
    print(f"期末资金: {cerebro.broker.getvalue():,.2f}")
```

## 跑完怎么读

| backtrader 输出 | 对应回测实验室指标卡 |
|-----------------|----------------------|
| 期末资金 | 年化收益（自己换算） |
| 交易笔数 | 交易次数 |
| 手续费/滑点 | 盈亏比的隐性成本 |

把这里的结果和 [回测实验室](./backtest-lab) 的指标卡对照，你会发现**真实框架多出的每一笔手续费和滑点都在吃掉收益**。

## 常见坑

- CSV 列名/日期格式不匹配 → 先 `print(data[0])` 看前几行
- 忘记设手续费 → 回测虚高
- 只用一段数据 → 回测漂亮、实盘打脸（见 [样本外检验](../methodology/backtesting/walk-forward)）

## 相关

- 数据准备：[Python 环境与数据获取](./python-setup)
- 数据处理：[pandas 数据处理与画图](./pandas-basics)（CSV 清洗、算指标、画净值图）
- 回测规范：[回测的正确流程](../methodology/backtesting/how-to-backtest)
- 下一步：[模拟盘实操](./paper-trading)
