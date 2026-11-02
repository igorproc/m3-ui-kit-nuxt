<template>
  <nav
    ref="root"
    class="ui-pagination"
    :aria-label="ariaLabel"
  >
    <ol class="ui-pagination__list">
      <li
        v-if="showFirstLast"
        class="ui-pagination__item"
      >
        <slot
          name="first"
          v-bind="firstSlot"
        >
          <MButtonIcon
            :aria-label="firstLabel"
            :soft-disabled="firstSlot.disabled"
            @click="goTo(1)"
          >
            <MIcon
              name="round-first-page"
              mirror
            />
          </MButtonIcon>
        </slot>
      </li>

      <li
        v-if="showPrevNext"
        class="ui-pagination__item"
      >
        <slot
          name="previous"
          v-bind="previousSlot"
        >
          <MButtonIcon
            :aria-label="previousLabel"
            :soft-disabled="previousSlot.disabled"
            @click="goTo(model - 1)"
          >
            <MIcon
              name="round-chevron-left"
              mirror
            />
          </MButtonIcon>
        </slot>
      </li>

      <li
        v-for="item in range"
        :key="item.type === 'page' ? `p${item.page}` : `e${item.key}`"
        class="ui-pagination__item"
      >
        <span
          v-if="item.type === 'ellipsis'"
          class="ui-pagination__ellipsis"
          aria-hidden="true"
        >
          <slot name="ellipsis">…</slot>
        </span>

        <slot
          v-else
          name="item"
          v-bind="pageSlot(item.page)"
        >
          <MButton
            class="ui-pagination__page"
            :variant="item.page === model ? 'tonal' : 'text'"
            :soft-disabled="disabled"
            :aria-label="pageLabel?.(item.page, item.page === model)"
            :aria-current="item.page === model ? 'page' : undefined"
            @click="goTo(item.page)"
          >
            <span class="ui-pagination__digits">
              <span
                class="ui-pagination__number"
                :class="{ 'ui-pagination__number--current': item.page === model }"
              >{{ item.page }}</span>
              <span
                class="ui-pagination__reserve"
                aria-hidden="true"
              >{{ item.page }}</span>
            </span>
          </MButton>
        </slot>
      </li>

      <li
        v-if="showPrevNext"
        class="ui-pagination__item"
      >
        <slot
          name="next"
          v-bind="nextSlot"
        >
          <MButtonIcon
            :aria-label="nextLabel"
            :soft-disabled="nextSlot.disabled"
            @click="goTo(model + 1)"
          >
            <MIcon
              name="round-chevron-right"
              mirror
            />
          </MButtonIcon>
        </slot>
      </li>

      <li
        v-if="showFirstLast"
        class="ui-pagination__item"
      >
        <slot
          name="last"
          v-bind="lastSlot"
        >
          <MButtonIcon
            :aria-label="lastLabel"
            :soft-disabled="lastSlot.disabled"
            @click="goTo(safeLength)"
          >
            <MIcon
              name="round-last-page"
              mirror
            />
          </MButtonIcon>
        </slot>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed, onBeforeUpdate, onUpdated, useAttrs, useSlots, useTemplateRef, watch, watchEffect } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { createPaginationRange, normalizePage } from '#kit/shared/utils/pagination'
import type { PaginationControlSlot, PaginationItemSlot } from './props'
import { mPaginationProps } from './props'

const props = defineProps(mPaginationProps)
const model = defineModel<number>({ default: 1 })
const slots = useSlots()
const attrs = useAttrs()

const safeLength = computed(() => Math.max(0, Math.floor(props.length)))
const range = computed(() => createPaginationRange(model.value, safeLength.value, props.totalVisible))

function goTo(page: number) {
  if (props.disabled) return
  const next = normalizePage(page, safeLength.value)
  if (next !== model.value) model.value = next
}

// Keys are the attribute names themselves: a camelCase key in a spread bag
// renders as `arialabel` in the server HTML. A control that cannot act keeps
// its Tab stop (`aria-disabled`): a native `disabled` on the focused button
// would drop focus to <body> for as long as a page request runs.
function pageSlot(page: number): PaginationItemSlot {
  const current = page === model.value
  return {
    page,
    current,
    disabled: props.disabled,
    props: {
      'type': 'button',
      'aria-label': props.pageLabel?.(page, current),
      'aria-current': current ? 'page' : undefined,
      'aria-disabled': props.disabled ? 'true' : undefined,
      'onClick': () => goTo(page),
    },
  }
}

function controlSlot(page: number, label: string | undefined, atBoundary: boolean): PaginationControlSlot {
  const disabled = props.disabled || atBoundary
  return {
    page,
    disabled,
    props: {
      'type': 'button',
      'aria-label': label,
      'aria-disabled': disabled ? 'true' : undefined,
      'onClick': () => goTo(page),
    },
  }
}

const firstSlot = computed(() => controlSlot(1, props.firstLabel, model.value <= 1))
const previousSlot = computed(() => controlSlot(model.value - 1, props.previousLabel, model.value <= 1))
const nextSlot = computed(() => controlSlot(model.value + 1, props.nextLabel, model.value >= safeLength.value))
const lastSlot = computed(() => controlSlot(safeLength.value, props.lastLabel, model.value >= safeLength.value))

// A focused page button can leave the window (the page count shrank under it):
// focus then goes to the current page instead of falling to <body>. Renders
// batched into one flush share a single `onUpdated`, and the current page may
// only appear once the model is normalized, so the flags outlive one render.
const root = useTemplateRef<HTMLElement>('root')
let hadFocus = false
let focusPending = false

onBeforeUpdate(() => {
  if (root.value?.contains(document.activeElement)) hadFocus = true
})

onUpdated(() => {
  const lost = hadFocus && !root.value?.contains(document.activeElement)
  hadFocus = false
  if (!lost && !focusPending) return

  // Only a focus that fell to <body> is ours to restore: one the user moved
  // elsewhere stays where it is.
  const active = document.activeElement
  if (active && active !== document.body) {
    focusPending = false
    return
  }

  const currentPage = root.value?.querySelector<HTMLElement>('[aria-current="page"]')
  focusPending = !currentPage
  currentPage?.focus()
})

// Keep the model valid when length shrinks, so the visible selection and the
// consumer's query/application state cannot diverge.
watch([safeLength, model], () => {
  const next = normalizePage(model.value, safeLength.value)
  if (next !== model.value) model.value = next
}, { immediate: true })

const CONTROL_NAMES = [
  ['showFirstLast', 'first', 'firstLabel'],
  ['showPrevNext', 'previous', 'previousLabel'],
  ['showPrevNext', 'next', 'nextLabel'],
  ['showFirstLast', 'last', 'lastLabel'],
] as const

// Icon controls drawn by the kit and left without a name, by their prop.
function unnamedControls(): string[] {
  return CONTROL_NAMES
    .filter(([shown, slot, label]) => props[shown] && !slots[slot] && !props[label])
    .map(([, , label]) => `\`${label}\``)
}

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.ariaLabel && !attrs['aria-labelledby']) {
      console.warn('[m-pagination] the navigation has no accessible name: pass `ariaLabel` (or aria-labelledby).')
    }
    const unnamed = unnamedControls()
    if (unnamed.length) console.warn(`[m-pagination] icon controls have no accessible name: pass ${unnamed.join(', ')}.`)
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/pagination/index' as t;

.ui-pagination {
  $t: material-map(t.$tokens, 'md-pagination');

  &__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: g($t, 'list.gap');
    margin: 0;
    padding: 0;
    list-style: none;

    // On touch the row opens up to a pitch of 48 (S8); the page buttons grow on
    // the block axis only, so no target takes a neighbour's presses.
    @media (pointer: coarse) {
      gap: g($t, 'list.coarse.gap');
    }
  }

  &__item {
    display: inline-flex;
  }

  // Page buttons reuse the button family; only the square min size is pinned so
  // single digits and the icon controls share one control footprint. Tabular
  // figures keep a sliding window of numbers from changing the row's width.
  // Compounded under the block: MButton's own density padding weighs as much.
  & &__page.ui-button {
    min-width: g($t, 'control.size');
    padding-inline: g($t, 'page.padding.inline');
    font-variant-numeric: tabular-nums;

    @include touch-target(block);
  }

  // The number and a hidden copy in the current page's weight share one grid
  // cell, so every button is as wide as its heavier self and the row does not
  // move when the current page does.
  &__digits {
    display: inline-grid;
  }

  &__number,
  &__reserve {
    grid-area: 1 / 1;
  }

  &__reserve {
    visibility: hidden;
    font-weight: g($t, 'page.current.weight');
  }

  &__number--current {
    font-weight: g($t, 'page.current.weight');
  }

  &__ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'control.size');
    height: g($t, 'control.size');
    color: g($t, 'ellipsis.color');

    @include apply-typography(g($t, 'ellipsis.typography'));
  }

  // Tonal vs text differ only by container colour, which forced colors drop;
  // the weight of the number stays. System colours survive forcing on their
  // own, so the button keeps its forced focus ring. The list ancestor lifts
  // these above the button's own hover and pressed fills, which would
  // otherwise be forced to Canvas.
  @include forced-colors {
    &__list &__page.ui-button[aria-current='page'] {
      background-color: Highlight;
      color: HighlightText;

      &:active { background-color: Highlight; }

      @include can-hover {
        &:hover { background-color: Highlight; }
      }
    }
  }
}
</style>
