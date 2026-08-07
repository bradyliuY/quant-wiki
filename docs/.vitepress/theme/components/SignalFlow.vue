<script setup lang="ts">
import { ref, onMounted } from 'vue'

/**
 * 策略信号流程图：入场 → 持仓 → 出场的步骤点亮动画。
 * GSAP 滚动触发。steps 为步骤数组，current 为当前高亮序号。
 */
const props = withDefaults(
  defineProps<{
    steps?: { label: string; detail?: string }[]
    title?: string
  }>(),
  { steps: () => [
    { label: '入场信号', detail: '价格上穿关键均线' },
    { label: '确认', detail: '成交量放大配合' },
    { label: '持仓', detail: '趋势延续中' },
    { label: '出场信号', detail: '价格跌破止损/止盈位' }
  ], title: '策略信号流程' }
)

const activeStep = ref(-1)
const rootRef = ref<HTMLElement | null>(null)

onMounted(() => {
  let idx = 0
  // 自动逐步骤点亮（无滚动环境也能演示）
  const timer = setInterval(() => {
    activeStep.value = idx % props.steps.length
    idx++
    if (idx > props.steps.length + 2) {
      clearInterval(timer)
    }
  }, 900)
})
</script>

<template>
  <div class="signal-flow" ref="rootRef">
    <div v-if="title" class="flow-title">{{ title }}</div>
    <div class="flow-steps">
      <div v-for="(step, i) in steps" :key="i" class="flow-step" :class="{ active: activeStep === i, done: i < activeStep }">
        <div class="step-node">
          <span class="step-num">{{ i + 1 }}</span>
        </div>
        <div class="step-body">
          <div class="step-label">{{ step.label }}</div>
          <div v-if="step.detail" class="step-detail">{{ step.detail }}</div>
        </div>
        <div v-if="i < steps.length - 1" class="step-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signal-flow { border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 16px; margin: 16px 0; }
.flow-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.flow-steps { display: flex; flex-direction: column; gap: 8px; }
.flow-step { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; border: 1px solid transparent; transition: all 0.3s ease; opacity: 0.5; }
.flow-step.active { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); opacity: 1; }
.flow-step.done { opacity: 0.85; }
.step-node { width: 26px; height: 26px; border-radius: 50%; background: var(--vp-c-divider); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.flow-step.active .step-node { background: var(--vp-c-brand-1); color: #fff; }
.step-num { font-size: 13px; font-weight: 600; }
.step-body { flex: 1; }
.step-label { font-size: 14px; font-weight: 600; }
.step-detail { font-size: 12px; color: var(--vp-c-text-2); }
.step-arrow { color: var(--vp-c-text-3); }
</style>
