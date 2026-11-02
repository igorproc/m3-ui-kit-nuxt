<template>
  <nav
    class="ui-navigation-bar"
    :class="[
      `ui-navigation-bar--${iconPlacement}`,
      {
        'ui-navigation-bar--anchored': isLayoutChild,
        'ui-navigation-bar--safe-area': clearsCutouts,
        [`ui-navigation-bar--centered-${centeredStep}`]: iconPlacement === 'start',
      },
    ]"
    :aria-label="ariaLabel"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <NavigationItem
      v-for="item in items"
      :key="item.id"
      class="ui-navigation-bar__item"
      host="bar"
      :placement="iconPlacement"
      :label="item.label"
      :icon="item.icon"
      :active-icon="item.activeIcon"
      :badge="item.badge"
      :badge-label="item.badgeLabel"
      :disabled="item.disabled"
      :active="item.id === selectedValue"
      @select="onSelect(item.id, $event)"
    />
  </nav>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import NavigationItem from '#kit/components/fragments/navigation-item/index.vue'
import { provideNavigationBarContext } from '#kit/composables/navigation/useNavigationBar'
import { useNavigationModel } from '#kit/utils/navigation/useNavigationModel'
import { mNavigationBarProps } from './props'
import type { MNavigationBarEmits, MNavigationBarIconPlacement } from './props'

const props = defineProps(mNavigationBarProps)
const emit = defineEmits<MNavigationBarEmits>()

// Первый уровень m-layout → bottom-зона (прибит к низу, M3 nav bar всегда виден);
// высота — токеном, иначе sticky-низу нечем зарезервировать строку грида
const { layoutItemStyles, layoutItemAttrs, isLayoutChild } = useLayoutItem({
  kind: 'bottom',
  sizeToken: '--ui-navigation-bar-height',
  sticky: true,
})

const clearsCutouts = !useLayoutZone()

const modelValue = defineModel<string | null>({ default: null })

const { single, selectedValue, select } = useNavigationModel(() => props.items, modelValue)

provideNavigationBarContext({
  register: ticket => single.register(ticket),
  unregister: id => single.unregister(id),
  select: id => single.select(id),
  selectedValue: single.selectedValue,
})

// M3 sets the centred margin for 3 to 6 destinations; fewer take the widest, more the narrowest.
const centeredStep = computed(() => Math.min(6, Math.max(3, props.items.length)))

const DESTINATION_RANGE: Record<MNavigationBarIconPlacement, { min: number, max: number }> = {
  top: { min: 3, max: 5 },
  start: { min: 3, max: 6 },
}

if (import.meta.dev) {
  watchEffect(() => {
    const count = props.items.length
    const { min, max } = DESTINATION_RANGE[props.iconPlacement]
    if (count && (count < min || count > max)) {
      console.warn(`[m-navigation-bar] ${count} destinations: M3 sets ${min} to ${max} in a bar with \`iconPlacement="${props.iconPlacement}"\`; move the rest to a navigation drawer or rail.`)
    }
  })
}

// Every activation is reported, the active destination's too: pressing it
// again is how an app scrolls a section back to its top or resets it.
function onSelect(id: string, event: MouseEvent) {
  select(id)
  emit('select', id, event)
}
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/navigation-bar/index' as t;

.ui-navigation-bar {
  $t: material-map(t.$tokens, 'md-navigation-bar');

  @at-root :root {
    --ui-navigation-bar-height: #{g($t, 'container.height')};
  }

  display: flex;
  align-items: stretch;
  min-height: var(--ui-navigation-bar-height);
  background-color: g($t, 'container.color');
  color: g($t, 'container.text.color');

  // Vertical destinations share the width equally (M3 `EqualWeight`).
  &--top &__item.ui-navigation-item {
    flex: 1;
  }

  &--start {
    justify-content: center;
  }

  &--start &__item.ui-navigation-item {
    flex: 1;
  }

  &--safe-area {
    min-height: g($t, 'container.safe-area.min-height');
    padding-block-end: g($t, 'container.safe-area.bottom');
    padding-left: g($t, 'container.safe-area.left');
    padding-right: g($t, 'container.safe-area.right');
  }

  @each $count, $centered in map.get(t.$tokens, 'centered') {
    &--centered-#{$count} {
      padding-inline: map.get($centered, 'margin');
    }

    &--centered-#{$count}#{&}--safe-area {
      padding-left: map.get($centered, 'safe-area', 'left');
      padding-right: map.get($centered, 'safe-area', 'right');
    }
  }

  &--anchored {
    z-index: z(header);
  }

  // The container is set apart by its tone alone, which forced colors drop.
  @include forced-colors {
    outline: 1px solid CanvasText;
    outline-offset: -1px;
  }
}
</style>
