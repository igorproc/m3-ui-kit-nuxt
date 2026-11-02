<template>
  <div
    class="m-container"
    :class="rootClasses"
  >
    <div
      v-if="container"
      class="m-container__grid"
      :class="columnClasses"
    >
      <slot />
    </div>

    <slot v-else />
  </div>
</template>

<script setup lang="ts">
// Колоночная сетка (M3 layout grid): display: grid, число колонок по
// брейкпоинтам (дефолт 4/8/12), маржины/гаттеры 16/24. Вся адаптивность —
// статический CSS (mobile-first классы), JS только нормализует пропсы
import { provideGridContext } from '#kit/utils/grid/useGridContext'

type GridSize = number | string

interface Props {
  /** Без ограничения максимальной ширины */
  fluid?: boolean
  /**
   * Columns, gutters and margins follow this container's own width (`@container`)
   * instead of the window's: for a grid inside a drawer, a card or a pane.
   */
  container?: boolean
  /** Число колонок: база (mobile-first) */
  cols?: GridSize
  colsMobile?: GridSize
  colsTabletXs?: GridSize
  colsTablet?: GridSize
  colsDesktopXs?: GridSize
  colsDesktop?: GridSize
}

const props = defineProps<Props>()

provideGridContext({
  get queries() {
    return props.container ? 'container' : 'window'
  },
})

// A box cannot query its own width: in container mode the root is the size
// container and the grid, with its column overrides, is the element inside it.
const columnClasses = computed(() => {
  const block = props.container ? 'm-container__grid' : 'm-container'
  const list: string[] = []

  if (props.cols != null) list.push(`${block}--cols-${props.cols}`)

  const byBreakpoint: [GridSize | undefined, string][] = [
    [props.colsMobile, 'mobile'],
    [props.colsTabletXs, 'tablet-xs'],
    [props.colsTablet, 'tablet'],
    [props.colsDesktopXs, 'desktop-xs'],
    [props.colsDesktop, 'desktop'],
  ]

  for (const [value, key] of byBreakpoint) {
    if (value != null) list.push(`${block}--${key}-cols-${value}`)
  }

  return list
})

const rootClasses = computed(() => [
  {
    'm-container--fluid': props.fluid,
    'm-container--container': props.container,
  },
  props.container ? [] : columnClasses.value,
])
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/grid/index' as grid;

$t: material-map(grid.$tokens, 'md-grid');

// The grid surface: the root itself, or the element inside it in container mode.
@mixin grid-surface {
  display: grid;
  grid-template-columns: repeat(var(--m-container-cols), minmax(0, 1fr));
  gap: var(--m-container-gutter);
  padding-left: max(var(--m-container-margin), #{g($t, 'safe-area.left')});
  padding-right: max(var(--m-container-margin), #{g($t, 'safe-area.right')});
}

// Дефолты колонок/гаттеров/маржинов по брейкпоинтам (mobile-first); `$query`
// says what the breakpoints measure: the window or the container
@mixin column-defaults($query) {
  @each $key in grid.$bp-order {
    $cols: map.get(grid.$tokens, columns, $key);
    $gutter: map.get(grid.$tokens, gutter, $key);
    $margin: map.get(grid.$tokens, margin, $key);

    @if $cols or $gutter or $margin {
      @include grid.up($query, $key) {
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
}

// Переопределение числа колонок пропсами — эмитится после дефолтов,
// выигрывает каскадом при равной специфичности
@mixin column-overrides($query) {
  @for $i from 1 through grid.$max-columns {
    &--cols-#{$i} {
      --m-container-cols: #{$i};
    }
  }

  @each $key in grid.$bp-order {
    @include grid.up($query, $key) {
      @for $i from 1 through grid.$max-columns {
        &--#{$key}-cols-#{$i} {
          --m-container-cols: #{$i};
        }
      }
    }
  }
}

.m-container {
  @include grid-surface;

  width: 100%;
  margin-inline: auto;

  @include column-defaults(window);

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

  @include column-overrides(window);

  // A box cannot query its own width: the root becomes the size container and
  // the grid, its margins included, moves onto the element inside it.
  &--container {
    display: block;
    padding-left: 0;
    padding-right: 0;
    container: m-container / inline-size;
  }

  &__grid {
    @include grid-surface;
    @include column-defaults(container);
    @include column-overrides(container);
  }
}
</style>
