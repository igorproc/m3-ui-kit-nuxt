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
        <li class="ui-breadcrumbs__item">
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
import BreadcrumbsItem from '~/components/fragments/breadcrumbs/item/index.vue'
import BreadcrumbsDivider from '~/components/fragments/breadcrumbs/divider/index.vue'
import type { MBreadcrumbItem } from './props'
import { mBreadcrumbsProps } from './props'

const props = defineProps(mBreadcrumbsProps)

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
@use '~/assets/stylesheet/components/breadcrumbs/index' as t;

.ui-breadcrumbs {
  $t: material-map(t.$tokens, 'md-breadcrumbs');

  &__list {
    display: flex;
    align-items: center;
    gap: g($t, 'list-gap');
    margin: 0;
    padding: 0;
    list-style: none;

    // Every crumb stays in the accessibility tree at any width: overflow is
    // native scrolling or wrapping, never `display: none` on middle crumbs.
    &--scroll {
      flex-wrap: nowrap;
      overflow-x: auto;
    }

    &--wrap { flex-wrap: wrap; }
  }

  &__item,
  &__divider {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }
}
</style>
