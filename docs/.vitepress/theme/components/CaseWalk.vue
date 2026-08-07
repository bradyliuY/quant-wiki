<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * CaseWalk —— 一笔交易的完整走读（纵向时间线）。
 * 用叙事案例替代纯规则清单：观察 → 信号 → 入场 → 持仓/止损 → 止盈 → 复盘。
 * GSAP 滚动触发逐条浮现。steps 每项可带 type 控制标签颜色。
 */
const props = withDefaults(
  defineProps<{
    title?: string
    steps?: { label: string; detail?: string; type?: 'setup' | 'signal' | 'entry' | 'manage' | 'stop' | 'exit' | 'review' }[]
    result?: string
  }>(),
  {
    title: '一笔交易的完整走读',
    steps: () => [
      { label: '观察市场', detail: '确认市场环境适合该策略', type: 'setup' },
      { label: '出现信号', detail: '入场条件全部满足', type: 'signal' },
      { label: '执行入场', detail: '按计划下单并设定止损', type: 'entry' },
      { label: '持仓管理', detail: '跟踪信号，触及止损位坚决离场', type: 'manage' },
      { label: '止盈离场', detail: '到达目标位分批了结', type: 'exit' },
      { label: '复盘总结', detail: '记录本次交易的得与失', type: 'review' }
    ],
    result: ''
  }
)

const TAG_TEXT: Record<string, string> = {
  setup: '观察', signal: '信号', entry: '入场', manage: '持仓', stop: '止损', exit: '止盈', review: '复盘'
}

const rootRef = ref<HTMLElement | null>(null)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!rootRef.value) return
  ctx = gsap.context(() => {
    gsap.from('.cw-step', {
      opacity: 0,
      y: 14,
      duration: 0.42,
      ease: 'power2.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: rootRef.value,
        start: 'top 88%'
      }
    })
  }, rootRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div class="case-walk" ref="rootRef">
    <div v-if="title" class="cw-title">{{ title }}</div>
    <div class="cw-timeline">
      <div v-for="(step, i) in steps" :key="i" class="cw-step" :class="'cw-' + (step.type || 'setup')">
        <div class="cw-rail">
          <div class="cw-node"><span class="cw-num">{{ i + 1 }}</span></div>
          <div v-if="i < steps.length - 1" class="cw-line"></div>
        </div>
        <div class="cw-body">
          <span class="cw-tag">{{ TAG_TEXT[step.type || 'setup'] }}</span>
          <div class="cw-label">{{ step.label }}</div>
          <div v-if="step.detail" class="cw-detail">{{ step.detail }}</div>
        </div>
      </div>
    </div>
    <div v-if="result" class="cw-result">{{ result }}</div>
  </div>
</template>

<style scoped>
.case-walk {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px 18px;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
}
.cw-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 14px;
}
.cw-timeline {
  display: flex;
  flex-direction: column;
}
.cw-step {
  display: flex;
  gap: 14px;
}
.cw-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}
.cw-node {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.cw-step.cw-signal .cw-node,
.cw-step.cw-entry .cw-node {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.cw-step.cw-exit .cw-node {
  background: #157347;
  color: #fff;
}
.cw-step.cw-stop .cw-node {
  background: #c4373f;
  color: #fff;
}
.cw-step.cw-manage .cw-node {
  background: var(--qw-gold);
  color: #1a1406;
}
.cw-num {
  font-size: 12px;
  font-weight: 700;
}
.cw-line {
  flex: 1;
  width: 2px;
  background: var(--vp-c-divider);
  margin: 2px 0;
}
.cw-body {
  flex: 1;
  padding-bottom: 18px;
}
.cw-step:last-child .cw-body {
  padding-bottom: 2px;
}
.cw-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  padding: 0.3em 0.6em;
  border-radius: 5px;
  margin-bottom: 6px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-divider);
}
.cw-step.cw-signal .cw-tag,
.cw-step.cw-entry .cw-tag {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.cw-step.cw-exit .cw-tag {
  color: #157347;
  background: rgba(26, 127, 55, 0.1);
}
.cw-step.cw-stop .cw-tag {
  color: #c4373f;
  background: rgba(207, 34, 46, 0.08);
}
.cw-step.cw-manage .cw-tag {
  color: var(--qw-gold);
  background: var(--qw-gold-soft);
}
.cw-label {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.5;
}
.cw-detail {
  font-size: 13px;
  line-height: 1.75;
  color: var(--vp-c-text-2);
  margin-top: 2px;
}
.cw-result {
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--vp-c-text-1);
}
</style>
