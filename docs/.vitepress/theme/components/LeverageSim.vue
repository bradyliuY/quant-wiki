<script setup lang="ts">
/**
 * 杠杆与做空模拟器
 * 直观展示：做多/做空 + 杠杆倍数 → 账户盈亏。
 * 拖动滑块看"5 倍杠杆，标涨 2%，账户涨 10%"这类关系。
 * 新手理解"杠杆放大盈亏""做空赚钱原理"的最佳工具。
 */
import { ref, computed } from 'vue'

const mode = ref<'long' | 'short'>('long')
const leverage = ref(3)
const priceMove = ref(5) // 标的价格涨跌幅 %

// 标的价格基数（视觉用）
const basePrice = 100
// 标价变动后的价格（与多空无关，始终按 priceMove 变动）
const resultPrice = computed(() => basePrice * (1 + priceMove.value / 100))
// 账户盈亏：做多跟随标价，做空反向
const accountPnlPercent = computed(() => (priceMove.value * leverage.value * (mode.value === 'long' ? 1 : -1)).toFixed(1))

// 视觉条：标的 vs 账户 变动
const barScale = 150 // px per 10%
function barWidth(pct: number) {
  return Math.abs(pct) / 10 * barScale
}
const priceBarPct = computed(() => (mode.value === 'long' ? priceMove.value : -priceMove.value))
const accountBarPct = computed(() => priceMove.value * leverage.value * (mode.value === 'long' ? 1 : -1))

const color = (pct: number) => (pct >= 0 ? '#26a69a' : '#ef5350')
</script>

<template>
  <div class="chart-container leverage-sim">
    <div class="demo-title">杠杆与做空模拟器</div>

    <div class="ls-controls">
      <div class="ls-tabs">
        <button :class="{ active: mode === 'long' }" @click="mode = 'long'">做多（先买后卖）</button>
        <button :class="{ active: mode === 'short' }" @click="mode = 'short'">做空（先借后买还）</button>
      </div>
      <label class="ls-slider">
        <span>杠杆倍数</span>
        <input type="range" min="1" max="10" :value="leverage" @input="(e) => (leverage = Number((e.target as HTMLInputElement).value))" />
        <span class="ls-val">{{ leverage }}x</span>
      </label>
      <label class="ls-slider">
        <span>标的涨跌 %</span>
        <input type="range" min="-10" max="10" :value="priceMove" @input="(e) => (priceMove = Number((e.target as HTMLInputElement).value))" />
        <span class="ls-val">{{ priceMove > 0 ? '+' : '' }}{{ priceMove }}%</span>
      </label>
    </div>

    <div class="ls-visual">
      <!-- 标的变动条 -->
      <div class="ls-row">
        <div class="ls-row-label">标的变动</div>
        <div class="ls-bar-track">
          <div class="ls-bar-mid"></div>
          <div class="ls-bar-fill" :style="{ width: Math.min(Math.abs(barWidth(priceBarPct)), 260) + 'px', background: color(priceBarPct), marginLeft: priceBarPct >= 0 ? '130px' : 'auto' }"></div>
        </div>
        <div class="ls-row-val" :style="{ color: color(priceBarPct) }">{{ priceBarPct > 0 ? '+' : '' }}{{ priceBarPct.toFixed(1) }}%</div>
      </div>
      <!-- 账户盈亏条 -->
      <div class="ls-row">
        <div class="ls-row-label">账户盈亏</div>
        <div class="ls-bar-track">
          <div class="ls-bar-mid"></div>
          <div class="ls-bar-fill" :style="{ width: Math.min(Math.abs(barWidth(accountBarPct)), 260) + 'px', background: color(accountBarPct), marginLeft: accountBarPct >= 0 ? '130px' : 'auto' }"></div>
        </div>
        <div class="ls-row-val" :style="{ color: color(accountBarPct) }">{{ accountPnlPercent }}%</div>
      </div>
      <!-- 放大倍数标注 -->
      <div class="ls-multiplier">
        ⚡ 账户波动 = 标的波动 × 杠杆 = {{ Math.abs(priceMove) }}% × {{ leverage }}x = <b>{{ Math.abs(accountPnlPercent) }}%</b>
      </div>
    </div>

    <div class="ls-result">
      <div v-if="mode === 'long'">
        <span v-if="priceMove >= 0">📈 做多：标价从 {{ basePrice }} 涨到 {{ resultPrice.toFixed(1) }}，账户赚 <b style="color:#26a69a">{{ accountPnlPercent }}%</b></span>
        <span v-else>📉 做多：标价从 {{ basePrice }} 跌到 {{ resultPrice.toFixed(1) }}，账户亏 <b style="color:#ef5350">{{ accountPnlPercent }}%</b></span>
      </div>
      <div v-else>
        <span v-if="priceMove <= 0">📉 做空：标价从 {{ basePrice }} 跌到 {{ resultPrice.toFixed(1) }}，账户赚 <b style="color:#26a69a">{{ accountPnlPercent }}%</b></span>
        <span v-else>📈 做空：标价从 {{ basePrice }} 涨到 {{ resultPrice.toFixed(1) }}，账户亏 <b style="color:#ef5350">{{ accountPnlPercent }}%</b></span>
      </div>
      <div class="ls-hint">
        {{ mode === 'long' ? '做多逻辑：低价买入 → 高价卖出，赚差价。标价上涨才赚钱。' : '做空逻辑：先借入股票卖出 → 价格下跌后低价买回还给券商，赚差价。标价下跌才赚钱。' }}
        {{ leverage > 1 ? `但 ${leverage}x 杠杆把盈亏放大了 ${leverage} 倍——方向对了赚 ${leverage} 倍，方向错了也亏 ${leverage} 倍。` : '' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ls-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  padding: 14px 16px 8px;
}
.ls-tabs { display: flex; gap: 6px; }
.ls-tabs button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  padding: 5px 12px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.ls-tabs button.active { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.ls-slider { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888; }
.ls-slider input { width: 120px; }
.ls-val { min-width: 38px; text-align: right; font-weight: 700; color: var(--vp-c-text-1); }

.ls-visual { padding: 8px 20px 12px; }
.ls-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
}
.ls-row-label { width: 70px; font-size: 12px; color: #888; text-align: right; }
.ls-bar-track {
  position: relative;
  width: 280px;
  height: 26px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
}
.dark .ls-bar-track { background: rgba(255, 255, 255, 0.06); }
.ls-bar-mid {
  position: absolute;
  left: 50%;
  top: 0;
  width: 2px;
  height: 100%;
  background: #bbb;
}
.dark .ls-bar-mid { background: #666; }
.ls-bar-fill {
  position: absolute;
  top: 4px;
  height: 18px;
  border-radius: 3px;
  transition: all 0.2s;
  opacity: 0.85;
}
.ls-row-val { width: 60px; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ls-multiplier {
  margin: 8px 0 0 80px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-brand-soft);
  border-radius: 6px;
  padding: 8px 12px;
}

.ls-result { padding: 12px 16px 14px; border-top: 1px solid var(--vp-c-divider); font-size: 14px; }
.ls-hint { margin-top: 8px; font-size: 12px; color: #999; }
</style>
