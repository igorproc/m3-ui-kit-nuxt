<template>
  <component
    :is="isRoutes() ? 'nav' : 'div'"
    class="ui-tabs"
    :aria-label="routes ? ariaLabel : undefined"
    :aria-labelledby="routes ? ariaLabelledby : undefined"
  >
    <div
      class="ui-tabs__list"
      :class="[`ui-tabs__list--${hierarchy}`, { 'ui-tabs__list--scrollable': layout === 'scrollable' }]"
      :role="routes ? undefined : 'tablist'"
      :aria-label="routes ? undefined : ariaLabel"
      :aria-labelledby="routes ? undefined : ariaLabelledby"
      @keydown="routes ? undefined : onKeydown($event)"
    >
      <m-tab
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :label="item.label"
        :icon="item.icon"
        :active-icon="item.activeIcon"
        :disabled="item.disabled"
        :to="item.to"
        :badge="item.badge"
        :badge-label="item.badgeLabel"
      >
        <template
          v-if="$slots.tab"
          #default="{ selected }"
        >
          <slot
            name="tab"
            :item="item"
            :selected="selected"
          />
        </template>
      </m-tab>

      <slot name="tabs" />
    </div>

    <template v-if="!routes">
      <slot name="panels" />

      <TabsContent
        v-if="$slots.default"
        v-slot="{ value }"
      >
        <slot :value="value" />
      </TabsContent>
    </template>
  </component>
</template>

<script setup lang="ts">
import { useId, useSlots } from 'vue'
import { provideTabsContext } from '#kit/composables/tabs/useTabs'
import type { TabValue } from '#kit/composables/tabs/useTabs'
import { useButtonNameWarning } from '#kit/utils/button/useButtonNameWarning'
import TabsContent from '#kit/components/fragments/tabs/content/index.vue'
import MTab from './tab/index.vue'
import { useTabsControl } from './control'
import { hasRouteTab } from './routes'
import { mTabsProps } from './props'
import type { MTabsSlots } from './props'

const props = defineProps(mTabsProps)
const slots = useSlots()
defineSlots<MTabsSlots>()

/**
 * Value of the selected tab. Left empty, the first enabled tab is selected and
 * written back here, so the parent always knows which tab is shown. Route tabs
 * ignore it: the current route is their selection.
 */
const modelValue = defineModel<TabValue | null>({ default: null })

const { sel, selectedValue, register, registerElement, onKeydown } = useTabsControl(modelValue)

// Route tabs are known only from the items and the slotted vnodes, read in this
// render: the landmark has to be right in the server HTML, before any tab mounts.
// The tabs rendered right after read the same answer through the context.
let routes = false
function isRoutes() {
  routes = Boolean(props.items?.some(item => item.to != null)) || hasRouteTab(slots.tabs?.(), MTab)
  return routes
}

useButtonNameWarning('m-tabs', () => props.ariaLabel ?? props.ariaLabelledby, '`ariaLabel` or `ariaLabelledby`')

const idBase = useId()
const safeId = (value: TabValue) => String(value).replace(/[^\w-]/g, '_')

provideTabsContext({
  register,
  unregister: sel.unregister,
  select: sel.select,
  get size() {
    return sel.size
  },
  selectedValue: sel.selectedValue,
  registerElement,
  tabId: value => `${idBase}-tab-${safeId(value)}`,
  panelId: value => `${idBase}-panel-${safeId(value)}`,
  hasPanels: () => Boolean(slots.panels || slots.default),
  get routes() {
    return routes
  },
  get hierarchy() {
    return props.hierarchy
  },
  get iconPlacement() {
    return props.iconPlacement ?? (props.hierarchy === 'secondary' ? 'start' : 'top')
  },
})

defineExpose({ selectedValue })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/tabs/index' as t;

.ui-tabs {
  $t: material-map(t.$tokens, 'md-tabs');

  display: flex;
  flex-direction: column;
  gap: g($t, 'list.gap');
  min-width: 0;

  // The row never pushes its container: in `fixed` too it scrolls when the
  // tabs outgrow it (a scroll container adds nothing to its parent's minimum).
  &__list {
    position: relative;
    display: flex;
    align-items: stretch;
    border-bottom: g($t, 'list.border.width') solid g($t, 'list.border.color');
    width: 100%;
    overflow: auto hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    anchor-scope: --ui-tabs-active;

    &::-webkit-scrollbar {
      display: none;
    }

    &--scrollable {
      padding-inline-start: g($t, 'list.scrollable.padding.start');
    }
  }

  &__content {
    padding: g($t, 'content.padding.block') g($t, 'content.padding.inline');
  }

  // One indicator for the row, tethered to the selected tab: it slides to the
  // next one instead of growing under it. Without anchor positioning each tab
  // draws its own (tab/index.vue).
  @supports (position-anchor: --a) {
    &__list::before {
      content: '';
      position: absolute;
      position-anchor: --ui-tabs-active;
      inset-block-end: 0;
      inset-inline: anchor(start) anchor(end);
      pointer-events: none;
      transition: inset-inline g($t, 'motion.indicator.duration') g($t, 'motion.indicator.easing');
    }

    @each $hierarchy in (primary, secondary) {
      &__list--#{$hierarchy}::before {
        block-size: g($t, '#{$hierarchy}.indicator.height');
        border-radius: g($t, '#{$hierarchy}.indicator.shape');
        background-color: g($t, '#{$hierarchy}.selected.container.color');
      }
    }

    @include forced-colors {
      &__list::before {
        background-color: Highlight;
      }
    }
  }
}
</style>
