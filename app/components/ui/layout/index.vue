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
import { computed, useId } from 'vue'
import { useHead } from '#imports'
import { createLayout, type LayoutItem } from '~/composables/useLayout'

interface Props {
  fullHeight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullHeight: false,
})

const { layoutStyles, items } = createLayout()

const uid = useId()
const layoutId = `m-layout-${(uid || 'ssr').replace(/:/g, '')}`

const headers = computed(() => getUniqueAreas('header'))
const lefts = computed(() => getUniqueAreas('left'))
const rights = computed(() => getUniqueAreas('right'))
const footers = computed(() => getUniqueAreas('footer'))

function getUniqueAreas(prefix: string) {
  const unique = new Map<string, LayoutItem>()
  for (const item of items.values()) {
    if (item.area.startsWith(prefix)) {
      if (item.sizeToken || !unique.has(item.area)) {
        unique.set(item.area, item)
      }
    }
  }
  return Array.from(unique.values()).sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * Отдельные computed на каждый диапазон: в стилях к ним привязан v-bind() внутри своего @media,
 * браузер выбирает сетку по ширине viewport без ожидания клиентского JS — дружелюбно к SSR и CLS.
 *
 * Сетка автоматически собирает все элементы (сколько угодно header/aside/footer) и генерирует
 * правильные `grid-template-areas`, `grid-template-columns` и `grid-template-rows`.
 */

const mobileGrid = computed(() => {
  const cols = ['main']
  const rows: string[] = []

  headers.value.forEach(h => rows.push(`"${cols.map(() => h.area).join(' ')}"`))
  rows.push(`"${cols.join(' ')}"`)
  footers.value.forEach(f => rows.push(`"${cols.map(() => f.area).join(' ')}"`))

  return {
    areas: rows.join(' ') || '"main"',
    columns: 'minmax(0, 1fr)',
    rows: [
      ...headers.value.map(h => h.sizeToken ? `var(--m3-layout-${h.area}-height, 0px)` : 'auto'),
      'minmax(0, 1fr)',
      ...footers.value.map(f => f.sizeToken ? `var(--m3-layout-${f.area}-height, 0px)` : 'auto'),
    ].join(' ') || 'minmax(0, 1fr)',
  }
})

const tabletGrid = computed(() => {
  const cols = [...lefts.value.map(i => i.area), 'main']
  const rows: string[] = []

  headers.value.forEach(h => rows.push(`"${cols.map(() => h.area).join(' ')}"`))
  rows.push(`"${cols.join(' ')}"`)
  footers.value.forEach(f => rows.push(`"${cols.map(() => f.area).join(' ')}"`))

  return {
    areas: rows.join(' ') || '"main"',
    columns: cols.map((c) => {
      if (c === 'main') return 'minmax(0, 1fr)'
      const item = lefts.value.find(i => i.area === c)
      return (item && item.sizeToken) ? `var(--m3-layout-${c}-width, 0px)` : 'auto'
    }).join(' ') || 'minmax(0, 1fr)',
    rows: [
      ...headers.value.map(h => h.sizeToken ? `var(--m3-layout-${h.area}-height, 0px)` : 'auto'),
      'minmax(0, 1fr)',
      ...footers.value.map(f => f.sizeToken ? `var(--m3-layout-${f.area}-height, 0px)` : 'auto'),
    ].join(' ') || 'minmax(0, 1fr)',
  }
})

const desktopGrid = computed(() => {
  const cols = [...lefts.value.map(i => i.area), 'main', ...rights.value.map(i => i.area)]
  const rows: string[] = []

  headers.value.forEach(h => rows.push(`"${cols.map(() => h.area).join(' ')}"`))
  rows.push(`"${cols.join(' ')}"`)
  footers.value.forEach(f => rows.push(`"${cols.map(() => f.area).join(' ')}"`))

  return {
    areas: rows.join(' ') || '"main"',
    columns: cols.map((c) => {
      if (c === 'main') return 'minmax(0, 1fr)'
      const item = lefts.value.find(i => i.area === c) || rights.value.find(i => i.area === c)
      return (item && item.sizeToken) ? `var(--m3-layout-${c}-width, 0px)` : 'auto'
    }).join(' ') || 'minmax(0, 1fr)',
    rows: [
      ...headers.value.map(h => h.sizeToken ? `var(--m3-layout-${h.area}-height, 0px)` : 'auto'),
      'minmax(0, 1fr)',
      ...footers.value.map(f => f.sizeToken ? `var(--m3-layout-${f.area}-height, 0px)` : 'auto'),
    ].join(' ') || 'minmax(0, 1fr)',
  }
})

useHead({
  style: [
    computed(() => {
      const styles = layoutStyles.value
      const cssProps = Object.keys(styles).length > 0
        ? Object.entries(styles).map(([k, v]) => `${k}: ${v};`).join('\n  ')
        : ''

      const mGrid = mobileGrid.value
      const tGrid = tabletGrid.value
      const dGrid = desktopGrid.value

      const innerHTML = `
#${layoutId} {
  ${cssProps}
  grid-template-areas: ${mGrid.areas};
  grid-template-columns: ${mGrid.columns};
  grid-template-rows: ${mGrid.rows};
}

@media only screen and (min-width: 768px) and (max-width: 1199px) {
  #${layoutId} {
    grid-template-areas: ${tGrid.areas};
    grid-template-columns: ${tGrid.columns};
    grid-template-rows: ${tGrid.rows};
  }
}

@media only screen and (min-width: 1200px) {
  #${layoutId} {
    grid-template-areas: ${dGrid.areas};
    grid-template-columns: ${dGrid.columns};
    grid-template-rows: ${dGrid.rows};
  }
}
      `.trim()

      return {
        id: layoutId,
        innerHTML,
      }
    }),
  ],
})
</script>

<style lang="scss">
@use 'sass:map';

.m-layout {
  display: grid;
  min-height: 100dvh;
  contain: layout style;
  transition: grid-template-columns var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
              grid-template-rows var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

  &--full-height {
    height: 100dvh;
    overflow: hidden;
  }
}
</style>
