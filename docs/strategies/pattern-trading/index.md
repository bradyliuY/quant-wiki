# 形态交易策略

利用经典技术形态的突破与失效规律交易，形态即"市场参与者的集体决策轨迹"。

## 策略一览

| 策略 | 难度 | 核心思想 | 适合市场 |
|------|------|----------|----------|
| [双底突破](./double-bottom-trade) | <span class="dlv dlv-intermediate">进阶</span> | W 底颈线突破做多 | 下跌转上涨 |
| [三角形突破](./triangle-breakout) | <span class="dlv dlv-intermediate">进阶</span> | 三角收敛后突破方向 | 盘整转趋势 |
| [头肩形态](./head-shoulders-trade) | <span class="dlv dlv-intermediate">进阶</span> | 头肩顶/底反转 | 趋势末端 |
| [旗形交易](./flag-consolidation) | <span class="dlv dlv-intermediate">进阶</span> | 旗形中继后顺势延续 | 强趋势中途 |

> 难度：入门 → 进阶 → 挑战。本族全部为「进阶」——识别形态 + 等待突破确认，比纯规则策略更吃盘感。

## 共性特征

- **突破确认**：形态完成后需放量突破颈线/边界确认，假突破频繁
- **目标测算**：形态高度决定了理论目标价
- **止损明确**：形态关键位（颈线、下边界）就是天然止损位
- **成功概率**：经典形态成功率 60-75%，仍需严格风控

## 参考

- 形态识别库：[反转形态](../../methodology/pattern-library/reversal-patterns) · [中继形态](../../methodology/pattern-library/continuation-patterns)
- 成交量配合：[OBV](../../indicators/volume/obv) · [成交量分布](../../indicators/volume/volume-profile)
- 风险管理：[止损策略](../../methodology/risk-management/stop-loss)
