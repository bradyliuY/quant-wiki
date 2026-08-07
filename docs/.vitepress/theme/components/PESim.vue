<script setup lang="ts">
/**
 * PE 估值交互组件
 * 滑块调整「股价」和「每股收益(EPS)」，实时计算 PE 并判断贵不贵。
 * 让"PE = 市值 ÷ 净利润 = 多少年回本"这种抽象概念直观化。
 */
import { ref, computed } from 'vue'

const price = ref(50) // 股价（元）
const eps = ref(2) // 每股收益 EPS（元/年）

const pe = computed(() => price.value / eps.value)
const peDisplay = computed(() => pe.value.toFixed(1))

// 行业参考：不同 PE 区间的判断
const verdict = computed(() => {
  if (pe.value <= 0) return { text: '亏损/负收益——PE 无意义，改用 PS 或 PB', color: '#888' }
  if (pe.value < 10) return { text: '相对便宜（但需警惕是否增长停滞/景气下行）', color: '#26a69a' }
  if (pe.value < 25) return { text: '中性区间（成熟市场大盘股常见）', color: '#1e5fd0' }
  if (pe.value < 50) return { text: '相对偏贵（成长股常见，需高增速支撑）', color: '#f59e0b' }
  return { text: '很贵（隐含极高增长预期，或市场情绪过热）', color: '#ef5350' }
})

// 回本年限视觉条（0-50 年）
const years = computed(() => (pe.value > 0 ? Math.min(50, pe.value) : 0))
</script>

<template>
  <div class="chart-container pe-sim">
    <div class="demo-title">PE 市盈率交互：多少年回本？</div>

    <div class="pe-controls">
      <label class="pe-slider">
        <span>股价</span>
        <input type="range" min="5" max="200" :value="price" @input="(e) => (price = Number((e.target as HTMLInputElement).value))" />
        <span class="pe-val">¥{{ price }}</span>
      </label>
      <label class="pe-slider">
        <span>每股收益 EPS</span>
        <input type="range" min="0.2" max="10" step="0.2" :value="eps" @input="(e) => (eps = Number((e.target as HTMLInputElement).value))" />
        <span class="pe-val">¥{{ eps.toFixed(1) }}/年</span>
      </label>
    </div>

    <div class="pe-body">
      <div class="pe-big">
        <div class="pe-label">PE = 股价 ÷ EPS</div>
        <div class="pe-number">{{ peDisplay }}</div>
        <div class="pe-eq">= ¥{{ price }} ÷ ¥{{ eps.toFixed(1) }}</div>
      </div>

      <div class="pe-verdict">
        <span class="pe-verdict-dot" :style="{ background: verdict.color }"></span>
        <span :style="{ color: verdict.color, fontWeight: 600 }">{{ verdict.text }}</span>
      </div>

      <div class="pe-years">
        <div class="pe-years-label">含义：按当前盈利，约 <b>{{ years.toFixed(1) }}</b> 年赚回买入价</div>
        <div class="pe-years-track">
          <div class="pe-years-fill" :style="{ width: (years.value / 50) * 100 + '%', background: verdict.color }"></div>
          <span v-for="y in [0, 10, 20, 30, 40, 50]" :key="y" class="pe-years-tick" :style="{ left: (y / 50) * 100 + '%' }">{{ y }}</span>
        </div>
      </div>

      <div class="pe-hint">
        💡 PE 的本质是"**回本年限**"：花 ¥{{ price }} 买一股，每年赚 ¥{{ eps.toFixed(1) }}，理论上次年收入抵掉 ¥{{ eps.toFixed(1) }} 成本。
        但这建立在**盈利稳定**的前提上——如果明年 EPS 下降，回本年限会拉长。所以 PE 必须结合**增速（PEG）**和**行业对比**看。
      </div>
    </div>
  </div>
</template>

<style scoped>
.pe-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 14px 16px 8px;
}
.pe-slider { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888; }
.pe-slider input { width: 160px; }
.pe-val { min-width: 60px; text-align: right; font-weight: 700; color: var(--vp-c-text-1); font-variant-numeric: tabular-nums; }

.pe-body { padding: 12px 20px 16px; }
.pe-big { text-align: center; padding: 8px 0; }
.pe-label { font-size: 13px; color: #888; margin-bottom: 4px; }
.pe-number { font-size: 48px; font-weight: 800; color: var(--vp-c-brand-1); line-height: 1.1; font-variant-numeric: tabular-nums; }
.pe-eq { font-size: 13px; color: var(--vp-c-text-2); margin-top: 4px; font-variant-numeric: tabular-nums; }

.pe-verdict {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 10px 14px;
  background: var(--vp-c-brand-soft);
  border-radius: 6px;
  font-size: 14px;
}
.pe-verdict-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.pe-years { margin-top: 8px; }
.pe-years-label { font-size: 13px; margin-bottom: 6px; }
.pe-years-track {
  position: relative;
  height: 16px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
.dark .pe-years-track { background: rgba(255, 255, 255, 0.08); }
.pe-years-fill { height: 100%; border-radius: 4px; opacity: 0.7; transition: all 0.2s; }
.pe-years-tick {
  position: absolute;
  top: 18px;
  transform: translateX(-50%);
  font-size: 10px;
  color: #aaa;
}
.pe-hint {
  margin-top: 26px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  padding: 10px 14px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 6px;
}
</style>
