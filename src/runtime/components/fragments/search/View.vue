<template>
  <!-- Progress and the message sit beside the listbox, not in it: a listbox
       may only own options and their groups. -->
  <div
    class="ui-search-view"
    :class="[`ui-search-view--${density}`, { 'ui-search-view--inline': inline }]"
    @mousedown.prevent
    @pointermove="emit('pointer')"
  >
    <MProgressLinear
      v-if="loading"
      class="ui-search-view__progress"
      indeterminate
      :aria-label="messages?.loading"
    />

    <MList
      v-bind="listboxAttrs"
      ref="list"
      class="ui-search-view__list"
      :density="density"
    >
      <slot />
    </MList>

    <div ref="stateEl">
      <slot
        v-if="state === 'loading'"
        name="loading"
      >
        <p
          v-if="messages?.loading"
          class="ui-search-view__message"
        >
          {{ messages.loading }}
        </p>
      </slot>

      <slot
        v-else-if="state === 'no-results'"
        name="no-results"
        :query="query"
        :clear="clear"
      >
        <p
          v-if="messages?.noResults"
          class="ui-search-view__message"
        >
          {{ messages.noResults }}
        </p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The view of `<MSearch>` — progress, the listbox holding the app's rows, and
 * the message shown instead of rows — drawn once for the docked panel and the
 * inline view. It also tells the owner when the rows move in the document, so
 * the keyboard keeps their visible order.
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { DropdownListboxAttrs } from '#kit/composables/dropdown/types'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'
import type { MSearchMessages } from '#kit/components/ui/search/props'
import type { SearchViewState } from '#kit/utils/search/useSearchControl'
import MList from '#kit/components/ui/list/index.vue'
import MProgressLinear from '#kit/components/ui/progress/linear/index.vue'

defineProps<{
  listboxAttrs: DropdownListboxAttrs
  density: MFieldDensity
  loading: boolean
  state: SearchViewState
  inline: boolean
  messages?: MSearchMessages
  query: string
  clear: () => void
}>()

const emit = defineEmits<{
  /**
   * `pointer` — the pointer moved over the view: it, not the keyboard, drives now.
   * `reorder` — rows were added, removed or moved.
   */
  (event: 'pointer' | 'reorder'): void
}>()

const stateEl = ref<HTMLElement | null>(null)
const list = useTemplateRef<ComponentPublicInstance>('list')

let observer: MutationObserver | undefined
onMounted(() => {
  const root = list.value?.$el
  if (!(root instanceof HTMLElement)) return
  observer = new MutationObserver(() => emit('reorder'))
  observer.observe(root, { childList: true, subtree: true })
})
onBeforeUnmount(() => observer?.disconnect())

defineExpose({ stateEl })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/search' as t;

.ui-search-view {
  $t: t.$tokens;

  position: relative;
  isolation: isolate;
  border-block-start: g($t, 'view.divider.width') solid g($t, 'view.divider.color');

  // Progress lies over the divider instead of pushing the rows down, so a
  // refresh under visible rows does not make them jump. Outranks the bar's own
  // `position: relative`: in a production build its sheet may load later.
  & &__progress {
    position: absolute;
    inset-block-start: calc(-1 * #{g($t, 'view.divider.width')});
    inset-inline: 0;
    z-index: 1;
  }

  // Outranks MList's own `padding-block`: in a production build its sheet may
  // load later.
  & &__list {
    padding-block: g($t, 'view.padding-block');
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  // Docked, each density stops halfway through a row of its own height, as the
  // dropdown's panel does. Inline, the page around the view scrolls.
  @each $density in compact, default, comfortable {
    &--#{$density}:not(.ui-search-view--inline) &__list {
      max-height: g($t, 'view.max-height.#{$density}');
    }
  }

  &--inline {
    background-color: g($t, 'container.color');
    border-end-start-radius: g($t, 'view.shape');
    border-end-end-radius: g($t, 'view.shape');
  }

  &__message {
    margin: 0;
    padding: g($t, 'message.padding');
    color: g($t, 'message.color');

    @include typescale(g($t, 'message.typography'));
  }
}
</style>
