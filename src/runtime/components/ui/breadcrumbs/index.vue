<template>
  <nav
    class="ui-breadcrumbs"
    :aria-label="ariaLabel"
  >
    <ol
      class="ui-breadcrumbs__list"
      :class="`ui-breadcrumbs__list--${overflow}`"
    >
      <slot name="prepend" />

      <template
        v-for="(crumb, index) in crumbs"
        :key="crumb.key"
      >
        <li
          class="ui-breadcrumbs__item"
          :class="{ 'ui-breadcrumbs__item--current': crumb.current }"
        >
          <BreadcrumbsItem
            :item="crumb.item"
            :index="index"
            :current="crumb.current"
          >
            <template
              v-if="$slots.item"
              #default="slotProps"
            >
              <slot
                name="item"
                v-bind="slotProps"
              />
            </template>
          </BreadcrumbsItem>
        </li>

        <li
          v-if="index < crumbs.length - 1"
          class="ui-breadcrumbs__divider"
          aria-hidden="true"
        >
          <BreadcrumbsDivider :divider="divider">
            <template
              v-if="$slots.divider"
              #default
            >
              <slot name="divider" />
            </template>
          </BreadcrumbsDivider>
        </li>
      </template>

      <slot name="append" />
    </ol>
  </nav>
</template>

<script setup lang="ts">
import BreadcrumbsItem from '#kit/components/fragments/breadcrumbs/item/index.vue'
import BreadcrumbsDivider from '#kit/components/fragments/breadcrumbs/divider/index.vue'
import { useButtonNameWarning } from '#kit/utils/button/useButtonNameWarning'
import type { MBreadcrumbItem } from './props'
import { mBreadcrumbsProps } from './props'

const props = defineProps(mBreadcrumbsProps)

useButtonNameWarning('m-breadcrumbs', () => props.ariaLabel)

interface NormalizedCrumb {
  key: PropertyKey
  item: Readonly<MBreadcrumbItem>
  current: boolean
}

/** Deterministic on both server and client, so keys never disagree. */
function serializeTo(to: MBreadcrumbItem['to']) {
  if (to === undefined) return undefined
  if (typeof to === 'string') return `to:${to}`
  try {
    return `to:${JSON.stringify(to)}`
  } catch {
    return undefined
  }
}

/**
 * The first explicit `current` wins. Without one, the last non-disabled crumb
 * is current — a disabled trailing crumb must not become the current page.
 */
const currentIndex = computed(() => {
  const explicit = props.items.findIndex(item => item.current)
  if (explicit !== -1) return explicit

  for (let index = props.items.length - 1; index >= 0; index -= 1) {
    if (!props.items[index]?.disabled) return index
  }
  return -1
})

const crumbs = computed<NormalizedCrumb[]>(() =>
  props.items.map((item, index) => ({
    key: item.id ?? serializeTo(item.to) ?? index,
    item,
    current: index === currentIndex.value,
  })),
)

if (import.meta.dev) {
  watchEffect(() => {
    if (props.items.filter(item => item.current).length > 1) {
      console.warn('[m-breadcrumbs] multiple items marked current; only the first is honored')
    }
    if (props.items.some(item => item.id === undefined && serializeTo(item.to) === undefined)) {
      console.warn('[m-breadcrumbs] item without id or to falls back to an index key')
    }
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/breadcrumbs/index' as t;

$t: material-map(t.$tokens, 'md-breadcrumbs');
$fade: g($t, 'list.scroll.fade.size');
$fade-offset: g($t, 'list.scroll.fade.offset');

.ui-breadcrumbs {
  &__list {
    display: flex;
    align-items: center;
    gap: g($t, 'list.gap');
    margin: 0;
    padding: 0;
    list-style: none;

    // Every crumb stays in the accessibility tree at any width: overflow is
    // native scrolling or wrapping, never `display: none` on middle crumbs.
    &--scroll {
      flex-wrap: nowrap;
      overflow-x: auto;

      // A scroller clips what its crumbs draw past their box. The room for the
      // focus ring is given back by a negative margin, so the trail keeps its
      // height; the inline room stays (a negative margin would push the page
      // sideways).
      padding: g($t, 'list.scroll.inset.block') g($t, 'list.scroll.inset.inline');
      margin-block: g($t, 'list.scroll.margin.block');

      // Focus scrolls a crumb clear of the faded edges.
      scroll-padding-inline: $fade;

      // The room for the 48 target stays in the flow: given back, the
      // scroller's padding would lie over the neighbours and take their taps
      // across its whole width (В1-Б).
      @media (pointer: coarse) {
        padding-block: g($t, 'list.scroll.inset.coarse');
        margin-block: 0;
      }
    }

    &--wrap {
      flex-wrap: wrap;

      @media (pointer: coarse) {
        row-gap: g($t, 'list.wrap.coarse.row-gap');
      }
    }
  }

  &__item,
  &__divider {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  // Wrapping loses nothing: a crumb wider than the row shrinks to it and its
  // name breaks, an unbroken one anywhere.
  &__list--wrap &__item {
    flex-shrink: 1;
    min-width: 0;
  }

  &__list--wrap &__text {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  // A long trail opens scrolled to the current page, set during layout, so the
  // server's first paint already shows it. Unsupported, it opens at the root
  // crumb, as before. Only in a scrolling list: elsewhere the nearest scroller
  // would be the page itself.
  &__list--scroll &__item--current {
    scroll-initial-target: nearest;
  }
}

// The edge that can still scroll fades out. Two mask layers, each a ramp one
// fade wider than the list, slide their ramp in or out by the list's own scroll
// position. Without scrollable overflow the timeline is inactive and both
// ramps rest outside the box; without scroll-driven animations nothing fades.
@supports (animation-timeline: scroll()) {
  .ui-breadcrumbs__list--scroll {
    mask-image:
      linear-gradient(to right, transparent, currentcolor $fade),
      linear-gradient(to left, transparent, currentcolor $fade);
    mask-size: g($t, 'list.scroll.fade.mask.size') 100%;
    mask-repeat: no-repeat;
    mask-composite: intersect;
    mask-position: $fade-offset 0, 0 0;
    animation: ui-breadcrumbs-edge-fade auto var(--sys-motion-easing-linear) both;
    animation-timeline: scroll(self inline);

    // The scroll starts at the right edge: the ramps swap sides.
    &:dir(rtl) {
      mask-image:
        linear-gradient(to left, transparent, currentcolor $fade),
        linear-gradient(to right, transparent, currentcolor $fade);
      mask-position: 0 0, $fade-offset 0;
      animation-name: ui-breadcrumbs-edge-fade-rtl;
    }
  }
}

// Positions of the start ramp, then the end ramp. Hidden is outside the box.
@keyframes ui-breadcrumbs-edge-fade {
  0% { mask-position: $fade-offset 0, $fade-offset 0; }

  1%,
  99% { mask-position: 0 0, $fade-offset 0; }
  100% { mask-position: 0 0, 0 0; }
}

@keyframes ui-breadcrumbs-edge-fade-rtl {
  0% { mask-position: 0 0, 0 0; }

  1%,
  99% { mask-position: $fade-offset 0, 0 0; }
  100% { mask-position: $fade-offset 0, $fade-offset 0; }
}
</style>
