<template>
  <MButton
    v-if="isLink"
    class="ui-breadcrumbs__link"
    variant="text"
    tag="link"
    :to="item.to"
  >
    <slot v-bind="slotProps">
      {{ item.title }}
    </slot>
  </MButton>

  <span
    v-else
    class="ui-breadcrumbs__text"
    :class="{
      'ui-breadcrumbs__text--current': current,
      'ui-breadcrumbs__text--disabled': disabled,
    }"
    :aria-current="current ? 'page' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <slot v-bind="slotProps">{{ item.title }}</slot>
  </span>
</template>

<script setup lang="ts">
/**
 * Private leaf of `<MBreadcrumbs>` making the one authoritative decision per
 * crumb: navigation link, current-page text, or disabled text.
 *
 * Active crumbs delegate to the canonical `MButton` text-link so NuxtLink
 * resolution and interaction states stay centralized. Current and disabled
 * crumbs are never links with prevented clicks — they are plain text, so they
 * simply do not enter the tab order.
 */
import type { PropType } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import type { MBreadcrumbItem, MBreadcrumbsItemSlot } from '#kit/components/ui/breadcrumbs/props'

const props = defineProps({
  /** The normalized crumb. Never mutated by the leaf. */
  item: { type: Object as PropType<Readonly<MBreadcrumbItem>>, required: true },
  /** Position within the ordered list. */
  index: { type: Number, required: true },
  /** Resolved by the parent; not derived from the crumb alone. */
  current: { type: Boolean, required: true },
})

const disabled = computed(() => Boolean(props.item.disabled))
// A current crumb stays text even when `to` is present.
const isLink = computed(() => !props.current && !disabled.value && props.item.to !== undefined)

const slotProps = computed<MBreadcrumbsItemSlot>(() => ({
  item: props.item,
  index: props.index,
  current: props.current,
  disabled: disabled.value,
}))

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.item.title) console.warn('[m-breadcrumbs] item title must not be empty')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/breadcrumbs/index' as t;

.ui-breadcrumbs {
  $t: material-map(t.$tokens, 'md-breadcrumbs');

  // Compounded with `.ui-button` to adapt the reused text-link geometry
  // without duplicating its state layers.
  &__link.ui-button {
    min-height: g($t, 'item-height');
    padding-inline: g($t, 'item-padding-inline');
    border-radius: g($t, 'item-shape');
    color: g($t, 'item-color');

    @include apply-typography(g($t, 'item-typography'));
  }

  &__text {
    display: inline-flex;
    align-items: center;
    min-height: g($t, 'item-height');
    padding-inline: g($t, 'item-padding-inline');
    color: g($t, 'item-color');
    white-space: nowrap;

    @include apply-typography(g($t, 'item-typography'));

    &--current { color: g($t, 'item-current-color'); }
    &--disabled { color: g($t, 'item-disabled-color'); }
  }
}
</style>
