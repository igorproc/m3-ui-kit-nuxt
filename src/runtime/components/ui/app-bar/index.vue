<template>
  <component
    :is="rootTag"
    class="ui-app-bar"
    :class="rootClasses"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <span
      v-if="collapses && collapsedTitle"
      class="ui-app-bar__collapsed"
      aria-hidden="true"
    >
      {{ collapsedTitle }}
    </span>

    <slot>
      <m-app-bar-title
        v-if="title || subtitle"
        :title="title"
        :subtitle="subtitle"
        :heading-level="headingLevel"
      />
    </slot>
  </component>
</template>

<script setup lang="ts">
import { computed, shallowReactive, toRef, watchEffect } from 'vue'
import type { Ref } from 'vue'
import { provideAppBarContext } from '#kit/composables/app-bar/useAppBar'
import type { AppBarSize } from '#kit/composables/app-bar/useAppBar'
import { useAppBarScroll } from '#kit/composables/app-bar/useAppBarScroll'
import MAppBarTitle from './title/index.vue'
import { mAppBarProps } from './props'

const props = defineProps(mAppBarProps)

const size = toRef(props, 'type')
const align = toRef(props, 'align')

// Reports of a composed <MAppBarTitle>: its subtitle (for the taller height
// variant) and its title text (for the folded copy of a collapsing bar).
const subtitleReports = shallowReactive(new Set<Ref<boolean>>())
const titleReports = shallowReactive(new Set<Ref<string>>())
const hasSubtitle = computed(() => !!props.subtitle || [...subtitleReports].some(report => report.value))

function registerSubtitle(present: Ref<boolean>) {
  subtitleReports.add(present)
  return () => void subtitleReports.delete(present)
}

function registerTitle(text: Ref<string>) {
  titleReports.add(text)
  return () => void titleReports.delete(text)
}

// Height token lookup — a map keyed by size, the condition (subtitle) selects
// the column, replacing the old switch/ternary tangle.
const HEIGHT_TOKENS: Record<AppBarSize, { base: string, subtitle: string }> = {
  small: { base: '--ui-app-bar-height-small', subtitle: '--ui-app-bar-height-small-subtitle' },
  medium: { base: '--ui-app-bar-height-medium', subtitle: '--ui-app-bar-height-medium-subtitle' },
  large: { base: '--ui-app-bar-height-large', subtitle: '--ui-app-bar-height-large-subtitle' },
}
const sizeToken = computed(() => {
  const tokens = HEIGHT_TOKENS[size.value]
  return hasSubtitle.value ? tokens.subtitle : tokens.base
})

const { layoutItemStyles, layoutItemAttrs, isLayoutChild, hostKind } = useLayoutItem({
  kind: 'top',
  sizeToken,
  sticky: computed(() => props.sticky),
})

// A small bar is the folded form already.
const collapses = computed(() => props.scrollBehavior === 'collapse' && size.value !== 'small')
const collapsedTitle = computed(() => props.title || [...titleReports].map(report => report.value).find(Boolean) || '')

const zone = useLayoutZone()

const { scrolled, collapsed } = useAppBarScroll({
  scrolled: () => props.scrolled,
  collapses: () => collapses.value,
  zone,
  hostKind,
  anchored: isLayoutChild,
})

const clearsCutouts = computed(() => !zone && props.sticky)

// A header zone (`m-layout-header`) is the page header already, and a header
// may not hold another one.
const rootTag = computed(() => props.tag ?? (hostKind.value === 'top' ? 'div' : 'header'))

// A pinned zone reserves one height for its row, and a folding bar has a fixed
// one: a headline that grows to a second line would run over the content, so
// it wraps only elsewhere.
const inPinnedZone = computed(() => isLayoutChild || hostKind.value === 'top')
const wraps = computed(() => size.value !== 'small' && !inPinnedZone.value && !collapses.value)

const rootClasses = computed(() => [
  `ui-app-bar--${size.value}`,
  {
    'ui-app-bar--center': align.value === 'center',
    'ui-app-bar--subtitle': hasSubtitle.value,
    'ui-app-bar--scrolled': scrolled.value,
    'ui-app-bar--anchored': isLayoutChild,
    'ui-app-bar--sticky': props.sticky,
    'ui-app-bar--safe-area': clearsCutouts.value,
    'ui-app-bar--wrap': wraps.value,
    'ui-app-bar--collapse': collapses.value,
    'ui-app-bar--collapsed': collapsed.value,
  },
])

provideAppBarContext({ type: size, align, headingLevel: toRef(props, 'headingLevel'), wraps, registerSubtitle, registerTitle })

if (import.meta.dev) {
  watchEffect(() => {
    if (align.value === 'center' && size.value !== 'small') {
      console.warn(`[m-app-bar] a ${size.value} bar starts its headline: M3 centres only the small one.`)
    }
    if (props.scrollBehavior === 'collapse' && size.value === 'small') {
      console.warn('[m-app-bar] `scrollBehavior="collapse"` folds a medium or large bar; a small one is folded already.')
    }
  })
}

defineExpose({ scrolled })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/app-bar/index' as *;

// One fold over `$range` of scroll: the bar shrinks, the headline fades out,
// the copy in the top row fades in over the second half.
@mixin fold($range) {
  animation: ui-app-bar-fold linear both;
  animation-timeline: scroll(nearest block);
  animation-range: 0 $range;

  .ui-app-bar__headline {
    animation: ui-app-bar-fade-out linear both;
    animation-timeline: scroll(nearest block);
    animation-range: 0 $range;
  }

  .ui-app-bar__collapsed {
    animation: ui-app-bar-fade-in linear both;
    animation-timeline: scroll(nearest block);
    animation-range: ($range * 0.5) $range;
  }
}

// A composed <MAppBarTitle> reports its subtitle only after the bar has
// rendered, so the class misses the server's first frame; `:has()` sees the
// headline's own modifier at once. The class stays for browsers without it.
$with-subtitle: ':is(.ui-app-bar--subtitle, :has(.ui-app-bar__headline--subtitle))';

.ui-app-bar {
  // Area names are owned by each region's map — single source of truth shared
  // with the leaves that claim them.
  $nav-area: g($nav, 'area');
  $headline-area: g($title, 'area');
  $actions-area: g($actions, 'area');
  $collapsed-area: g($title, 'collapsed.area');
  $inset: g($title, 'inset');
  $motion: g($container, 'motion.duration') g($container, 'motion.easing');

  @at-root :root {
    --ui-app-bar-height-small: #{g($height, 'small.base')};
    --ui-app-bar-height-small-subtitle: #{g($height, 'small.subtitle')};
    --ui-app-bar-height-medium: #{g($height, 'medium.base')};
    --ui-app-bar-height-medium-subtitle: #{g($height, 'medium.subtitle')};
    --ui-app-bar-height-large: #{g($height, 'large.base')};
    --ui-app-bar-height-large-subtitle: #{g($height, 'large.subtitle')};
  }

  display: grid;

  // A side column is never narrower than the headline inset: a lone headline
  // keeps M3's distance from the edge, a leading button pushes it instead.
  grid-template-columns: minmax(#{$inset}, auto) 1fr minmax(#{$inset}, auto);
  grid-template-areas: '#{$nav-area} #{$headline-area} #{$actions-area}';
  align-items: center;
  min-height: var(--ui-app-bar-height-small);

  // Small: `min-height` alone centres the 48rem controls, so a taller control
  // (a 56rem search bar) still fits the height the layout reserves.
  padding-inline: g($container, 'padding.inline');
  border-radius: 0;
  background-color: g($container, 'color');
  color: g($title, 'color');
  box-shadow: g($container, 'shadow');
  transition:
    min-height $motion,
    height $motion,
    background-color $motion,
    box-shadow $motion;

  // Content scrolls under the bar, which is set apart by a tone and a shadow
  // only. Drawn at rest too, so scrolling never adds a pixel to a sticky bar.
  @include forced-colors {
    border-block-end: 1px solid CanvasText;
  }

  &--small {
    min-height: var(--ui-app-bar-height-small);
  }

  // Medium & large share the two-row layout: the small bar as the controls row
  // (where a folded bar shows its title copy), then the headline below.
  &--medium,
  &--large {
    grid-template-areas:
      '#{$nav-area} #{$collapsed-area} #{$actions-area}'
      '#{$headline-area} #{$headline-area} #{$headline-area}';
    grid-template-rows: var(--ui-app-bar-height-small) 1fr;

    .ui-app-bar__headline {
      align-self: end;
      padding-inline: $inset;
      padding-bottom: g($title, 'padding-bottom');
    }
  }

  @each $size in (medium, large) {
    &--#{$size} {
      min-height: var(--ui-app-bar-height-#{$size});

      .ui-app-bar__title {
        @include apply-typography(g($title, 'typography.#{$size}'));
      }

      .ui-app-bar__subtitle {
        @include apply-typography(g($title, 'subtitle.typography.#{$size}'));
      }
    }
  }

  // Subtitle grows the bar to the taller MD3 height variant of its size.
  &#{$with-subtitle} {
    &.ui-app-bar--small {
      min-height: var(--ui-app-bar-height-small-subtitle);
    }

    &.ui-app-bar--medium {
      min-height: var(--ui-app-bar-height-medium-subtitle);
    }

    &.ui-app-bar--large {
      min-height: var(--ui-app-bar-height-large-subtitle);
    }
  }

  &--center .ui-app-bar__headline {
    text-align: center;
    align-items: center;
  }

  // A flexible headline wraps up to two lines before it gives up with an ellipsis.
  &--wrap .ui-app-bar__title {
    display: -webkit-box;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: g($title, 'lines');
  }

  &--scrolled {
    background-color: g($container, 'scrolled.color');
    box-shadow: g($container, 'scrolled.shadow');
  }

  &__collapsed {
    grid-area: $collapsed-area;
    align-self: center;
    min-width: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    opacity: 0;
    transition: opacity g($collapse, 'motion.duration') g($collapse, 'motion.easing');

    @include apply-typography(g($title, 'collapsed.typography'));
  }

  &--center &__collapsed {
    text-align: center;
  }

  // A folding bar has the height of its size, not only that floor: the grid
  // row of the headline can then shrink with it. Its text stays at the bottom
  // and slides under the top row instead of spilling over it.
  @each $size in (medium, large) {
    &--collapse.ui-app-bar--#{$size} {
      height: var(--ui-app-bar-height-#{$size});
    }

    &--collapse.ui-app-bar--#{$size}#{$with-subtitle} {
      height: var(--ui-app-bar-height-#{$size}-subtitle);
    }
  }

  &--collapse .ui-app-bar__headline {
    align-self: stretch;
    justify-content: flex-end;
    min-height: 0;
    overflow: hidden;
    transition: opacity g($collapse, 'motion.duration') g($collapse, 'motion.easing');
  }

  &--sticky {
    position: sticky;
    inset-block-start: 0;
    z-index: z(header);
  }

  &--safe-area {
    box-sizing: content-box;
    padding-block-start: g($container, 'safe-area.top');
    padding-left: g($container, 'safe-area.left');
    padding-right: g($container, 'safe-area.right');
  }

  &--anchored {
    z-index: z(header);
  }

  // W65: the fold follows the scroll itself, with no JS and a correct first frame.
  @supports (animation-timeline: scroll()) {
    @each $size in (medium, large) {
      &--collapse.ui-app-bar--#{$size} {
        @include fold(g($collapse, 'range.#{$size}.base'));
      }

      &--collapse.ui-app-bar--#{$size}#{$with-subtitle} {
        @include fold(g($collapse, 'range.#{$size}.subtitle'));
      }
    }
  }

  // Elsewhere the bar folds at once (the class is set only there).
  @supports not (animation-timeline: scroll()) {
    &.ui-app-bar--collapse.ui-app-bar--collapsed {
      height: g($collapse, 'target');
      min-height: g($collapse, 'target');

      .ui-app-bar__headline {
        opacity: 0;
      }

      .ui-app-bar__collapsed {
        opacity: 1;
      }
    }
  }
}

@keyframes ui-app-bar-fold {
  to {
    height: g($collapse, 'target');
    min-height: g($collapse, 'target');
  }
}

@keyframes ui-app-bar-fade-out {
  to {
    opacity: 0;
  }
}

@keyframes ui-app-bar-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
