<script setup lang="ts">
/**
 * 指标选择地图
 * 左侧是"你关心的问题"，右侧是对应的推荐指标卡片。
 * 点击需求按钮高亮该组卡片，点击卡片跳转到对应指标页。
 *
 * 用法：
 * <IndicatorPicker title="场景 → 指标选择地图" />
 */
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '场景 → 指标选择地图' }
)

type Need = {
  label: string
  icon: string
  hint: string
  indicators: { name: string; link: string; tagline: string; color: string }[]
}

const NEEDS: Need[] = [
  {
    label: '判断趋势方向',
    icon: '📈',
    hint: '先回答"价格往哪走"，这是所有入场的前提。',
    indicators: [
      { name: '移动平均线 MA', link: '/indicators/trend/ma', tagline: '价格的平均水平线', color: '#1e5fd0' },
      { name: 'MACD', link: '/indicators/trend/macd', tagline: '快慢均线差，金叉死叉', color: '#1e5fd0' },
      { name: '一目均衡表', link: '/indicators/overlay/ichimoku', tagline: '一个图看趋势/支撑/买卖', color: '#7c5cff' }
    ]
  },
  {
    label: '衡量趋势强度',
    icon: '💪',
    hint: '趋势方向对了，还要知道它"还有没有力气"。',
    indicators: [
      { name: 'ADX', link: '/indicators/trend/adx', tagline: '趋势有没有"力气"（不判方向）', color: '#26a69a' }
    ]
  },
  {
    label: '找超买超卖',
    icon: '🎯',
    hint: '价格短期涨/跌过头，寻找逆势入场点。',
    indicators: [
      { name: 'RSI', link: '/indicators/momentum/rsi', tagline: '超买超卖 + 背离', color: '#26a69a' },
      { name: '随机指标 KD', link: '/indicators/momentum/stochastic', tagline: '价格在区间内的位置', color: '#26a69a' },
      { name: '威廉指标 %R', link: '/indicators/momentum/williams-r', tagline: 'RSI 的"兄弟"指标', color: '#26a69a' }
    ]
  },
  {
    label: '衡量波动 / 设止损',
    icon: '🌊',
    hint: '波动大小决定止损距离和仓位大小。',
    indicators: [
      { name: 'ATR', link: '/indicators/volatility/atr', tagline: '最近平均每天波动多少', color: '#ff9800' },
      { name: '布林带', link: '/indicators/volatility/bollinger-bands', tagline: '标准差通道，波动"温度计"', color: '#ff9800' },
      { name: '肯特纳通道', link: '/indicators/volatility/keltner-channels', tagline: 'ATR 版通道', color: '#ff9800' }
    ]
  },
  {
    label: '确认量价配合',
    icon: '💰',
    hint: '价格上涨有没有资金支持，量在价先。',
    indicators: [
      { name: 'OBV', link: '/indicators/volume/obv', tagline: '量能累计能量潮', color: '#e91e63' },
      { name: 'MFI', link: '/indicators/volume/mfi', tagline: '量价结合的 RSI', color: '#e91e63' },
      { name: '成交量分布', link: '/indicators/volume/volume-profile', tagline: '哪里交易最密集', color: '#e91e63' }
    ]
  },
  {
    label: '找日内关键位',
    icon: '🗺️',
    hint: '日内作战地图：支撑位、阻力位、枢轴。',
    indicators: [
      { name: '枢轴点', link: '/indicators/overlay/pivot-points', tagline: '日内关键位计算', color: '#7c5cff' }
    ]
  },
  {
    label: '找背离',
    icon: '⚡',
    hint: '价格创新高但指标不走高 = 动能衰竭预警。',
    indicators: [
      { name: 'RSI', link: '/indicators/momentum/rsi', tagline: '背离信号的经典验证工具', color: '#26a69a' },
      { name: 'MACD', link: '/indicators/trend/macd', tagline: '柱体面积与价格背离', color: '#1e5fd0' }
    ]
  }
]

const active = ref<Need | null>(NEEDS[0])

function select(n: Need) {
  active.value = active.value === n ? null : n
}
</script>

<template>
  <div class="chart-container indicator-picker">
    <div class="demo-title">{{ title }}</div>
    <p class="ip-hint">先想清楚"你要回答什么问题"，再选指标——不要反过来为了用指标而找问题。</p>

    <div class="ip-body">
      <!-- 左侧：需求列表 -->
      <div class="ip-needs">
        <button
          v-for="n in NEEDS"
          :key="n.label"
          class="ip-need"
          :class="{ active: active === n }"
          @click="select(n)"
        >
          <span class="ip-need-icon">{{ n.icon }}</span>
          <span class="ip-need-label">{{ n.label }}</span>
        </button>
      </div>

      <!-- 右侧：指标卡片 -->
      <div class="ip-cards">
        <div v-if="active" class="ip-card-panel">
          <div class="ip-card-hint">{{ active.hint }}</div>
          <div class="ip-card-grid">
            <a
              v-for="ind in active.indicators"
              :key="ind.name"
              class="ip-card"
              :href="ind.link"
              :style="{ '--card-color': ind.color }"
            >
              <div class="ip-card-name">{{ ind.name }}</div>
              <div class="ip-card-tagline">{{ ind.tagline }}</div>
              <div class="ip-card-go">查看 →</div>
            </a>
          </div>
        </div>
        <div v-else class="ip-card-panel ip-empty">
          点击左侧选择一个需求，查看推荐指标。
        </div>
      </div>
    </div>

    <p class="ip-principle">💡 组合原则：先用<b>趋势指标</b>定方向，再用<b>动量指标</b>找入场点，最后用<b>波动率指标</b>设止损——单指标会骗人，多指标共振才可靠。</p>
  </div>
</template>

<style scoped>
.indicator-picker { padding: 0 0 8px; }
.ip-hint { font-size: 12px; color: var(--vp-c-text-3); padding: 0 16px 8px; margin: 0; }
.ip-body {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  padding: 0 16px;
}
@media (max-width: 720px) { .ip-body { grid-template-columns: 1fr; } }

.ip-needs { display: flex; flex-direction: column; gap: 6px; }
.ip-need {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: transparent;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.ip-need:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.ip-need.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.ip-need-icon { font-size: 16px; }
.ip-need-label { flex: 1; }

.ip-card-panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 14px;
  min-height: 160px;
  background: var(--vp-c-bg-soft);
}
.ip-card-hint { font-size: 12px; color: var(--vp-c-text-3); margin-bottom: 10px; }
.ip-empty { display: flex; align-items: center; justify-content: center; color: var(--vp-c-text-3); font-size: 13px; }
.ip-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.ip-card {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-top: 3px solid var(--card-color);
  border-radius: 8px;
  padding: 10px 12px;
  text-decoration: none;
  transition: all 0.2s;
  background: var(--vp-c-bg);
}
.ip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--card-color);
}
.dark .ip-card:hover { box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
.ip-card-name { font-size: 13px; font-weight: 700; color: var(--vp-c-text-1); }
.ip-card-tagline { font-size: 11px; color: var(--vp-c-text-3); margin: 4px 0 8px; line-height: 1.5; }
.ip-card-go { font-size: 12px; color: var(--card-color); font-weight: 600; }

.ip-principle {
  margin: 12px 16px 0;
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  background: var(--vp-c-brand-soft);
  border-radius: 6px;
  padding: 8px 12px;
}
.ip-principle b { color: var(--vp-c-brand-1); }
</style>
