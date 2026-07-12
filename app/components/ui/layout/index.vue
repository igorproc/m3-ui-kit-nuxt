<template>
  <div
    :id="layoutId"
    class="m-layout"
    :class="{ 'm-layout--full-height': fullHeight }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, useId } from 'vue'
import { useHead } from '#imports'
import { createLayout } from '~/composables/useLayout'

interface Props {
  fullHeight?: boolean
}

withDefaults(defineProps<Props>(), {
  fullHeight: false,
})

const uid = useId()
const layoutId = `m-layout-${(uid || 'ssr').replace(/[^\w-]/g, '')}`

const { css } = createLayout(layoutId)

/**
 * Computed-стиль собирается после setup всех детей (реестр уже полон при SSR),
 * браузер выбирает сетку по @media без клиентского JS — ноль CLS.
 */
useHead({
  style: [
    computed(() => ({
      id: layoutId,
      innerHTML: css.value,
    })),
  ],
})

// На первом уровне m-layout — только зарегистрированные компоненты:
// чужой элемент станет implicit-треком грида и сломает раскладку
if (import.meta.dev) {
  const instance = getCurrentInstance()

  onMounted(() => {
    const root = instance?.proxy?.$el as HTMLElement | null
    if (!root) return

    for (const child of Array.from(root.children)) {
      if (child instanceof HTMLElement && !child.style.gridArea) {
        console.warn(
          `[m-layout] Unregistered element <${child.tagName.toLowerCase()}> at the first level of m-layout — wrap it in <m-layout-main> or <m-layout-item>.`,
        )
      }
    }
  })
}
</script>

<style lang="scss">
.m-layout {
  display: grid;
  min-height: 100dvh;

  // НЕ `contain: layout` — layout-containment делает fixed-потомков
  // absolute-подобными, а прибитые top/bottom-зоны позиционируются fixed'ом
  contain: style;
  transition: grid-template-columns var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
              grid-template-rows var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

  &--full-height {
    height: 100dvh;
    overflow: hidden;
  }
}
</style>
