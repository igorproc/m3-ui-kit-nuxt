<template>
  <div
    class="m-row"
    :class="classes"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
// Опциональная семантическая «строка» внутри m-container: subgrid наследует
// линии колонок контейнера и форсит перенос (grid-column: 1 / -1).
// m-col работают внутри неё так же, как напрямую в контейнере
interface Props {
  /** Вертикальное выравнивание колонок строки */
  align?: 'start' | 'center' | 'end' | 'stretch'
  /** Убрать гаттеры внутри строки */
  noGutters?: boolean
}

const props = defineProps<Props>()

const classes = computed(() => {
  const list: string[] = []

  if (props.align) list.push(`m-row--align-${props.align}`)
  if (props.noGutters) list.push('m-row--no-gutters')

  return list
})
</script>

<style lang="scss">
.m-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;

  // Явно, а не наследованием subgrid: колоночная ось — надёжность, строчная ось
  // subgrid'ом не покрывается вовсе (implicit-строки внутри row были бы без gap).
  // Вне m-container переменной нет → IACVT → gap: normal
  gap: var(--m-container-gutter);

  &--no-gutters {
    gap: 0;
  }

  &--align-start {
    align-items: start;
  }

  &--align-center {
    align-items: center;
  }

  &--align-end {
    align-items: end;
  }

  &--align-stretch {
    align-items: stretch;
  }
}
</style>
