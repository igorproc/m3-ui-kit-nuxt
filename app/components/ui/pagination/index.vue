<template>
  <nav
    class="ui-pagination"
    :aria-label="ariaLabel"
  >
    <ol class="ui-pagination__list">
      <li v-if="showFirstLast">
        <slot
          name="first"
          v-bind="firstSlot"
        >
          <MButtonIcon
            :aria-label="firstLabel"
            :disabled="firstSlot.disabled"
            @click="goTo(1)"
          >
            <MIcon name="round-first-page" />
          </MButtonIcon>
        </slot>
      </li>

      <li v-if="showPrevNext">
        <slot
          name="previous"
          v-bind="previousSlot"
        >
          <MButtonIcon
            :aria-label="previousLabel"
            :disabled="previousSlot.disabled"
            @click="goTo(model - 1)"
          >
            <MIcon name="round-chevron-left" />
          </MButtonIcon>
        </slot>
      </li>

      <li
        v-for="item in range"
        :key="item.type === 'page' ? `p${item.page}` : `e${item.key}`"
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
            :disabled="disabled"
            :aria-label="pageLabel(item.page)"
            :aria-current="item.page === model ? 'page' : undefined"
            @click="goTo(item.page)"
          >
            {{ item.page }}
          </MButton>
        </slot>
      </li>

      <li v-if="showPrevNext">
        <slot
          name="next"
          v-bind="nextSlot"
        >
          <MButtonIcon
            :aria-label="nextLabel"
            :disabled="nextSlot.disabled"
            @click="goTo(model + 1)"
          >
            <MIcon name="round-chevron-right" />
          </MButtonIcon>
        </slot>
      </li>

      <li v-if="showFirstLast">
        <slot
          name="last"
          v-bind="lastSlot"
        >
          <MButtonIcon
            :aria-label="lastLabel"
            :disabled="lastSlot.disabled"
            @click="goTo(safeLength)"
          >
            <MIcon name="round-last-page" />
          </MButtonIcon>
        </slot>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import MButton from '~/components/ui/button/index.vue'
import MButtonIcon from '~/components/ui/button/icon/index.vue'
import MIcon from '~/components/ui/icon/index.vue'
import { createPaginationRange, normalizePage } from '~~/shared/utils/pagination'
import type { PaginationControlSlot, PaginationItemSlot } from './props'
import { mPaginationProps } from './props'

const props = defineProps(mPaginationProps)
const model = defineModel<number>({ default: 1 })

const safeLength = computed(() => Math.max(0, Math.floor(props.length)))
const range = computed(() => createPaginationRange(model.value, safeLength.value, props.totalVisible))

function goTo(page: number) {
  if (props.disabled) return
  const next = normalizePage(page, safeLength.value)
  if (next !== model.value) model.value = next
}

function pageLabel(page: number) {
  return page === model.value ? `Page ${page}, current page` : `Go to page ${page}`
}

function pageSlot(page: number): PaginationItemSlot {
  const current = page === model.value
  return {
    page,
    current,
    props: {
      type: 'button',
      ariaLabel: pageLabel(page),
      ariaCurrent: current ? 'page' : undefined,
      disabled: props.disabled,
      onClick: () => goTo(page),
    },
  }
}

function controlSlot(page: number, label: string, atBoundary: boolean): PaginationControlSlot {
  const disabled = props.disabled || atBoundary
  return {
    page,
    disabled,
    props: {
      type: 'button',
      ariaLabel: label,
      disabled,
      onClick: () => goTo(page),
    },
  }
}

const firstSlot = computed(() => controlSlot(1, props.firstLabel, model.value <= 1))
const previousSlot = computed(() => controlSlot(model.value - 1, props.previousLabel, model.value <= 1))
const nextSlot = computed(() => controlSlot(model.value + 1, props.nextLabel, model.value >= safeLength.value))
const lastSlot = computed(() => controlSlot(safeLength.value, props.lastLabel, model.value >= safeLength.value))

// Keep the model valid when length shrinks, so the visible selection and the
// consumer's query/application state cannot diverge.
watch([safeLength, model], () => {
  const next = normalizePage(model.value, safeLength.value)
  if (next !== model.value) model.value = next
}, { immediate: true })
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/pagination/index' as t;

.ui-pagination {
  $t: material-map(t.$tokens, 'md-pagination');

  &__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: g($t, 'list-gap');
    margin: 0;
    padding: 0;
    list-style: none;

    > li {
      display: inline-flex;
    }
  }

  // Page buttons reuse the button family; only the square min size is pinned so
  // single digits and the icon controls share one control footprint.
  &__page.ui-button {
    min-width: g($t, 'control-size');
    padding-inline: 8rem;
  }

  &__ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'control-size');
    height: g($t, 'control-size');
    color: g($t, 'ellipsis-color');

    @include apply-typography(g($t, 'ellipsis-typography'));
  }
}
</style>
