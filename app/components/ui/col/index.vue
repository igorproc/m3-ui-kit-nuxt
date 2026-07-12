<template>
  <div
    class="m-col"
    :class="classes"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
// Колонка сетки m-container. Спаны считаются ОТНОСИТЕЛЬНО актуального числа
// колонок брейкпоинта (cols="2" на мобилке из 4 колонок = половина) и
// клампятся, чтобы не создавать implicit-треки. Offset — через
// grid-column-start. Без указания span колонка занимает всю строку
type GridSize = number | string

interface Props {
  /** Спан: база (mobile-first); дальше переопределения по брейкпоинтам */
  cols?: GridSize
  mobile?: GridSize
  tabletXs?: GridSize
  tablet?: GridSize
  desktopXs?: GridSize
  desktop?: GridSize
  /** Смещение в колонках (0 сбрасывает на авто-поток) */
  offset?: GridSize
  offsetMobile?: GridSize
  offsetTabletXs?: GridSize
  offsetTablet?: GridSize
  offsetDesktopXs?: GridSize
  offsetDesktop?: GridSize
}

const props = defineProps<Props>()

const classes = computed(() => {
  const list: string[] = []

  if (props.cols != null) list.push(`m-col--span-${props.cols}`)
  if (props.offset != null) list.push(`m-col--offset-${props.offset}`)

  const byBreakpoint: [GridSize | undefined, GridSize | undefined, string][] = [
    [props.mobile, props.offsetMobile, 'mobile'],
    [props.tabletXs, props.offsetTabletXs, 'tablet-xs'],
    [props.tablet, props.offsetTablet, 'tablet'],
    [props.desktopXs, props.offsetDesktopXs, 'desktop-xs'],
    [props.desktop, props.offsetDesktop, 'desktop'],
  ]

  for (const [span, offset, key] of byBreakpoint) {
    if (span != null) list.push(`m-col--${key}-span-${span}`)
    if (offset != null) list.push(`m-col--${key}-offset-${offset}`)
  }

  return list
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/grid/index' as grid;

.m-col {
  min-width: 0;

  // Именно ЛОНГХЕНДЫ: без offset переменная не определена → calc invalid at
  // computed-value time → только start откатывается к initial (auto).
  // В shorthand невалидный var() уронил бы и спан-кламп вместе со start
  /* stylelint-disable declaration-block-no-redundant-longhand-properties */
  grid-column-start: calc(var(--m-col-offset) + 1);
  grid-column-end: span min(var(--m-col-span, var(--m-container-cols)), var(--m-container-cols));
  /* stylelint-enable declaration-block-no-redundant-longhand-properties */
}

// Классы спанов/смещений: база + по брейкпоинтам, в возрастающем порядке —
// при равной специфичности выигрывает более поздний (mobile-first)
@mixin col-classes($prefix: '') {
  @for $i from 1 through grid.$max-columns {
    .m-col--#{$prefix}span-#{$i} {
      --m-col-span: #{$i};
    }
  }

  // offset-0: var → initial → grid-column-start invalid → auto (сброс смещения)
  .m-col--#{$prefix}offset-0 {
    --m-col-offset: initial;
  }

  @for $i from 1 through grid.$max-columns - 1 {
    .m-col--#{$prefix}offset-#{$i} {
      --m-col-offset: #{$i};
    }
  }
}

@include col-classes;

@each $key in grid.$bp-order {
  @include grid.bp-up($key) {
    @include col-classes('#{$key}-');
  }
}
</style>
