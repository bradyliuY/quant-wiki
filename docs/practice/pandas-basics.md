---
title: pandas 数据处理与画图
difficulty: 进阶
---

# pandas 数据处理与画图

一句话：上一页用 AkShare 拉回了 CSV，这一页教你把「生数据」加工成「能喂回测、能画出净值图」的干净数据——这是数据获取与回测之间最容易卡住的一公里。

<PlainTalk>拉到的数据像刚从市场买的「生肉」：日期是字符串、可能有停牌空行、还乱序。pandas 是菜刀加案板——切块（清洗）、切片（选列）、调味（算指标）；matplotlib 是摆盘——把结果画成一眼能看懂的图。回测脚本只认「干净整齐的表格」，这一页就是把肉处理好递过去。</PlainTalk>

## 一、装工具

```bash
pip install pandas matplotlib
```

pandas 负责处理表格数据，matplotlib 负责画图。装好后在 [Jupyter](../practice/python-setup) 里一行行跑最容易理解——边跑边看每一步表格长什么样。

## 二、生成一份练习数据（合成，仅教学）

本站不提供真实行情，先造一份**随机游走合成数据**来熟悉流程（明确标注：非任何真实股票）：

```python
import numpy as np
import pandas as pd

np.random.seed(42)                                   # 固定随机种子，保证可复现
n = 200                                              # 200 个交易日
dates = pd.bdate_range('2023-01-02', periods=n)      # 跳过周末的交易日序列
ret = np.random.normal(0.0005, 0.02, n)              # 每日收益率 ~ N(0.05%, 2%)
close = 100 * np.exp(np.cumsum(ret))                 # 复利累计成价格序列

df = pd.DataFrame({'date': dates, 'close': close.round(2)})
print(df.head())
```

关键点：**价格不是造出来的，是由收益率一步步复利累加出来的**——这样每一步都有金融意义，且完全可复现。

## 三、三步清洗（pandas 的看家本领）

真实 CSV 最常见三个毛病，一列一步：

```python
# 1. 日期字符串 → 时间类型（否则排序和画图都会乱）
df['date'] = pd.to_datetime(df['date'])

# 2. 乱序 → 按日期排序（数据源不一定保证顺序）
df = df.sort_values('date').reset_index(drop=True)

# 3. 停牌缺行 → 前向填充（上一交易日收盘价当作今天开盘参考）
df = df.set_index('date')
df = df.asfreq('B')          # 补齐缺失的交易日
df['close'] = df['close'].ffill()   # 缺口用最近价填充
df = df.reset_index().dropna()
```

> 第 3 步只用在对缺口敏感的场景（比如按日连续计算指标）。如果只是画图，跳过也行。

## 四、算两个核心量：收益率与净值

这层是后面所有回测/绩效指标的地基：

```python
df['ret'] = df['close'].pct_change()            # 今日 vs 昨日的涨跌幅
df['net'] = (1 + df['ret']).cumprod()           # 累计净值，起点=1（复利连乘）
```

- `pct_change()`：一列搞定"每根 K 线的收益率"，第一个值是 `NaN`（没有昨日可比）
- `cumprod()`：把每天涨跌连乘起来，就是"期初 1 元到今天变几元"——**净值曲线**

想和站点指标口径对起来：`pct_change` + 滚动窗口就能重算本站[均线](../indicators/trend/ma)、[收益率](../methodology/statistics/expected-value)等概念，用的就是这套底层逻辑。

## 五、用 pandas 算均线（指标由数据算出来）

```python
df['sma5']  = df['close'].rolling(5).mean()     # 5 日均线
df['sma20'] = df['close'].rolling(20).mean()    # 20 日均线
print(df.tail())
```

`rolling(n).mean()` 就是移动平均：取最近 n 根 K 线的均值。**前 n−1 行是 `NaN`**——滚动窗口没填满，处理成空即可，别把它们当真实数值喂进回测。

## 六、画出来（matplotlib）

数据收拾干净了，一眼看清长什么样。**先配中文字体**，否则图里的中文标签会显示成方框（matplotlib 默认字体不含中文）：

```python
import matplotlib.pyplot as plt

# 中文字体配置（四选一，会命中的第一个生效；负号也要设）
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'Noto Sans CJK SC', 'PingFang SC', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False
```

然后画图：

```python
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7), sharex=True)

# 上图：收盘价 + 两条均线
ax1.plot(df['date'], df['close'], label='收盘价', color='#e69138')
ax1.plot(df['date'], df['sma5'],  label='MA5',    color='#1e5fd0')
ax1.plot(df['date'], df['sma20'], label='MA20',   color='#7b1fa2')
ax1.set_title('价格与均线')
ax1.legend()
ax1.grid(alpha=0.3)

# 下图：累计净值（起点=1）
ax2.plot(df['date'], df['net'], color='#26a69a')
ax2.set_title('累计净值（期初 1 元）')
ax2.grid(alpha=0.3)

plt.tight_layout()
plt.show()
```

颜色沿用本站图例约定（橙=收盘价、蓝=MA5、紫=MA20、绿=净值），和指标页的演示图能对上。**画图的目的不是好看，是"看出来"**——均线在价格上方还是下方、净值曲线是否稳步抬升，一眼就知道这组数据是什么行情。

## 七、换成你自己的数据（只改一步）

练习跑通了，把合成数据换成本页[《Python 环境与数据获取》](./python-setup)拉下来的 `data.csv`，只需把第二节换成：

```python
df = pd.read_csv('data.csv')
df['date'] = pd.to_datetime(df['date'])          # AkShare 的日期列
df = df.sort_values('date').reset_index(drop=True)
# 只用 close 列；CSV 里其余列（open/high/low/volume…）暂时用不上
```

后面三到六节的代码一行都不用改——这就是「数据层与策略层解耦」的雏形：回测脚本只认 `date + close` 两列，谁喂的都行。

## 常见坑

- <span class="qw-no">✕</span> 日期是字符串就开始画图：x 轴乱序、刻度全是文本重叠 → 先 `pd.to_datetime`
- <span class="qw-no">✕</span> 不排序直接 rolling / 画图：连线在中间乱窜 → 先 `sort_values`
- <span class="qw-no">✕</span> 前复权（qfq）和不复权的数据混用：分红除权会造成假跳空，指标和回测都被污染 → 全流程统一用一种复权口径
- <span class="qw-no">✕</span> 把 `rolling` 前几行的 `NaN` 当真实数值算指标/回测 → 先 `dropna()` 或 `fillna`
- <span class="qw-ok">✓</span> 每步都 `print(df.head())` 看一眼：数据处理 80% 的 bug 是"我以为列是这个值"
- <span class="qw-ok">✓</span> 固定随机种子 `np.random.seed(42)`：合成数据可复现，别人的错误能一起查

## 下一步

- 数据加工好了，进 [用回测框架跑通第一个策略](./first-backtest) 把它喂给 backtrader
- 想验证你的清洗逻辑对不对：[回测实验室](./backtest-lab) 里同一套规则，浏览器先跑一遍对照
- 指标口径对不上：[MA 指标页](../indicators/trend/ma) 有公式与演示

## 相关

- [Python 环境与数据获取](./python-setup) — 前一步：装环境、拉数据
- [用回测框架跑通第一个策略](./first-backtest) — 后一步：把数据喂进回测
- [回测的正确流程](../methodology/backtesting/how-to-backtest) — 清洗后怎么验证才严谨
- [常见回测陷阱](../methodology/backtesting/common-pitfalls) — 数据层埋的雷多在回测时炸
