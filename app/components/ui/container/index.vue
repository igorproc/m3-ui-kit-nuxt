<template>
  <div
    class="m-container"
    :class="classes"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
// Колоночная сетка (M3 layout grid): display: grid, число колонок по
// брейкпоинтам (дефолт 4/8/12), маржины/гаттеры 16/24. Вся адаптивность —
// статический CSS (mobile-first классы), JS только нормализует пропсы
type GridSize = number | string

interface Props {
  /** Без ограничения максимальной ширины */
  fluid?: boolean
  /** Число колонок: база (mobile-first) */
  cols?: GridSize
  colsMobile?: GridSize
  colsTabletXs?: GridSize
  colsTablet?: GridSize
  colsDesktopXs?: GridSize
  colsDesktop?: GridSize
}

const props = defineProps<Props>()

const classes = computed(() => {
  const list: string[] = []

  if (props.fluid) list.push('m-container--fluid')
  if (props.cols != null) list.push(`m-container--cols-${props.cols}`)

  const byBreakpoint: [GridSize | undefined, string][] = [
    [props.colsMobile, 'mobile'],
    [props.colsTabletXs, 'tablet-xs'],
    [props.colsTablet, 'tablet'],
    [props.colsDesktopXs, 'desktop-xs'],
    [props.colsDesktop, 'desktop'],
  ]

  for (const [value, key] of byBreakpoint) {
    if (value != null) list.push(`m-container--${key}-cols-${value}`)
  }

  return list
})
</script>

<style lang="scss">
@use 'sass:map';
@use '~/assets/stylesheet/components/grid/index' as grid;

.m-container {
  display: grid;
  grid-template-columns: repeat(var(--m-container-cols), minmax(0, 1fr));
  gap: var(--m-container-gutter);
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--m-container-margin);

  // Дефолты колонок/гаттеров/маржинов по брейкпоинтам (mobile-first)
  @each $key in grid.$bp-order {
    $cols: map.get(grid.$tokens, columns, $key);
    $gutter: map.get(grid.$tokens, gutter, $key);
    $margin: map.get(grid.$tokens, margin, $key);

    @if $cols or $gutter or $margin {
      @include grid.bp-up($key) {
        @if $cols {
          --m-container-cols: #{$cols};
        }

        @if $gutter {
          --m-container-gutter: #{$gutter};
        }

        @if $margin {
          --m-container-margin: #{$margin};
        }
      }
    }
  }

  // Максимальная ширина (не-fluid); маржины поверх контентной ширины
  @each $key in grid.$bp-order {
    $mw: map.get(grid.$tokens, max-width, $key);

    @if $mw {
      @include grid.bp-up($key) {
        max-width: calc(#{$mw} + var(--m-container-margin) * 2);
      }
    }
  }

  &--fluid {
    max-width: none;
  }

  // Переопределение числа колонок пропсами — эмитится после дефолтов,
  // выигрывает каскадом при равной специфичности
  @for $i from 1 through grid.$max-columns {
    &--cols-#{$i} {
      --m-container-cols: #{$i};
    }
  }

  @each $key in grid.$bp-order {
    @include grid.bp-up($key) {
      @for $i from 1 through grid.$max-columns {
        &--#{$key}-cols-#{$i} {
          --m-container-cols: #{$i};
        }
      }
    }
  }
}
</style>
