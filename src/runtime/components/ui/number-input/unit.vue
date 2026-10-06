<template>
  <span
    v-if="!options.length"
    class="ui-number-input__unit"
  >
    <span class="ui-number-input__unit-text">
      <slot>{{ modelValue }}</slot>
    </span>
  </span>

  <span
    v-else
    class="ui-number-input__unit ui-number-input__unit--menu"
  >
    <button
      ref="trigger"
      v-ripple="!inactive"
      type="button"
      class="ui-number-input__unit-trigger"
      :disabled="inactive"
      :aria-labelledby="`${id}-label ${id}-value`"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span
        :id="`${id}-label`"
        class="ui-number-input__unit-label"
      >{{ label }}</span>

      <span
        :id="`${id}-value`"
        class="ui-number-input__unit-text"
      >
        <slot>{{ current }}</slot>
      </span>

      <MIcon
        :name="ICONS.keyboardArrowDown"
        class="ui-number-input__unit-caret"
      />
    </button>

    <MMenu
      v-model="isOpen"
      absolute
      :origin="origin"
      class="ui-number-input__unit-menu"
      @click-outside="isOpen = false"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="menuitemradio"
        :aria-checked="option.value === modelValue"
        class="ui-menu__item ui-number-input__unit-option"
        @click="select(option.value)"
      >
        {{ option.label }}
      </button>
    </MMenu>
  </span>
</template>

<script setup lang="ts">
/**
 * The unit zone of a `<MNumberInput>` — a suffix that belongs to the container
 * rather than sitting beside it, so the pair keeps one border and one label.
 *
 * With `units` it becomes a menu bound to `v-model`. Picking an entry
 * **relabels only**: the number is left exactly as it is. Converting 512 MiB
 * into 0.5 GiB needs a scale this component does not have, and rescaling a
 * value the user typed without being asked is worse than not converting.
 */
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import MMenu from '#kit/components/ui/menu/index.vue'
import type { UiMenuOrigin } from '#kit/components/ui/menu/types'
import { MESSAGES } from '#kit/shared/constants/messages'
import type { MNumberInputUnit } from './props'

type Props = Partial<{
  /** Choices for the menu. Empty renders a static suffix instead. */
  units: MNumberInputUnit[]
  /**
   * Leads the trigger's accessible name; the visible unit follows it, so the
   * name still contains what is on screen ("Change unit MiB").
   */
  label: string
  disabled: boolean
  readonly: boolean
}>

const props = withDefaults(defineProps<Props>(), {
  units: () => [],
  label: MESSAGES.numberUnit,
  disabled: false,
  readonly: false,
})

const modelValue = defineModel<string | null>({ default: null })

const id = useId()
const trigger = shallowRef<HTMLElement | null>(null)
const isOpen = ref(false)
const origin = ref<UiMenuOrigin>('top right')

const inactive = computed(() => props.disabled || props.readonly)
const options = computed(() => props.units.map(unit => (typeof unit === 'string'
  ? { value: unit, label: unit }
  : { value: unit.value, label: unit.label ?? unit.value })))

const current = computed(() => options.value.find(option => option.value === modelValue.value)?.label
  ?? modelValue.value
  ?? options.value[0]?.label)

// The unit sits at the inline end, so the menu hangs from that edge. Placement
// is physical, so the side is read from the trigger's direction at open time.
const toggle = () => {
  if (!isOpen.value && trigger.value) {
    origin.value = getComputedStyle(trigger.value).direction === 'rtl' ? 'top left' : 'top right'
  }

  isOpen.value = !isOpen.value
}

const select = (value: string) => {
  modelValue.value = value
  isOpen.value = false
}

watch(inactive, (value) => {
  if (!value) {
    return
  }

  isOpen.value = false
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/number-input' as t;

$t: material-map(t.$tokens, 'm-number-input');

.ui-number-input__unit {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  align-self: center;
  min-width: 0;
  max-width: g($t, 'unit.max-width');
  padding-inline: g($t, 'unit.padding.inline');
  color: g($t, 'unit.color');
  font-variant-numeric: tabular-nums;

  @include typescale(g($t, 'typography.unit'));

  &--menu {
    padding-inline: 0;
  }

  &-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-label {
    @include sr-only;
  }

  &-trigger {
    position: relative;
    display: flex;
    align-items: center;
    gap: g($t, 'unit.gap');
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    padding: g($t, 'unit.padding.block') g($t, 'unit.padding.inline');
    border: none;

    // Set by `<MNumberInput>` from its `rounded` axis, one tier rounder.
    border-radius: var(--ui-number-input-zone-radius);
    background-color: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;

    &::after {
      position: absolute;
      inset: 0;
      background-color: currentcolor;
      content: '';
      opacity: 0;
      pointer-events: none;
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }

    @include can-hover {
      &:hover:not(:disabled)::after {
        opacity: g($t, 'layer.hover');
      }
    }

    &[aria-expanded='true']::after {
      opacity: g($t, 'layer.hover');
    }

    &:active:not(:disabled)::after {
      opacity: g($t, 'layer.pressed');
    }

    // Inset: the container clips anything drawn outside the trigger.
    &:focus-visible {
      @include focus-ring(inset);
    }

    &:disabled {
      color: g($t, 'disabled.color');
      cursor: default;
    }
  }

  &-caret {
    flex: 0 0 auto;
    font-size: g($t, 'unit.caret.size');
    transition: transform g($t, 'state.duration') g($t, 'state.easing');
  }

  &-trigger[aria-expanded='true'] &-caret {
    transform: rotate(180deg);
  }

  &-option[aria-checked='true'] {
    color: g($t, 'unit.selected.color');

    // The checked unit is marked by its ink alone, which forced colours flatten.
    // `.ui-menu__item` outweighs the menu's own hover fill, which would otherwise
    // force to Canvas under HighlightText.
    @include forced-colors {
      &.ui-menu__item {
        background-color: Highlight;
        color: HighlightText;
      }
    }
  }

  &-menu {
    min-width: g($t, 'unit.menu.min-width');
  }

}
</style>
