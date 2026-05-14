<template>
  <div
    class="m-layout"
    :class="{ 'm-layout--full-height': fullHeight }"
    :style="layoutStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createLayout, type LayoutItem } from '~/composables/useLayout'

interface Props {
  fullHeight?: boolean
  schema?: LayoutItem[]
}

const props = withDefaults(defineProps<Props>(), {
  fullHeight: false,
  schema: () => [],
})

const { layoutStyles, items } = createLayout(props.schema)

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
  return Array.from(unique.values()).sort((a,b) => (a.order || 0) - (b.order || 0))
}

/**
 * Отдельные computed на каждый диапазон: в стилях к ним привязан v-bind() внутри своего @media,
 * браузер выбирает сетку по ширине viewport без ожидания клиентского JS — дружелюбно к SSR и CLS.
 *
 * Сетка автоматически собирает все элементы (сколько угодно header/aside/footer) и генерирует
 * правильные `grid-template-areas`, `grid-template-columns` и `grid-template-rows`.
 */

const mobileGrid = computed(() => {
  // На мобильных left и right не участвуют в сетке (они будут drawer'ами поверх)
  const cols = ['main']
  const rows: string[] = []

  headers.value.forEach(h => rows.push(`"${cols.map(() => h.area).join(' ')}"`))
  rows.push(`"${cols.join(' ')}"`)
  footers.value.forEach(f => rows.push(`"${cols.map(() => f.area).join(' ')}"`))

  return {
    areas: rows.join(' ') || '"main"',
    columns: 'minmax(0, 1fr)',
    rows: [
      ...headers.value.map(h => `var(--m3-layout-${h.area}-height, 0px)`),
      'minmax(0, 1fr)',
      ...footers.value.map(f => `var(--m3-layout-${f.area}-height, 0px)`)
    ].join(' ') || 'minmax(0, 1fr)'
  }
})

const tabletGrid = computed(() => {
  // На планшетах есть left, но нет right
  const cols = [...lefts.value.map(i => i.area), 'main']
  const rows: string[] = []

  headers.value.forEach(h => rows.push(`"${cols.map(() => h.area).join(' ')}"`))
  rows.push(`"${cols.join(' ')}"`)
  footers.value.forEach(f => rows.push(`"${cols.map(() => f.area).join(' ')}"`))

  return {
    areas: rows.join(' ') || '"main"',
    columns: cols.map(c => c === 'main' ? 'minmax(0, 1fr)' : `var(--m3-layout-${c}-width, 0px)`).join(' ') || 'minmax(0, 1fr)',
    rows: [
      ...headers.value.map(h => `var(--m3-layout-${h.area}-height, 0px)`),
      'minmax(0, 1fr)',
      ...footers.value.map(f => `var(--m3-layout-${f.area}-height, 0px)`)
    ].join(' ') || 'minmax(0, 1fr)'
  }
})

const desktopGrid = computed(() => {
  // На десктопах есть и left, и right
  const cols = [...lefts.value.map(i => i.area), 'main', ...rights.value.map(i => i.area)]
  const rows: string[] = []

  headers.value.forEach(h => rows.push(`"${cols.map(() => h.area).join(' ')}"`))
  rows.push(`"${cols.join(' ')}"`)
  footers.value.forEach(f => rows.push(`"${cols.map(() => f.area).join(' ')}"`))

  return {
    areas: rows.join(' ') || '"main"',
    columns: cols.map(c => c === 'main' ? 'minmax(0, 1fr)' : `var(--m3-layout-${c}-width, 0px)`).join(' ') || 'minmax(0, 1fr)',
    rows: [
      ...headers.value.map(h => `var(--m3-layout-${h.area}-height, 0px)`),
      'minmax(0, 1fr)',
      ...footers.value.map(f => `var(--m3-layout-${f.area}-height, 0px)`)
    ].join(' ') || 'minmax(0, 1fr)'
  }
})
</script>

<style lang="scss">
@use 'sass:map';

.m-layout {
  display: grid;
  min-height: 100dvh;
  contain: layout style;

  /* mobile-first: header / main / footer; left & right — вне потока (drawer/overlay), см. rail/drawer */
  grid-template-areas: v-bind('mobileGrid.areas');
  grid-template-columns: v-bind('mobileGrid.columns');
  grid-template-rows: v-bind('mobileGrid.rows');

  /* tablet: две колонки, без колонки right в сетке */
  @include media-distance(map.get($breakpoints, 'tablet-xs'), map.get($breakpoints, 'desktop-xs')) {
    grid-template-areas: v-bind('tabletGrid.areas');
    grid-template-columns: v-bind('tabletGrid.columns');
    grid-template-rows: v-bind('tabletGrid.rows');
  }

  /* desktop: три колонки */
  @include media-min(map.get($breakpoints, 'desktop-xs')) {
    grid-template-areas: v-bind('desktopGrid.areas');
    grid-template-columns: v-bind('desktopGrid.columns');
    grid-template-rows: v-bind('desktopGrid.rows');
  }

  &--full-height {
    height: 100dvh;
    overflow: hidden;
  }
}
</style>
