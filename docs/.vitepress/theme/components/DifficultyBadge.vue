<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

/**
 * DifficultyBadge —— 页面难度徽章。
 * 通过 VitePress `doc-before` 插槽注入，自动读取 frontmatter 的 difficulty 字段渲染。
 * 页面在 frontmatter 加 `difficulty: 入门 | 进阶 | 挑战` 即可，无需手写标签。
 */
const { page } = useData()

const LEVELS: Record<string, { label: string; cls: string }> = {
  '入门': { label: '入门', cls: 'lvl-beginner' },
  '进阶': { label: '进阶', cls: 'lvl-intermediate' },
  '挑战': { label: '挑战', cls: 'lvl-advanced' }
}

const meta = computed(() => LEVELS[String(page.value.frontmatter.difficulty || '')] || null)
</script>

<template>
  <div v-if="meta" class="difficulty-badge" :class="meta.cls">{{ meta.label }}</div>
</template>

<style scoped>
.difficulty-badge {
  display: inline-block;
  font-size: 0.78em;
  font-weight: 700;
  line-height: 1;
  padding: 0.34em 0.72em;
  border-radius: 6px;
  margin-bottom: 0.7em;
  vertical-align: middle;
  white-space: nowrap;
}
.lvl-beginner {
  color: #157347;
  background: rgba(26, 127, 55, 0.10);
  border: 1px solid rgba(26, 127, 55, 0.28);
}
.lvl-intermediate {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
}
.lvl-advanced {
  color: var(--qw-gold);
  background: var(--qw-gold-soft);
  border: 1px solid var(--qw-gold);
}
.dark .lvl-beginner {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.12);
  border-color: rgba(74, 222, 128, 0.32);
}
.dark .lvl-intermediate {
  color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-2);
}
.dark .lvl-advanced {
  color: var(--qw-gold-bright);
  background: var(--qw-gold-soft);
  border-color: var(--qw-gold-bright);
}
</style>
