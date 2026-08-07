<script setup lang="ts">
/**
 * PlainTalk —— 大白话解释块。
 * 放在页面标题之后，用生活化类比把概念先"讲成人话"，再进入公式与技术细节。
 * 用法：<PlainTalk>RSI 就像……</PlainTalk>  或  <PlainTalk title="用大白话说">……</PlainTalk>
 */
withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '用大白话说' }
)
</script>

<template>
  <div class="plain-talk">
    <div class="pt-head">
      <svg
        class="pt-icon" viewBox="0 0 24 24" width="18" height="18" fill="none"
        stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <path d="M9 10a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H9z" />
        <path d="M9 13.5a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H9z" />
      </svg>
      <span class="pt-title">{{ title }}</span>
    </div>
    <div class="pt-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.plain-talk {
  border: 1px solid rgba(184, 137, 47, 0.32);
  border-left: 3px solid var(--qw-gold);
  background: var(--qw-gold-soft);
  border-radius: 10px;
  padding: 14px 18px;
  margin: 18px 0;
}
.dark .plain-talk {
  border-color: rgba(212, 167, 67, 0.4);
}
.pt-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.pt-icon {
  color: var(--qw-gold);
  flex-shrink: 0;
}
.pt-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--qw-gold);
}
.pt-body {
  font-size: 15px;
  line-height: 1.85;
  color: var(--vp-c-text-1);
}
</style>
