<script setup lang="ts">
/**
 * 策略 × 行情 匹配矩阵
 * 行 = 策略族，列 = 行情状态，单元格 = 匹配星级（1-3）。
 * 点击单元格查看"为什么"；点击行/列头可筛选高亮。
 *
 * 用法：
 * <StrategyFit title="策略 × 行情 匹配矩阵" />
 */
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '策略 × 行情 匹配矩阵' }
)

const REGIMES = ['强趋势', '弱趋势', '震荡', '高波动', '低波动', '恐慌暴跌'] as const
type Regime = (typeof REGIMES)[number]

const STRATEGIES: {
  family: string
  color: string
  regimes: Record<Regime, number> // 1-3 星
  why: Record<Regime, string>
}[] = [
  {
    family: '趋势跟踪',
    color: '#1e5fd0',
    regimes: { 强趋势: 3, 弱趋势: 2, 震荡: 1, 高波动: 2, 低波动: 1, 恐慌暴跌: 1 },
    why: {
      强趋势: '趋势跟踪的核心假设就是"趋势会延续"，单边行情里它是赢家。',
      弱趋势: '趋势较弱时胜率下降，但均线系统仍能捕捉部分波段。',
      震荡: '趋势策略在震荡市会被反复"打脸"，高买低卖。',
      高波动: '波动大时趋势更清晰、盈亏比更高，但也更考验止损。',
      低波动: '低波动下趋势缓慢，资金利用率低，信号减少。',
      恐慌暴跌: '暴跌中趋势策略往往已经离场或做空，属于观望/对冲区。'
    }
  },
  {
    family: '均值回归',
    color: '#26a69a',
    regimes: { 强趋势: 1, 弱趋势: 3, 震荡: 3, 高波动: 2, 低波动: 3, 恐慌暴跌: 1 },
    why: {
      强趋势: '强趋势里"超买"会持续超买，逆势做空很危险。',
      弱趋势: '弱趋势中价格在区间内来回，回归策略大显身手。',
      震荡: '震荡市是均值回归的主场：高抛低吸吃区间利润。',
      高波动: '波动放大时均值回归的"超买超卖"信号更容易触发，但要防突破假象。',
      低波动: '低波动区间清晰，均值回归的确定性最好。',
      恐慌暴跌: '暴跌中"跌过头"常常继续跌，均值回归容易接飞刀。'
    }
  },
  {
    family: '动量策略',
    color: '#ff9800',
    regimes: { 强趋势: 3, 弱趋势: 2, 震荡: 1, 高波动: 2, 低波动: 1, 恐慌暴跌: 1 },
    why: {
      强趋势: '动量即"强者恒强"，最强趋势里最强品种，是双动量/强弱排名的逻辑。',
      弱趋势: '动量在弱趋势中能捕捉相对强度，但信号噪声多。',
      震荡: '震荡市动量频繁反转，追高被套概率大。',
      高波动: '高波动+强动量是动量策略的高光期，但也伴随大幅回撤。',
      低波动: '低波动时各品种差异小，动量排序缺乏区分度。',
      恐慌暴跌: '动量在暴跌中触发"动量反转"，通常快速切换到防守。'
    }
  },
  {
    family: '形态交易',
    color: '#7c5cff',
    regimes: { 强趋势: 2, 弱趋势: 2, 震荡: 2, 高波动: 2, 低波动: 3, 恐慌暴跌: 1 },
    why: {
      强趋势: '突破形态在趋势中被放大，但追突破也易被加速赶超。',
      弱趋势: '弱趋势中形态提供关键位参考，胜率一般。',
      震荡: '震荡市形态边界清晰，箱体/旗形更可靠。',
      高波动: '高波动下形态容易被瞬间击穿，需结合量能确认。',
      低波动: '低波动时价格收敛，突破形态往往蓄势待发。',
      恐慌暴跌: '暴跌中形态全部失真，唯一可靠的是离场。'
    }
  },
  {
    family: '量化进阶（网格/多因子）',
    color: '#e91e63',
    regimes: { 强趋势: 1, 弱趋势: 3, 震荡: 3, 高波动: 2, 低波动: 3, 恐慌暴跌: 1 },
    why: {
      强趋势: '网格策略在单边行情中会"网格破位"而大幅亏损。',
      弱趋势: '弱趋势是网格/多因子组合的舒适区，靠统计优势赚价差。',
      震荡: '震荡市网格交易的核心场景：区间内反复收割。',
      高波动: '高波动下网格间距需要动态调整，否则单边突破即崩。',
      低波动: '低波动时网格成交密集、风险可控，是量化进阶的甜区。',
      恐慌暴跌: '恐慌行情中网格会被深度套牢，需设置硬止损。'
    }
  }
]

const selected = ref<{ family: string; regime: Regime } | null>(null)
const filterFamily = ref<string | null>(null)
const filterRegime = ref<Regime | null>(null)

function cellClass(family: string, regime: Regime) {
  const isSel = selected.value?.family === family && selected.value?.regime === regime
  const isFam = filterFamily.value === family
  const isReg = filterRegime.value === regime
  const dim = (filterFamily.value && !isFam) || (filterRegime.value && !isReg)
  return { selected: isSel, dim, fam: isFam, reg: isReg }
}

function clickCell(family: string, regime: Regime) {
  selected.value = selected.value?.family === family && selected.value?.regime === regime ? null : { family, regime }
}

function clickFamily(f: string) {
  filterFamily.value = filterFamily.value === f ? null : f
  filterRegime.value = null
  selected.value = null
}
function clickRegime(r: Regime) {
  filterRegime.value = filterRegime.value === r ? null : r
  filterFamily.value = null
  selected.value = null
}

function stars(n: number) {
  return '★'.repeat(n) + '☆'.repeat(3 - n)
}

const selectedWhy = computed(() => {
  if (!selected.value) return null
  const s = STRATEGIES.find((x) => x.family === selected.value!.family)
  return s ? s.why[selected.value.regime] : null
})

const dimmedFamilies = computed(() => (filterFamily.value || filterRegime.value ? STRATEGIES.filter((s) => s.family !== filterFamily.value).map((s) => s.family) : []))
</script>

<template>
  <div class="chart-container strategy-fit">
    <div class="demo-title">{{ title }}</div>
    <p class="sf-hint">点击单元格查看匹配原因；点击行/列标题可筛选高亮。星越多匹配度越高。</p>

    <div class="sf-matrix">
      <table>
        <thead>
          <tr>
            <th class="sf-corner">策略族 \\ 行情</th>
            <th v-for="r in REGIMES" :key="r" @click="clickRegime(r)">
              <span class="sf-head-btn" :class="{ active: filterRegime === r }">{{ r }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in STRATEGIES" :key="s.family">
            <th @click="clickFamily(s.family)">
              <span class="sf-head-btn" :class="{ active: filterFamily === s.family }">{{ s.family }}</span>
            </th>
            <td v-for="r in REGIMES" :key="r" :class="cellClass(s.family, r)">
              <button class="sf-cell" :class="cellClass(s.family, r)" @click="clickCell(s.family, r)">
                <span class="sf-stars" :style="{ color: s.color }">{{ stars(s.regimes[r]) }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selected && selectedWhy" class="sf-why">
      <span class="sf-why-tag" :style="{ color: STRATEGIES.find((s) => s.family === selected.family)?.color }">{{ selected.family }}</span>
      <b>{{ selected.regime }}：</b>{{ selectedWhy }}
    </div>
    <div v-else class="sf-why sf-why-empty">
      点击任意 ★ 单元格，这里会解释"为什么在这个行情下合适/不合适"。
    </div>

    <p class="sf-principle">💡 核心原则：不要只用一种策略——<b>趋势跟踪 + 均值回归</b>一个吃趋势、一个吃震荡，搭配起来才能覆盖大部分行情。</p>
  </div>
</template>

<style scoped>
.strategy-fit { padding: 0 0 8px; }
.sf-hint { font-size: 12px; color: var(--vp-c-text-3); padding: 0 16px 8px; margin: 0; }
.sf-matrix { padding: 0 16px; overflow-x: auto; }
.sf-matrix table { border-collapse: collapse; width: 100%; min-width: 560px; }
.sf-matrix th, .sf-matrix td { border: 1px solid var(--vp-c-divider); text-align: center; padding: 6px 4px; }
.sf-matrix thead th { font-size: 12px; font-weight: 600; color: var(--vp-c-text-2); background: var(--vp-c-bg-soft); }
.sf-matrix tbody th {
  font-size: 13px; font-weight: 600; text-align: left; padding: 8px 10px;
  background: var(--vp-c-bg-soft); white-space: nowrap;
}
.sf-corner { font-size: 11px; color: var(--vp-c-text-3); font-weight: 400; }
.sf-head-btn { cursor: pointer; border-radius: 4px; padding: 2px 6px; transition: all 0.15s; }
.sf-head-btn:hover { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.sf-head-btn.active { background: var(--vp-c-brand-1); color: #fff; }
.sf-cell {
  border: none; background: transparent; cursor: pointer; padding: 4px 6px;
  font-size: 14px; line-height: 1; transition: all 0.15s;
}
.sf-stars { letter-spacing: 1px; font-size: 13px; }
td:hover .sf-stars { transform: scale(1.2); display: inline-block; }
.sf-cell.selected { background: var(--vp-c-brand-soft); border-radius: 4px; }
td.dim { opacity: 0.2; }
td.fam { background: rgba(30, 95, 208, 0.05); }
td.reg { background: rgba(30, 95, 208, 0.05); }
.sf-why {
  margin: 10px 16px 0; padding: 10px 14px; border-radius: 8px;
  background: var(--vp-c-brand-soft); border: 1px solid var(--vp-c-divider);
  font-size: 13px; line-height: 1.7; color: var(--vp-c-text-1);
}
.sf-why-empty { color: var(--vp-c-text-3); background: transparent; }
.sf-why-tag { font-weight: 700; margin-right: 6px; }
.sf-principle {
  margin: 10px 16px 0; font-size: 12px; color: var(--vp-c-text-2); line-height: 1.6;
}
.sf-principle b { color: var(--vp-c-brand-1); }
</style>
