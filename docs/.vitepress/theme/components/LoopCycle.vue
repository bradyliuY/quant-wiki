<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface LoopNode {
  label: string
  detail?: string
}

/**
 * 闭环循环图:节点绕椭圆排布,箭头逐环相连并回连成环。
 * GSAP 滚动触发:节点按循环顺序逐个点亮,回连箭头描边动画强调"闭环"。
 * kind 区分闭环类型配色:
 *   danger   —— 正反馈闭环(市场陷阱),红
 *   neutral  —— 策略/操作闭环(盈利机器),蓝
 *   positive —— 纪律正循环,绿
 */
const props = withDefaults(
  defineProps<{
    title?: string
    nodes?: LoopNode[]
    kind?: 'danger' | 'neutral' | 'positive'
    backLabel?: string
  }>(),
  {
    nodes: () => [
      { label: '起点', detail: '循环从这里开始' },
      { label: '强化', detail: '每一步放大下一步' },
      { label: '反转', detail: '边界到来，循环反转' }
    ],
    kind: 'neutral',
    backLabel: '自我强化'
  }
)

// —— 几何布局:椭圆上的均分节点 ——
const W = 480
const H = 300
const CX = W / 2
const CY = H / 2
const RX = 190
const RY = 98

const pt = (i: number) => {
  const a = (2 * Math.PI * i) / props.nodes.length - Math.PI / 2 // 从正上方开始顺时针
  return { x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) }
}
const pct = (i: number) => ({
  left: (pt(i).x / W) * 100,
  top: (pt(i).y / H) * 100
})

/** 相邻箭头路径:从节点 i 到 i+1(最后回连到 0),控制点沿径向略微外扩,方向感清晰 */
function arrowPath(i: number) {
  const p = pt(i)
  const q = pt((i + 1) % props.nodes.length)
  const mx = (p.x + q.x) / 2
  const my = (p.y + q.y) / 2
  const dx = mx - CX
  const dy = my - CY
  const len = Math.hypot(dx, dy) || 1
  const off = 18
  const cx = mx + (dx / len) * off
  const cy = my + (dy / len) * off
  return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`
}

/** 回连箭头路径(最后一个节点 → 第一个节点) */
const loopPath = computed(() => arrowPath(props.nodes.length - 1))

/** 回连箭头中点,用于放置 backLabel 标注 */
const backMid = () => {
  const p = pt(props.nodes.length - 1)
  const q = pt(0)
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
}

const palette = {
  danger: { stroke: '#e5484d', soft: 'rgba(229,72,77,0.12)' },
  neutral: { stroke: '#1e5fd0', soft: 'rgba(30,95,208,0.12)' },
  positive: { stroke: '#26a69a', soft: 'rgba(38,166,154,0.12)' }
} as const
const colors = computed(() => palette[props.kind])

// 箭头 marker 唯一 id(同页多个实例不冲突)
let _uid = 0
const uid = `lc-arrow-${++_uid}`

const activeStep = ref(-1)
const rootRef = ref<HTMLElement | null>(null)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!rootRef.value) return
  ctx = gsap.context(() => {
    // 节点随滚动逐一点亮
    gsap.utils.toArray<HTMLElement>('.lc-node').forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0.25, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            onEnter: () => {
              activeStep.value = i
            }
          }
        }
      )
    })
    // 回连箭头描边动画:强调"闭环"回到起点
    gsap.fromTo(
      '.lc-loop-arrow',
      { strokeDashoffset: 420 },
      {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: rootRef.value,
          start: 'top 70%'
        }
      }
    )
  }, rootRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div class="loop-cycle" ref="rootRef">
    <div v-if="title" class="lc-title">{{ title }}</div>
    <div class="lc-canvas">
      <svg
        class="lc-svg"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="xMidYMid meet"
        :style="{ '--lc-stroke': colors.stroke, '--lc-soft': colors.soft }"
      >
        <defs>
          <marker
            :id="uid"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" :fill="colors.stroke" />
          </marker>
        </defs>
        <!-- 轨道椭圆(弱化,提示环的形状) -->
        <ellipse :cx="CX" :cy="CY" :rx="RX" :ry="RY" fill="none" stroke="currentColor" stroke-dasharray="3 5" class="lc-orbit" />
        <!-- 相邻箭头 -->
        <path
          v-for="(_, i) in nodes"
          :key="i"
          :d="arrowPath(i)"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          :marker-end="`url(#${uid})`"
          class="lc-arrow"
        />
        <!-- 回连箭头:加粗 + 描边动画 -->
        <path
          :d="loopPath"
          fill="none"
          :stroke="colors.stroke"
          stroke-width="2.4"
          stroke-dasharray="420"
          stroke-dashoffset="420"
          :marker-end="`url(#${uid})`"
          class="lc-loop-arrow"
        />
      </svg>
      <!-- 节点卡片 -->
      <div
        v-for="(node, i) in nodes"
        :key="i"
        class="lc-node"
        :class="{ active: activeStep === i, done: i < activeStep }"
        :style="{ left: pct(i).left + '%', top: pct(i).top + '%', '--lc-stroke': colors.stroke, '--lc-soft': colors.soft }"
      >
        <div class="lc-chip">
          <div class="lc-label">{{ node.label }}</div>
          <div v-if="node.detail" class="lc-detail">{{ node.detail }}</div>
        </div>
      </div>
      <!-- 回连箭头标注 -->
      <div class="lc-back" :style="{ left: backMid().x / W * 100 + '%', top: backMid().y / H * 100 + '%' }">{{ backLabel }}</div>
    </div>
  </div>
</template>

<style scoped>
.loop-cycle {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px 16px 6px;
  margin: 16px 0;
}
.lc-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}
.lc-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 480 / 300;
}
.lc-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--vp-c-text-3);
}
.lc-orbit {
  opacity: 0.45;
}
.lc-arrow {
  opacity: 0.6;
}
.lc-node {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 152px;
  text-align: center;
  opacity: 0.25;
  transition: opacity 0.3s ease;
}
.lc-node.active {
  opacity: 1;
}
.lc-node.done {
  opacity: 0.85;
}
.lc-chip {
  border: 1px solid var(--lc-stroke);
  border-radius: 8px;
  padding: 6px 8px;
  background: var(--lc-soft);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.lc-node.active .lc-chip {
  box-shadow: 0 0 0 2px var(--lc-soft);
}
.lc-label {
  font-size: 13px;
  font-weight: 600;
}
.lc-detail {
  font-size: 11px;
  color: var(--vp-c-text-2);
  margin-top: 2px;
  line-height: 1.4;
}
.lc-back {
  position: absolute;
  transform: translate(-50%, -140%);
  font-size: 11px;
  font-weight: 600;
  color: var(--lc-stroke);
  background: var(--vp-c-bg);
  padding: 1px 6px;
  border: 1px solid var(--lc-stroke);
  border-radius: 4px;
  white-space: nowrap;
}
</style>
