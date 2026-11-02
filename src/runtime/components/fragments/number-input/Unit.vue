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
    <!--
      The unit sits at the inline end, so the menu hangs from that edge
      (`bottom-end`, mirrored by the menu itself in a right-to-left page).
    -->
    <MMenu
      v-model="isOpen"
      placement="bottom-end"
      class="ui-number-input__unit-menu"
      @click-outside="isOpen = false"
    >
      <template #activator="{ props: menuTrigger }">
        <button
          v-ripple="!inactive"
          v-bind="menuTrigger"
          type="button"
          class="ui-number-input__unit-trigger"
          :class="{ 'ui-number-input__unit-trigger--open': isOpen }"
          :disabled="inactive"
          :aria-labelledby="`${id}-label ${id}-value`"
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
      </template>

      <!-- One unit is in force: a radio set, the chosen one checked. -->
      <MMenuGroup>
        <MMenuItem
          v-for="option in options"
          :key="option.value"
          class="ui-number-input__unit-option"
          role="menuitemradio"
          :label="option.label"
          :selected="option.value === modelValue"
          @select="select(option.value)"
        />
      </MMenuGroup>
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
import MMenuGroup from '#kit/components/ui/menu/group/index.vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'
import type { MNumberInputUnit } from '#kit/components/ui/number-input/props'
import { normalizeUnits, shownUnit } from '#kit/utils/number-input/unit'

type Props = Partial<{
  /** Choices for the menu. Empty renders a static suffix instead. */
  units: MNumberInputUnit[]
  /**
   * Leads the trigger's accessible name; the visible unit follows it, so the
   * name still contains what is on screen ("Change unit MiB"). No default:
   * the kit ships no copy of its own.
   */
  label: string
  disabled: boolean
  readonly: boolean
}>

const props = withDefaults(defineProps<Props>(), {
  units: () => [],
  label: undefined,
  disabled: false,
  readonly: false,
})

const modelValue = defineModel<string | null>({ default: null })

const id = useId()
const isOpen = ref(false)

const inactive = computed(() => props.disabled || props.readonly)
const options = computed(() => normalizeUnits(props.units))
const current = computed(() => shownUnit(props.units, modelValue.value))

// The zone shows the first choice while none is made; the model takes it too,
// so it never disagrees with the screen. Written once the client has the
// component: the server's first frame already shows the same choice.
onMounted(() => {
  if (modelValue.value == null && options.value[0]) modelValue.value = options.value[0].value
})

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
@use '#kit/assets/stylesheet/components/number-input/zones' as zones;

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
    background-color: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;

    // The `<MNumberInput>` it sits in sets the corner: its `shape`, one tier rounder.
    @include zones.zone-radius($t);

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

    &--open::after {
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

  &-trigger--open &-caret {
    transform: rotate(180deg);
  }

  &-menu {
    min-width: g($t, 'unit.menu.min-width');
  }

}
</style>
