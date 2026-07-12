<template>
  <div
    class="ui-app-bar"
    :class="[
      `ui-app-bar--${type}`,
      {
        'ui-app-bar--scrolled': scrolled,
        'ui-app-bar--with-subtitle': hasSubtitle,
        'ui-app-bar--anchored': isLayoutChild,
      },
    ]"
    v-bind="layoutItemAttrs"
    :style="[
      layoutItemStyles,
      dynamicGridStyles,
    ]"
  >
    <slot name="container">
      <div
        v-if="$slots.nav"
        class="ui-app-bar__nav"
      >
        <slot name="nav" />
      </div>

      <div
        v-if="$slots.title || title || subtitle || $slots.subtitle"
        class="ui-app-bar__title"
      >
        <slot name="title">
          <p
            v-if="title"
            class="ui-app-bar__title-text"
          >
            {{ title }}
          </p>
        </slot>

        <slot name="subtitle">
          <p
            v-if="subtitle"
            class="ui-app-bar__subtitle"
          >
            {{ subtitle }}
          </p>
        </slot>
      </div>

      <div
        v-if="$slots.actions"
        class="ui-app-bar__actions"
      >
        <slot name="actions" />
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { mAppBarProps } from './props'

const props = defineProps(mAppBarProps)

const slots = useSlots()

const hasSubtitle = computed(() => {
  return !!props.subtitle || !!slots.subtitle
})

// Auto-elevate: внутри лейаута — общий windowY контекстной зоны (покрывает скролл
// документа и скролл main в full-height); вне лейаута — собственный слушатель
const layoutZone = useLayoutZone()
const fallbackY = ref(0)

if (!layoutZone) {
  useGlobalListener('window', 'scroll', () => {
    fallbackY.value = window.scrollY
  }, { passive: true })
}

const scrolled = computed(() => {
  if (props.isScrolled) return true
  return (layoutZone ? layoutZone.windowY.value : fallbackY.value) > 0
})

// Self-register in layout system with correct CSS variable token resolved in SCSS
const sizeToken = computed(() => {
  switch (props.type) {
    case 'small':
      return '--ui-app-bar-height-small'
    case 'medium':
      return hasSubtitle.value ? '--ui-app-bar-height-medium-subtitle' : '--ui-app-bar-height-medium'
    case 'large':
      return hasSubtitle.value ? '--ui-app-bar-height-large-subtitle' : '--ui-app-bar-height-large'
    case 'center-aligned':
    default:
      return '--ui-app-bar-height-center-aligned'
  }
})

// Первый уровень m-layout → top-зона; внутри m-layout-header → вклад высоты в зону
const { layoutItemStyles, layoutItemAttrs, isLayoutChild } = useLayoutItem({
  kind: 'top',
  sizeToken,
  sticky: computed(() => props.sticky),
})

// Dynamic grid template layout based on variant and active slots
const dynamicGridStyles = computed(() => {
  // If the container slot is used, we skip all dynamic grid layouts
  if (slots.container) {
    return {
      display: 'block',
    }
  }

  const hasNav = !!slots.nav
  const hasTitle = !!slots.title || !!props.title || !!props.subtitle || !!slots.subtitle
  const hasActions = !!slots.actions

  // Build grid columns based on slot presence
  const columns: string[] = []
  if (hasNav) columns.push('auto')
  if (hasTitle) columns.push('1fr')
  if (hasActions) columns.push('auto')

  const gridTemplateColumns = columns.length > 0 ? columns.join(' ') : '1fr'

  if (props.type === 'medium' || props.type === 'large') {
    // Two-row layout:
    // Row 1: nav (left), space (center), actions (right)
    // Row 2: title spanning across
    const row1Areas: string[] = []
    row1Areas.push(hasNav ? 'nav' : '.')

    // Add empty space/column if both nav/actions exist or only title exists
    if (hasTitle && (hasNav || hasActions)) {
      row1Areas.push('.')
    }

    row1Areas.push(hasActions ? 'actions' : '.')

    const areas = `
      "${row1Areas.join(' ')}"
      "title title title"
    `

    return {
      display: 'grid',
      gridTemplateColumns: hasNav && hasActions ? 'auto 1fr auto' : 'auto 1fr',
      gridTemplateRows: 'auto 1fr',
      gridTemplateAreas: areas.trim(),
    }
  }

  // Single-row layout (center-aligned or small)
  const rowAreas: string[] = []
  if (hasNav) rowAreas.push('nav')
  if (hasTitle) rowAreas.push('title')
  if (hasActions) rowAreas.push('actions')

  const areas = `"${rowAreas.join(' ')}"`

  return {
    display: 'grid',
    gridTemplateColumns,
    gridTemplateAreas: areas,
  }
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/app-bar/index' as *;

.ui-app-bar {
  $prefix: 'ui-app-bar';
  $t: material-map($tokens, $prefix);

  @at-root :root {
    --ui-app-bar-height-center-aligned: #{g($t, 'height.center-aligned')};
    --ui-app-bar-height-small: #{g($t, 'height.small')};
    --ui-app-bar-height-medium: #{g($t, 'height.medium')};
    --ui-app-bar-height-medium-subtitle: #{g($t, 'height.medium-with-subtitle')};
    --ui-app-bar-height-large: #{g($t, 'height.large')};
    --ui-app-bar-height-large-subtitle: #{g($t, 'height.large-with-subtitle')};
  }

  min-height: var(--ui-app-bar-height-center-aligned);
  display: grid;
  align-items: center;
  gap: g($t, 'container-gap');
  padding-inline: g($t, 'container-padding-inline');
  padding-block: g($t, 'container-padding-block');
  border-radius: 0;
  background-color: g($t, 'container-color');
  color: g($t, 'title-text-color');
  box-shadow: g($t, 'container-shadow');
  position: sticky;
  top: 0;
  z-index: z(header);
  transition:
    min-height var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
    background-color var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

  &--center-aligned {
    min-height: var(--ui-app-bar-height-center-aligned);

    .ui-app-bar__title {
      text-align: center;
      align-items: center;
    }
  }

  &--small {
    min-height: var(--ui-app-bar-height-small);
  }

  &--medium {
    min-height: var(--ui-app-bar-height-medium);
    grid-template-rows: auto 1fr;
    align-items: start;

    .ui-app-bar__title {
      align-self: end;
      padding-bottom: 24rem;
    }

    .ui-app-bar__title-text {
      @include apply-typography(g($t, 'title-text-typography-medium'));
    }

    &.ui-app-bar--with-subtitle {
      min-height: var(--ui-app-bar-height-medium-subtitle);
    }
  }

  &--large {
    min-height: var(--ui-app-bar-height-large);
    grid-template-rows: auto 1fr;
    align-items: start;

    .ui-app-bar__title {
      align-self: end;
      padding-bottom: 28rem;
    }

    .ui-app-bar__title-text {
      @include apply-typography(g($t, 'title-text-typography-large'));
    }

    &.ui-app-bar--with-subtitle {
      min-height: var(--ui-app-bar-height-large-subtitle);
    }
  }

  &--scrolled {
    background-color: g($t, 'container-scrolled-color');
    box-shadow: g($t, 'container-scrolled-shadow');
  }

  &--anchored {
    z-index: z(header);
  }

  &__nav {
    grid-area: nav;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'nav-min-width');
    min-height: g($t, 'nav-min-height');
  }

  &__title {
    grid-area: title;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: g($t, 'title-gap');
    min-width: 0;
  }

  &__title-text {
    margin: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    @include apply-typography(g($t, 'title-text-typography-small'));
  }

  &__subtitle {
    margin: 0;
    color: g($t, 'subtitle-color');
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    @include apply-typography(g($t, 'subtitle-typography'));
  }

  &__actions {
    grid-area: actions;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: g($t, 'actions-gap');
  }
}
</style>
