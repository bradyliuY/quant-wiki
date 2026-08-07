<script setup lang="ts">
/**
 * 品种选择地图（决策向导）
 * 通过 4 个问题（交易时间 / 杠杆 / 波动承受 / 资金门槛）逐步为读者匹配资产类别。
 * 每答一题即时更新匹配度评分条，答完展示排行榜与推荐理由。
 *
 * 用法：
 * <AssetPicker title="品种选择地图" />
 */
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '品种选择地图' }
)

type Question = {
  key: string
  label: string
  options: { label: string; score: Record<string, number> }[]
}
type Asset = {
  name: string
  color: string
  reason: string
  link: string
}

const QUESTIONS: Question[] = [
  {
    key: 'time',
    label: '① 你的交易时间？',
    options: [
      { label: '固定时段（日间）', score: { 股票: 2, ETF: 2, 期权: 2, 期货: 1, 外汇: 0, 加密货币: 0 } },
      { label: '需要夜盘', score: { 期货: 2, 外汇: 2, 股票: 1, 加密货币: 1, ETF: 1, 期权: 1 } },
      { label: '7×24 无休', score: { 加密货币: 2, 外汇: 2, 期货: 0, 股票: 0, ETF: 0, 期权: 0 } }
    ]
  },
  {
    key: 'leverage',
    label: '② 能接受杠杆吗？',
    options: [
      { label: '不用杠杆', score: { 股票: 2, ETF: 2, 外汇: 0, 期货: 0, 期权: 0, 加密货币: 0 } },
      { label: '2–10×', score: { 期货: 2, 期权: 2, 股票: 1, ETF: 1, 外汇: 1, 加密货币: 1 } },
      { label: '10× 以上', score: { 外汇: 2, 加密货币: 2, 期货: 2, 期权: 1, 股票: 0, ETF: 0 } }
    ]
  },
  {
    key: 'volatility',
    label: '③ 能承受多大波动？',
    options: [
      { label: '保守（低波动）', score: { ETF: 2, 股票: 1, 外汇: 0, 期货: 0, 期权: 0, 加密货币: 0 } },
      { label: '中等', score: { 股票: 2, 外汇: 1, 期货: 1, ETF: 1, 期权: 1, 加密货币: 0 } },
      { label: '激进（高波动）', score: { 加密货币: 2, 期权: 2, 期货: 1, 外汇: 1, 股票: 0, ETF: 0 } }
    ]
  },
  {
    key: 'capital',
    label: '④ 资金规模？',
    options: [
      { label: '小资金', score: { 外汇: 2, 加密货币: 2, 股票: 1, ETF: 1, 期货: 0, 期权: 0 } },
      { label: '中等', score: { 股票: 2, ETF: 2, 期货: 1, 期权: 1, 外汇: 1, 加密货币: 1 } },
      { label: '大资金', score: { 期货: 2, 期权: 2, 股票: 1, ETF: 1, 外汇: 1, 加密货币: 1 } }
    ]
  }
]

const ASSETS: Asset[] = [
  { name: '股票', color: '#1e5fd0', reason: '固定时段、无强制杠杆、资金门槛灵活，适合从基本面/技术面入手的新手。', link: '/fundamentals/asset-classes/stocks' },
  { name: 'ETF', color: '#7c5cff', reason: '分散度高、成本低、风险温和，稳健型投资者的首选工具。', link: '/fundamentals/asset-classes/etf' },
  { name: '期货', color: '#ff9800', reason: '保证金杠杆 + 夜盘，适合有纪律、资金中等的趋势/CTA 策略者。', link: '/fundamentals/asset-classes/futures' },
  { name: '期权', color: '#e91e63', reason: '非线性盈亏、可定制风险结构，适合理解 Greeks 的进阶交易者。', link: '/fundamentals/asset-classes/options' },
  { name: '外汇', color: '#00bcd4', reason: '7×24、高杠杆、小资金即可参与，但对纪律和风险控制要求极高。', link: '/fundamentals/asset-classes/forex' },
  { name: '加密货币', color: '#ffc107', reason: '7×24 无休、波动极端、高杠杆，适合能承受极端回撤的激进者。', link: '/fundamentals/asset-classes/crypto' }
]

// 当前每题的答案
const answers = ref<Record<string, number | null>>({ time: null, leverage: null, volatility: null, capital: null })

// 累计得分
const scores = computed(() => {
  const acc: Record<string, number> = { 股票: 0, ETF: 0, 期货: 0, 期权: 0, 外汇: 0, 加密货币: 0 }
  for (const q of QUESTIONS) {
    const ans = answers.value[q.key]
    if (ans === null) continue
    const opt = q.options[ans]
    for (const [name, s] of Object.entries(opt.score)) acc[name] += s
  }
  return acc
})

const answeredCount = computed(() => Object.values(answers.value).filter((a) => a !== null).length)
const allAnswered = computed(() => answeredCount.value === QUESTIONS.length)

// 排行榜：按得分降序
const ranking = computed(() =>
  [...ASSETS]
    .map((a) => ({ ...a, score: scores.value[a.name] }))
    .sort((a, b) => b.score - a.score)
)

const maxScore = computed(() => Math.max(1, ...ranking.value.map((a) => a.score)))

function select(qKey: string, idx: number) {
  answers.value[qKey] = idx
}

function reset() {
  answers.value = { time: null, leverage: null, volatility: null, capital: null }
}
</script>

<template>
  <div class="chart-container asset-picker">
    <div class="demo-title">{{ title }}</div>

    <!-- 问题区 -->
    <div class="ap-questions">
      <div v-for="q in QUESTIONS" :key="q.key" class="ap-question">
        <div class="ap-q-label">{{ q.label }}</div>
        <div class="ap-q-options">
          <button
            v-for="(opt, i) in q.options"
            :key="i"
            :class="{ active: answers[q.key] === i }"
            @click="select(q.key, i)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 实时匹配度 -->
    <div class="ap-result">
      <div class="ap-result-head">
        <span class="ap-progress">已作答 {{ answeredCount }}/4{{ allAnswered ? ' · 匹配完成' : '' }}</span>
        <button v-if="answeredCount" class="ap-reset" @click="reset">↺ 重置</button>
      </div>
      <div v-for="a in ranking" :key="a.name" class="ap-row">
        <span class="ap-row-name" :style="{ color: a.color }">{{ a.name }}</span>
        <div class="ap-bar-track">
          <div
            class="ap-bar-fill"
            :class="{ top: allAnswered && a === ranking[0] }"
            :style="{ width: (a.score / maxScore) * 100 + '%', background: a.color }"
          ></div>
        </div>
        <span class="ap-score">{{ a.score }}<small>/8</small></span>
      </div>

      <div v-if="allAnswered" class="ap-recommend">
        <div class="ap-reco-title">🏆 推荐：<b :style="{ color: ranking[0].color }">{{ ranking[0].name }}</b></div>
        <p class="ap-reco-reason">{{ ranking[0].reason }}</p>
        <p class="ap-reco-second" v-if="ranking[1].score > 0">
          次选：{{ ranking.slice(1, 3).filter((a) => a.score > 0).map((a) => a.name).join('、') || '—' }}
        </p>
        <a class="ap-reco-link" :href="ranking[0].link">去了解 {{ ranking[0].name }} →</a>
      </div>
      <p v-else class="ap-hint">答完 4 题查看推荐；分数越高越匹配你的条件。</p>
    </div>

    <p class="ap-disclaimer">以上为教学用示意推荐，不构成投资建议。入场前务必阅读对应资产页的风险提示。</p>
  </div>
</template>

<style scoped>
.asset-picker { padding: 0 0 8px; }
.ap-questions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px 16px;
}
@media (max-width: 720px) { .ap-questions { grid-template-columns: 1fr; } }
.ap-question {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
}
.ap-q-label { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--vp-c-text-1); }
.ap-q-options { display: flex; flex-wrap: wrap; gap: 6px; }
.ap-q-options button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: transparent;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}
.ap-q-options button:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.ap-q-options button.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  font-weight: 600;
}
.ap-result { padding: 12px 16px; border-top: 1px solid var(--vp-c-divider); }
.ap-result-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ap-progress { font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); }
.ap-reset {
  border: none; background: transparent; color: var(--vp-c-brand-1);
  font-size: 13px; cursor: pointer;
}
.ap-row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
.ap-row-name { width: 64px; font-size: 13px; font-weight: 600; }
.ap-bar-track { flex: 1; height: 14px; background: rgba(0,0,0,0.05); border-radius: 7px; overflow: hidden; }
.dark .ap-bar-track { background: rgba(255,255,255,0.08); }
.ap-bar-fill { height: 100%; border-radius: 7px; transition: width 0.4s ease; opacity: 0.85; }
.ap-bar-fill.top { opacity: 1; box-shadow: 0 0 8px currentColor; }
.ap-score { width: 48px; text-align: right; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ap-score small { font-weight: 400; color: var(--vp-c-text-3); }
.ap-recommend {
  margin-top: 12px;
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--vp-c-brand-soft);
}
.ap-reco-title { font-size: 14px; }
.ap-reco-reason { margin: 6px 0 4px; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.6; }
.ap-reco-second { font-size: 12px; color: var(--vp-c-text-3); margin-bottom: 6px; }
.ap-reco-link { font-size: 13px; font-weight: 600; color: var(--vp-c-brand-1); text-decoration: none; }
.ap-reco-link:hover { text-decoration: underline; }
.ap-hint { font-size: 12px; color: var(--vp-c-text-3); margin-top: 8px; }
.ap-disclaimer {
  margin: 4px 16px 0;
  font-size: 11px;
  color: var(--vp-c-text-3);
}
</style>
