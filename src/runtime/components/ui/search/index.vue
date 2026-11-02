<template>
  <div
    v-bind="rootAttrs()"
    class="ui-search"
    :class="[`ui-search--${density}`, {
      'ui-search--open': open,
      'ui-search--inline': view === 'inline',
      'ui-search--keyboard': control.keyboardFocus.value,
      'ui-search--disabled': disabled,
      'ui-search--text-end': !closesWithTarget,
    }]"
  >
    <div
      ref="bar"
      class="ui-search__bar"
      @pointerdown="onBarPointerdown"
    >
      <span class="ui-search__leading">
        <slot name="leading">
          <MIcon
            :name="ICONS.search"
            aria-hidden="true"
          />
        </slot>
      </span>

      <input
        v-bind="mergeProps(controlAttrs(), control.inputAttrs.value)"
        ref="input"
        class="ui-search__input"
        type="search"
        enterkeyhint="search"
        :autocomplete="hasView ? 'off' : undefined"
        :value="query"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        :disabled="disabled"
      >

      <!-- Arrives with the first character, when the hint leaves: nothing that
           was on screen moves. -->
      <MButtonIcon
        v-if="canClear"
        type="button"
        class="ui-search__clear"
        :density="density === 'compact' ? 'compact' : 'default'"
        :aria-label="messages?.clear"
        @mousedown.prevent
        @click="onClear"
      >
        <slot name="clear">
          <MIcon :name="ICONS.close" />
        </slot>
      </MButtonIcon>

      <span
        v-if="$slots.trailing"
        class="ui-search__trailing"
      >
        <slot name="trailing" />
      </span>

      <span
        v-if="$slots.avatar"
        class="ui-search__avatar"
      >
        <slot name="avatar" />
      </span>
    </div>

    <component
      :is="view === 'docked' ? MMenu : InlineHost"
      v-if="hasView"
      v-bind="hostAttrs"
    >
      <SearchView
        ref="viewRef"
        :listbox-attrs="control.engine.listboxAttrs.value"
        :density="density"
        :loading="loading"
        :state="control.state.value"
        :inline="view === 'inline'"
        :messages="messages"
        :query="query"
        :clear="onClear"
        @pointer="control.onViewPointer"
        @reorder="control.reorder"
      >
        <slot>
          <template
            v-for="row in shownItems"
            :key="row.key"
          >
            <slot
              name="item"
              :item="row.item"
              :index="row.index"
              :title="row.title"
              :value="row.value"
            >
              <MSearchListItem
                :value="row.value"
                :headline="row.title"
              />
            </slot>
          </template>
        </slot>

        <template
          v-if="$slots.loading"
          #loading
        >
          <slot name="loading" />
        </template>
        <template
          v-if="$slots['no-results']"
          #no-results="scope"
        >
          <slot
            name="no-results"
            v-bind="scope"
          />
        </template>
      </SearchView>
    </component>

    <span
      class="ui-search__status"
      role="status"
    >{{ status }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, mergeProps, ref, useTemplateRef, watchEffect } from 'vue'
import { mSearchProps } from './props'
import type { MSearchEmits, MSearchSlots } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { matchesQuery } from '#kit/utils/dropdown/matchRows'
import { usePanelStatus } from '#kit/utils/dropdown/usePanelStatus'
import { provideSearchContext } from '#kit/utils/search/context'
import { searchItemKey, searchItemTitle, searchItemValue } from '#kit/utils/search/items'
import { useSearchControl } from '#kit/utils/search/useSearchControl'
import { ICONS } from '#kit/shared/constants/icons'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MSearchListItem from './list/item/index.vue'
import SearchView from '#kit/components/fragments/search/View.vue'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mSearchProps)
const emit = defineEmits<MSearchEmits>()
const slots = defineSlots<MSearchSlots>()

const query = defineModel<string>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

const bar = useTemplateRef<HTMLElement>('bar')
const input = useTemplateRef<HTMLInputElement>('input')
const viewRef = ref<{ stateEl: HTMLElement | null } | null>(null)

const hasView = computed(() => Boolean(slots.default) || props.items !== undefined)
const canClear = computed(() => Boolean(query.value) && !props.disabled)
// A target at the end keeps the bar's edge padding; the query running to the
// end gets the text's own.
const closesWithTarget = computed(() => canClear.value || Boolean(slots.trailing || slots.avatar))

const shownItems = computed(() => (props.items ?? []).flatMap((item, index) => {
  const title = searchItemTitle(item, props.itemTitle, index)
  if (!matchesQuery(item, title, query.value, props.filter, 'contains')) return []
  return [{ item, index, title, key: searchItemKey(item, title, index), value: searchItemValue(item, props.itemValue, index) }]
}))

const control = useSearchControl({
  query,
  open,
  inline: () => props.view === 'inline',
  hasView: () => hasView.value,
  disabled: () => props.disabled,
  loading: () => props.loading,
  canSayNoResults: () => Boolean(slots['no-results'] || props.messages?.noResults),
  label: () => props.ariaLabel,
  density: () => props.density,
  onSelect: value => emit('select', value),
  onSubmit: value => emit('submit', value),
  onClear: () => emit('clear'),
})

provideSearchContext(control.context)

// The inline view needs no surface of its own: it renders where it stands.
const InlineHost = defineComponent({ inheritAttrs: false, setup: (_, { slots: hostSlots }) => () => hostSlots.default?.() })

const hostAttrs = computed(() => (props.view === 'docked'
  ? {
      'modelValue': open.value,
      'onUpdate:modelValue': (value: boolean) => { open.value = value },
      'class': 'ui-search__menu',
      'absolute': true,
      'matchWidth': true,
      'anchor': bar.value,
      'onClickOutside': control.engine.closePanel,
    }
  : {}))

const status = usePanelStatus({
  open: () => open.value,
  loading: () => props.loading,
  hasRows: () => control.state.value === 'rows',
  loadingText: () => props.messages?.loading,
  state: () => viewRef.value?.stateEl,
})

function focus() {
  input.value?.focus({ preventScroll: true })
}

function onClear() {
  control.clear()
  // The button leaves under the pointer; the query is where the user goes next.
  focus()
}

// A press on the bar's own surface (the glyph, the padding) is a press on the
// query: it focuses the field as the pointer, so the view opens.
function onBarPointerdown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (props.disabled || target === input.value || target.closest('button, a, [role="button"]')) return
  event.preventDefault()
  control.markPointer()
  focus()
}

// The kit ships no default name: it would be English in a kit with no i18n.
// An unnamed field or an unnamed clear button is worse, so say it in dev.
if (import.meta.dev) {
  watchEffect(() => {
    const attrs = controlAttrs()
    if (!props.ariaLabel && !attrs['aria-label'] && !attrs['aria-labelledby']) {
      console.warn('[m-search] has no accessible name: pass `aria-label` or `aria-labelledby` — a placeholder is not a name.')
    }
    if (canClear.value && !props.messages?.clear) {
      console.warn('[m-search] the clear button has no accessible name: pass `messages.clear`.')
    }
  })
}

defineExpose({ focus, clear: onClear, open: control.engine.openPanel, close: control.engine.closePanel })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/search' as t;

.ui-search {
  $t: t.$tokens;

  position: relative;
  width: 100%;
  max-width: g($t, 'container.max-width');

  &__bar {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    gap: g($t, 'container.gap');
    background-color: g($t, 'container.color');
    color: g($t, 'input.color');
    cursor: text;

    // MD3 state layer: the content's ink over the container, under the parts.
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background-color: g($t, 'layer.color');
      opacity: 0;
      pointer-events: none;
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }
  }

  &__leading,
  &__trailing,
  &__avatar {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    font-size: g($t, 'icon.size');
  }

  &__leading {
    color: g($t, 'icon.leading.color');
  }

  &__trailing {
    gap: g($t, 'container.gap');
    color: g($t, 'icon.color');
  }

  &__clear {
    flex: 0 0 auto;
  }

  @each $step in compact, default, comfortable {
    &--#{$step} &__bar {
      min-height: g($t, 'density.#{$step}.height');
      padding-inline: g($t, 'density.#{$step}.padding');
      border-radius: g($t, 'density.#{$step}.round');
    }

    &--#{$step} &__leading,
    &--#{$step} &__avatar {
      min-width: g($t, 'density.#{$step}.target');
      min-height: g($t, 'density.#{$step}.target');
    }
  }

  // Nothing closes the bar: the query runs to the text's own edge.
  &--text-end &__bar {
    padding-inline-end: g($t, 'container.text-end');
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: none;
    outline: none;
    background: transparent;
    color: g($t, 'input.color');
    caret-color: g($t, 'input.caret.color');

    @include typescale(g($t, 'input.typography'));

    &::placeholder {
      color: g($t, 'input.placeholder.color');
      opacity: 1;
    }

    &::-webkit-search-cancel-button,
    &::-webkit-search-decoration {
      appearance: none;
    }

    // Autofill paints an !important background of its own, light even in a
    // dark theme; clipped to the glyphs, the bar's container shows through.
    &:autofill {
      // Safari clips to text only under the prefix.
      /* stylelint-disable-next-line property-no-vendor-prefix */
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: g($t, 'input.color');
    }
  }

  @include can-hover {
    &:not(.ui-search--disabled) &__bar:hover::before {
      opacity: g($t, 'layer.hover');
    }

    // One layer at a time: over a nested button its own layer is the one.
    // Without `:has()` the two stack, as they did before.
    &:not(.ui-search--disabled) &__bar:has(.ui-button:hover)::before {
      opacity: 0;
    }
  }

  // A control, not a form field: keyboard focus is the ring every other control
  // wears. A pointer press opens the view instead.
  &--keyboard &__bar {
    @include focus-ring;
  }

  // Docked and open, the bar is the header of one surface with the panel: its
  // lower corners square off with the panel's arrival — a static state, not a
  // morph — and both cast the view's shadow.
  &--open:not(.ui-search--inline) &__bar {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    box-shadow: g($t, 'view.shadow');
  }

  // Inline, the view shows only with something in it — known from the server's
  // markup, so the first frame is already right.
  &--inline:not(:has(.ui-search-list-item, .ui-search-view__message, .ui-search-view__progress)) .ui-search-view {
    display: none;
  }

  &--inline:has(.ui-search-list-item, .ui-search-view__message, .ui-search-view__progress) &__bar {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  @supports not selector(:has(*)) {
    &--inline:not(.ui-search--open) .ui-search-view {
      display: none;
    }

    &--inline.ui-search--open &__bar {
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }
  }

  &--disabled {
    color: g($t, 'disabled.content');

    .ui-search__bar {
      cursor: default;
    }

    .ui-search__leading,
    .ui-search__trailing,
    .ui-search__input,
    .ui-search__input::placeholder {
      color: g($t, 'disabled.content');
    }
  }

  &__status {
    @include sr-only;
  }

  // The container is drawn by its fill alone, which forced colours drop. The
  // edge is for rest only: a bar under keyboard focus keeps the ring's width.
  @include forced-colors {
    &:not(.ui-search--keyboard) &__bar {
      outline: 1px solid CanvasText;
    }

    &--keyboard &__bar {
      outline-color: Highlight;
    }

    &--disabled &__bar {
      outline-color: GrayText;
    }
  }
}

// The docked panel lives in the overlay host, outside `.ui-search`: the menu's
// class carries the override, two classes above the menu's own surface rules.
.ui-search__menu.ui-menu .ui-menu__surface {
  $t: t.$tokens;

  border-radius: 0 0 g($t, 'view.shape') g($t, 'view.shape');
  background-color: g($t, 'container.color');
  box-shadow: g($t, 'view.shadow');
  clip-path: g($t, 'view.clip');
}
</style>
