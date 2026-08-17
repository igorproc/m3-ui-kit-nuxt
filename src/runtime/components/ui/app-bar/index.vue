<template>
  <div
    class="ui-app-bar"
    :class="rootClasses"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot>
      <m-app-bar-title
        v-if="title || subtitle"
        :title="title"
        :subtitle="subtitle"
      />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowReactive } from 'vue'
import type { Ref } from 'vue'
import { provideAppBarContext } from '#kit/composables/app-bar/useAppBar'
import type { AppBarAlign, AppBarSize } from '#kit/composables/app-bar/useAppBar'
import MAppBarTitle from './title/index.vue'
import { mAppBarProps } from './props'

const props = defineProps(mAppBarProps)

// `center-aligned` is the legacy alias: normalize the mixed axis into a pure
// size + a forced center alignment. Everything downstream sees clean axes.
const size = computed<AppBarSize>(() => props.type === 'center-aligned' ? 'small' : props.type)
const align = computed<AppBarAlign>(() => props.type === 'center-aligned' ? 'center' : props.align)

// Subtitle presence: the container's own prop OR any composed <MAppBarTitle>
// that reported one up through the context.
const subtitleReports = shallowReactive(new Set<Ref<boolean>>())
const hasSubtitle = computed(() => !!props.subtitle || [...subtitleReports].some(report => report.value))

function registerSubtitle(present: Ref<boolean>) {
  subtitleReports.add(present)
  return () => void subtitleReports.delete(present)
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

// Scroll-fill: controlled when `scrolled` is passed (skips the listener), else
// auto — inside a layout via the zone's shared offset, otherwise its own listener.
const layoutZone = useLayoutZone()
const fallbackY = ref(0)

if (props.scrolled === undefined && !layoutZone) {
  useGlobalListener('window', 'scroll', () => {
    fallbackY.value = window.scrollY
  }, { passive: true })
}

const scrolled = computed(() => {
  if (props.scrolled !== undefined) return props.scrolled
  return (layoutZone ? layoutZone.windowY.value : fallbackY.value) > 0
})

const { layoutItemStyles, layoutItemAttrs, isLayoutChild } = useLayoutItem({
  kind: 'top',
  sizeToken,
  sticky: computed(() => props.sticky),
})

const rootClasses = computed(() => [
  `ui-app-bar--${size.value}`,
  {
    'ui-app-bar--center': align.value === 'center',
    'ui-app-bar--subtitle': hasSubtitle.value,
    'ui-app-bar--scrolled': scrolled.value,
    'ui-app-bar--anchored': isLayoutChild,
  },
])

provideAppBarContext({ type: size, align, registerSubtitle })

defineExpose({ scrolled })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/app-bar/index' as *;

.ui-app-bar {
  // Area names are owned by each region's map — single source of truth shared
  // with the leaves that claim them.
  $nav-area: g($nav, 'grid-name');
  $headline-area: g($title, 'grid-name');
  $actions-area: g($actions, 'grid-name');

  @at-root :root {
    --ui-app-bar-height-small: #{g($height, 'small')};
    --ui-app-bar-height-small-subtitle: #{g($height, 'small-with-subtitle')};
    --ui-app-bar-height-medium: #{g($height, 'medium')};
    --ui-app-bar-height-medium-subtitle: #{g($height, 'medium-with-subtitle')};
    --ui-app-bar-height-large: #{g($height, 'large')};
    --ui-app-bar-height-large-subtitle: #{g($height, 'large-with-subtitle')};
  }

  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: '#{$nav-area} #{$headline-area} #{$actions-area}';
  align-items: center;
  min-height: var(--ui-app-bar-height-small);
  padding: #{g($container, 'padding.block')} #{g($container, 'padding.inline')};
  border-radius: 0;
  background-color: g($container, 'color');
  color: g($title, 'color');
  box-shadow: g($container, 'shadow');
  position: sticky;
  top: 0;
  z-index: z(header);
  transition:
    min-height var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
    background-color var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

  &--small {
    min-height: var(--ui-app-bar-height-small);
  }

  // Medium & large share the two-row layout: controls row, then headline below.
  &--medium,
  &--large {
    grid-template-areas:
      '#{$nav-area} . #{$actions-area}'
      '#{$headline-area} #{$headline-area} #{$headline-area}';
    grid-template-rows: auto 1fr;
    align-items: start;

    .ui-app-bar__headline {
      align-self: end;
    }
  }

  &--medium {
    min-height: var(--ui-app-bar-height-medium);

    .ui-app-bar__headline {
      padding-bottom: g($title, 'padding-bottom.medium');
    }

    .ui-app-bar__title {
      @include apply-typography(g($title, 'typography.medium'));
    }
  }

  &--large {
    min-height: var(--ui-app-bar-height-large);

    .ui-app-bar__headline {
      padding-bottom: g($title, 'padding-bottom.large');
    }

    .ui-app-bar__title {
      @include apply-typography(g($title, 'typography.large'));
    }
  }

  // Subtitle grows the bar to the taller MD3 height variant of its size.
  &--subtitle {
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

  &--scrolled {
    background-color: g($container, 'scrolled.color');
    box-shadow: g($container, 'scrolled.shadow');
  }

  &--anchored {
    z-index: z(header);
  }
}
</style>
