<template>
  <span
    v-if="!options.length"
    class="ui-number-input__unit"
  >
    <slot>{{ modelValue }}</slot>
  </span>

  <span
    v-else
    class="ui-number-input__unit ui-number-input__unit--menu"
  >
    <button
      v-ripple="!inactive"
      type="button"
      class="ui-number-input__unit-trigger"
      :disabled="inactive"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <slot>{{ current }}</slot>

      <MIcon
        name="round-keyboard-arrow-down"
        class="ui-number-input__unit-caret"
      />
    </button>

    <MMenu
      v-model="isOpen"
      absolute
      origin="top right"
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
import MMenu from '#kit/components/ui/menu/index.vue'
import type { MNumberInputUnit } from './props'

type Props = Partial<{
  /** Choices for the menu. Empty renders a static suffix instead. */
  units: MNumberInputUnit[]
  /** Accessible name of the trigger. */
  label: string
  disabled: boolean
  readonly: boolean
}>

const props = withDefaults(defineProps<Props>(), {
  units: () => [],
  label: 'Change unit',
  disabled: false,
  readonly: false,
})

const modelValue = defineModel<string | null>({ default: null })

const isOpen = ref(false)

const inactive = computed(() => props.disabled || props.readonly)
const options = computed(() => props.units.map(unit => (typeof unit === 'string'
  ? { value: unit, label: unit }
  : { value: unit.value, label: unit.label ?? unit.value })))

const current = computed(() => options.value.find(option => option.value === modelValue.value)?.label
  ?? modelValue.value
  ?? options.value[0]?.label)

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
  flex: 0 0 auto;
  align-items: center;
  align-self: center;
  padding-inline: g($t, 'unit.padding.inline');
  color: g($t, 'unit.color');
  font-variant-numeric: tabular-nums;

  @include typescale(g($t, 'typography.unit'));

  &--menu {
    padding-inline: 0;
  }

  &-trigger {
    position: relative;
    display: flex;
    align-items: center;
    gap: g($t, 'unit.gap');
    overflow: hidden;
    padding: g($t, 'unit.padding.block') g($t, 'unit.padding.inline');
    border: none;
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

    &:hover:not(:disabled)::after,
    &[aria-expanded='true']::after {
      opacity: g($t, 'layer.hover');
    }

    &:active:not(:disabled)::after {
      opacity: g($t, 'layer.pressed');
    }

    &:disabled {
      color: g($t, 'disabled.color');
      cursor: default;
    }
  }

  &-caret {
    font-size: g($t, 'unit.caret.size');
    transition: transform g($t, 'state.duration') g($t, 'state.easing');
  }

  &-trigger[aria-expanded='true'] &-caret {
    transform: rotate(180deg);
  }

  &-option[aria-checked='true'] {
    color: g($t, 'unit.selected.color');
  }

  &-menu {
    min-width: g($t, 'unit.menu.min-width');
  }

  @media (prefers-reduced-motion: reduce) {
    &-trigger::after,
    &-caret {
      transition: none;
    }
  }
}
</style>
