<template>
  <!-- Progress and the state message sit beside the listbox, not in it:
       a listbox may only own options. -->
  <div
    class="ui-dropdown-panel"
    @mousedown.prevent
    @pointermove="emit('pointer')"
  >
    <MProgressLinear
      v-if="loading"
      class="ui-dropdown-panel__progress"
      indeterminate
      :aria-label="messages?.loading"
    />

    <MList
      v-bind="listboxAttrs"
      class="ui-dropdown-panel__list"
      :class="`ui-dropdown-panel__list--${density}`"
      :density="density"
      :style="panelStyle"
    >
      <MListItem
        v-for="(entry, index) in entries"
        :key="entry.key"
        v-bind="getOptionAttrs(entry)"
        class="ui-dropdown-panel__option"
        :class="optionClasses(entry)"
        :interactive="true"
        :selected="entry.selected"
        :disabled="entry.disabled"
        :lines="1"
      >
        <!-- At the end, only on a chosen row: the row text then starts where
             the value does in the field. A multiple panel stays open while rows
             are ticked, so there every row keeps the place — a tick must not
             rewrap its title. -->
        <template
          v-if="multiple || entry.selected"
          #trailing
        >
          <MIcon
            :name="ICONS.check"
            class="ui-dropdown-panel__check"
            :class="{ 'ui-dropdown-panel__check--off': !entry.selected }"
          />
        </template>

        <slot
          name="item"
          :item="entry.item"
          :index="index"
          :value="entry.value"
          :title="entry.title"
          :selected="entry.selected"
          :disabled="entry.disabled"
          :blocked="entry.blocked"
          :active="activeId === entry.id"
        >
          <span class="ui-dropdown-panel__title">{{ entry.title }}</span>
        </slot>
      </MListItem>
    </MList>

    <div ref="stateEl">
      <slot
        v-if="state === 'hint'"
        name="hint"
        :query="query"
        :missing="missing"
      />

      <slot
        v-else-if="state === 'loading'"
        name="loading"
      >
        <p
          v-if="messages?.loading"
          class="ui-dropdown-panel__state"
        >
          {{ messages.loading }}
        </p>
      </slot>

      <slot
        v-else-if="state === 'empty'"
        name="empty"
      >
        <p
          v-if="messages?.empty"
          class="ui-dropdown-panel__state"
        >
          {{ messages.empty }}
        </p>
      </slot>

      <slot
        v-else-if="state === 'no-results'"
        name="no-results"
        :query="query"
        :clear="resetQuery"
      >
        <p
          v-if="messages?.noResults"
          class="ui-dropdown-panel__state"
        >
          {{ messages.noResults }}
        </p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TEntry extends DropdownEntry<unknown, unknown>">
/**
 * The open panel of the selection family — rows, the check mark, progress and
 * the state message — drawn once for `<MDropdown>` and `<MAutocomplete>`.
 * Which state shows is the owner's decision (`state`); the rows and their
 * attribute bags come from the shared control.
 */
import { ref } from 'vue'
import type { StyleValue } from 'vue'
import type { DropdownEntry, DropdownListboxAttrs, DropdownOptionAttrs } from '#kit/composables/dropdown/types'
import type { MDropdownMessages } from '#kit/components/ui/dropdown/props'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'
import type { DropdownPanelState } from '#kit/utils/dropdown/panelState'
import { ICONS } from '#kit/shared/constants/icons'
import MIcon from '#kit/components/ui/icon/index.vue'
import MList from '#kit/components/ui/list/index.vue'
import MListItem from '#kit/components/ui/list/item/index.vue'
import MProgressLinear from '#kit/components/ui/progress/linear/index.vue'

const props = defineProps<{
  entries: TEntry[]
  listboxAttrs: DropdownListboxAttrs
  getOptionAttrs: (entry: TEntry) => DropdownOptionAttrs
  panelStyle?: StyleValue
  activeId?: string
  /** The keyboard drives the virtual focus: the active row wears the ring. */
  keyboard: boolean
  density: MFieldDensity
  multiple: boolean
  loading: boolean
  state: DropdownPanelState
  messages?: MDropdownMessages
  query?: string
  missing?: number
  resetQuery?: () => void
}>()

const emit = defineEmits<{
  /** The pointer moved over the panel: it, not the keyboard, drives now. */
  (event: 'pointer'): void
}>()

const stateEl = ref<HTMLElement | null>(null)

const optionClasses = (entry: TEntry) => {
  const active = props.activeId === entry.id
  return {
    'ui-dropdown-panel__option--active': active,
    'ui-dropdown-panel__option--keyboard': active && props.keyboard,
  }
}

defineExpose({ stateEl })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/dropdown' as t;

.ui-dropdown-panel {
  $t: t.$tokens;

  position: relative;
  isolation: isolate;

  // Progress lies over the panel's top edge instead of pushing the rows down,
  // so a refresh under visible rows does not make them jump. Outranks the bar's
  // own `position: relative`: in a production build its sheet may load later.
  & &__progress {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: 1;
  }

  // Outranks MList's own `padding-block` (the same value today, from another
  // token): in a production build its sheet may load later.
  & &__list {
    --ui-scrollbar-inset-block: #{g($t, 'panel.scrollbar-inset')};

    padding-block: g($t, 'panel.padding-block');
    overflow-y: auto;
    overscroll-behavior: contain;

    // Filtering adds and removes the scrollbar; a stable gutter keeps the
    // rows from changing width under the user's eyes.
    scrollbar-gutter: stable;

    // Each density stops halfway through a row of its own height.
    @each $density in compact, default, comfortable {
      &--#{$density} {
        max-height: var(--m-dropdown-panel-max-height, #{g($t, 'panel.max-height.#{$density}')});
      }
    }
  }

  // The virtual focus draws the row's own state layer — the pointer and the
  // keyboard both move it. `:hover` stays on a row the keyboard has left, so
  // it is switched off on every row but the active one.
  &__option {
    @include can-hover {
      &:not(.ui-dropdown-panel__option--active).ui-list-item:hover::before {
        opacity: 0;
      }
    }

    &--active.ui-list-item::before {
      opacity: g($t, 'row.layer.pointer');
    }

    &--keyboard.ui-list-item {
      @include focus-ring(inset);

      // One class more than the row's own `:hover` layer: the keyboard can
      // land on the row a resting pointer is over.
      &.ui-dropdown-panel__option::before {
        opacity: g($t, 'row.layer.keyboard');
      }

      @include forced-colors {
        outline-color: Highlight;
      }
    }
  }

  &__check--off {
    visibility: hidden;
  }

  // A row wraps rather than truncating — a choice has to be readable — and an
  // unbreakable string (a URL, an e-mail, an SKU) breaks too, instead of
  // widening the panel into a horizontal scroll.
  &__title {
    overflow-wrap: anywhere;
  }

  &__state {
    margin: 0;
    padding: g($t, 'state.padding');
    color: g($t, 'state.color');

    @include typescale(g($t, 'state.typography'));
  }
}
</style>
