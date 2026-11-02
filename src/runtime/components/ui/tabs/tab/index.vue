<template>
  <NuxtLink
    v-if="isRoute"
    v-slot="{ href, navigate, isExactActive }"
    :to="to"
    custom
  >
    <a
      ref="el"
      :href="href ?? undefined"
      class="ui-tabs__tab"
      :class="[modifiers, { 'ui-tabs__tab--active': isExactActive }]"
      :aria-current="isExactActive ? 'page' : undefined"
      :aria-disabled="disabled ? 'true' : undefined"
      :aria-describedby="descriptionId"
      @click="onFollow($event, navigate)"
    >
      <TabContent
        :label="label"
        :icon="icon"
        :active-icon="activeIcon"
        :selected="isExactActive"
        :badge="badge"
        :has-label="hasLabel"
      >
        <slot :selected="isExactActive" />
      </TabContent>

      <span
        v-if="descriptionId"
        :id="descriptionId"
        class="ui-tabs__tab-description"
        aria-hidden="true"
      >{{ badgeLabel }}</span>
    </a>
  </NuxtLink>

  <button
    v-else
    :id="ctx.tabId(value)"
    ref="el"
    type="button"
    class="ui-tabs__tab"
    :class="[modifiers, { 'ui-tabs__tab--active': isSelected }]"
    :role="ctx.routes ? undefined : 'tab'"
    :aria-selected="ctx.routes ? undefined : isSelected"
    :aria-controls="!ctx.routes && ctx.hasPanels() ? ctx.panelId(value) : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-describedby="descriptionId"
    :tabindex="ctx.routes ? undefined : (isSelected ? 0 : -1)"
    @click="onSelect"
  >
    <TabContent
      :label="label"
      :icon="icon"
      :active-icon="activeIcon"
      :selected="isSelected"
      :badge="badge"
      :has-label="hasLabel"
    >
      <slot :selected="isSelected" />
    </TabContent>

    <span
      v-if="descriptionId"
      :id="descriptionId"
      class="ui-tabs__tab-description"
      aria-hidden="true"
    >{{ badgeLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onScopeDispose, useSlots, useTemplateRef, watchEffect } from 'vue'
import { useTabsContext } from '#kit/composables/tabs/useTabs'
import { useButtonNameWarning } from '#kit/utils/button/useButtonNameWarning'
import TabContent from '#kit/components/fragments/tabs/tab-content/index.vue'
import type { MTabProps, MTabSlots } from './props'

const props = withDefaults(defineProps<MTabProps>(), { disabled: false, badge: undefined, activeIcon: undefined })
defineSlots<MTabSlots>()
const slots = useSlots()

const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

const ctx = useTabsContext()
const el = useTemplateRef<HTMLElement>('el')

// The parent decided in its own render whether its tabs are routes; a tab
// without one there is a plain button, not a tab.
const isRoute = computed(() => ctx.routes && props.to !== undefined)
const hasLabel = computed(() => Boolean(props.label || slots.default))
const hasBadge = computed(() => props.badge === true || typeof props.badge === 'number')

const modifiers = computed(() => [
  `ui-tabs__tab--${ctx.hierarchy}`,
  `ui-tabs__tab--icon-${ctx.iconPlacement}`,
  {
    'ui-tabs__tab--stacked': Boolean(props.icon) && hasLabel.value && ctx.iconPlacement === 'top',
    'ui-tabs__tab--disabled': props.disabled,
  },
])

const descriptionId = computed(() => (hasBadge.value && props.badgeLabel ? `${ctx.tabId(props.value)}-badge` : undefined))

// Route tabs are selected by the route: they never join the model's selection.
const ticket = ctx.routes
  ? null
  : ctx.register({ value: props.value, disabled: () => props.disabled })
const isSelected = computed(() => ticket?.isSelected.value ?? false)

if (ticket) {
  onScopeDispose(() => ctx.unregister(ticket.id))
  onScopeDispose(ctx.registerElement(props.value, () => el.value))
}

function onSelect(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }

  ticket?.select()
}

// `navigate` follows only an event nobody prevented, so a disabled link is
// stopped here and an enabled one is handed over untouched.
function onFollow(event: MouseEvent, navigate: (event?: MouseEvent) => unknown) {
  if (props.disabled) {
    event.preventDefault()
    return
  }

  navigate(event)
}

useButtonNameWarning('m-tab', () => (hasLabel.value ? 'labelled' : undefined), '`label` or `aria-label`')

if (import.meta.dev) {
  watchEffect(() => {
    if (hasBadge.value && !props.badgeLabel) {
      console.warn('[m-tab] a badge without `badgeLabel` is drawn but never announced: pass what it means.')
    }
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/tabs/index' as t;
@use '#kit/assets/stylesheet/components/badge/index' as badge;

.ui-tabs__tab {
  $t: material-map(t.$tokens, 'md-tabs');

  position: relative;
  display: flex;
  justify-content: center;
  padding-inline: g($t, 'tab.padding.inline');
  min-height: g($t, 'tab.height.base');
  flex: 1 1 0;
  border: none;
  background-color: transparent;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  transition: color g($t, 'motion.color.duration') g($t, 'motion.color.easing');

  // The content box spans the tab's height and is as wide as its content: the
  // per-tab indicator under it, and the anchor of the row's one, take its width.
  &-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: g($t, 'tab.gap.start');
  }

  &--primary &-content {
    min-inline-size: g($t, 'primary.indicator.min-width');
  }

  &--icon-top &-content {
    flex-direction: column;
    gap: g($t, 'tab.gap.top');
  }

  &--stacked {
    min-height: g($t, 'tab.height.stacked');
  }

  @include typescale(g($t, 'tab.typography'));

  // Tabs sit edge to edge in a scroll strip that clips: the ring goes inside.
  &:focus-visible {
    @include focus-ring(inset);
  }

  &-icon {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: g($t, 'tab.icon.size');
  }

  &-label {
    white-space: nowrap;
  }

  &-icon &-badge {
    @include badge.badge-anchor(large);

    &--dot {
      @include badge.badge-anchor(small);
    }
  }

  &-badge--inline {
    margin-inline-start: g($t, 'badge.gap');
  }

  &-description {
    @include sr-only;
  }

  // State layer over the whole tab, in the colour of the content it covers.
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: currentcolor;
    opacity: 0;
    transition: opacity g($t, 'motion.color.duration') g($t, 'motion.color.easing');
  }

  @each $hierarchy in (primary, secondary) {
    &--#{$hierarchy} {
      color: g($t, '#{$hierarchy}.unselected.content.color');

      @include can-hover {
        &:hover {
          color: g($t, '#{$hierarchy}.unselected.content.active.color');
        }
      }

      &:focus-visible,
      &:active {
        color: g($t, '#{$hierarchy}.unselected.content.active.color');
      }
    }

    &--#{$hierarchy}#{&}--active {
      color: g($t, '#{$hierarchy}.selected.content.color');
    }
  }

  @include can-hover {
    &:hover::before {
      opacity: g($t, 'state.hover');
    }
  }

  &:focus-visible::before {
    opacity: g($t, 'state.focus');
  }

  &:active::before {
    opacity: g($t, 'state.pressed');
  }

  &--disabled,
  &--disabled:focus-visible,
  &--disabled:active {
    cursor: default;
    color: g($t, 'disabled.color');
  }

  @include can-hover {
    &--disabled:hover {
      color: g($t, 'disabled.color');
    }

    &--disabled:hover::before {
      opacity: 0;
    }
  }

  &--disabled:active::before,
  &--disabled:focus-visible::before {
    opacity: 0;
  }

  // Indicator of one tab: under the content (primary) or across the tab
  // (secondary). The row's anchored indicator replaces it where supported.
  &--primary &-content::after,
  &--secondary::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    opacity: 0;
    transition: opacity g($t, 'motion.color.duration') g($t, 'motion.color.easing');
  }

  &--primary &-content::after {
    block-size: g($t, 'primary.indicator.height');
    border-radius: g($t, 'primary.indicator.shape');
    background-color: g($t, 'primary.selected.container.color');
  }

  &--secondary::after {
    block-size: g($t, 'secondary.indicator.height');
    border-radius: g($t, 'secondary.indicator.shape');
    background-color: g($t, 'secondary.selected.container.color');
  }

  &--primary#{&}--active &-content::after,
  &--secondary#{&}--active::after {
    opacity: 1;
  }

  // The row's indicator hangs on the selected tab's content (primary) or on
  // the tab itself (secondary).
  @supports (position-anchor: --a) {
    &--primary#{&}--active &-content,
    &--secondary#{&}--active {
      anchor-name: --ui-tabs-active;
    }

    &--primary &-content::after,
    &--secondary::after {
      display: none;
    }
  }

  // The active indicator is only a fill; forced colors would erase it.
  @include forced-colors {
    &--primary &-content::after,
    &--secondary::after {
      background-color: Highlight;
    }

    &--disabled {
      color: GrayText;
    }
  }
}

// The row in `fixed` shares its width equally and lets a long label keep its
// size (the row scrolls); `scrollable` sizes every tab by its content.
.ui-tabs__list--scrollable .ui-tabs__tab {
  $t: material-map(t.$tokens, 'md-tabs');

  flex: 0 0 auto;
  min-width: g($t, 'tab.scrollable.min-width');
}

// The selected tab is in view from the first paint of a scrolled row.
.ui-tabs__tab--active {
  scroll-initial-target: nearest;
}
</style>
