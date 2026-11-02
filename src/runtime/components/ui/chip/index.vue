<template>
  <span
    v-if="removal === 'button'"
    v-bind="rootAttrs()"
    class="ui-chip ui-chip--multi"
    :class="chipClasses()"
    @pointerenter="requestTip"
    @pointerleave="dropTip"
    @focusin="onFocusIn"
    @focusout="dropTip"
  >
    <!-- `removal="button"`: two actions, so the chip is a wrapper of two buttons. -->
    <button
      ref="element"
      v-bind="controlAttrs(actionAttrs)"
      class="ui-chip__action"
      type="button"
    >
      <component :is="content" />
    </button>

    <button
      ref="remove"
      v-bind="removeAttrs"
      class="ui-chip__remove"
      type="button"
    >
      <MIcon
        class="ui-chip__remove-icon"
        :name="ICONS.close"
      />
    </button>
  </span>

  <button
    v-else
    ref="element"
    v-bind="singleAttrs()"
    class="ui-chip"
    :class="chipClasses()"
    type="button"
    @pointerenter="requestTip"
    @pointerleave="dropTip"
    @focusin="onFocusIn"
    @focusout="dropTip"
  >
    <component :is="content" />

    <span
      v-if="$slots.trailing || removal === 'whole'"
      class="ui-chip__trailing"
    >
      <slot name="trailing">
        <MIcon :name="ICONS.close" />
      </slot>
    </span>
  </button>
</template>

<script setup lang="ts" generic="TValue = unknown">
import { h, mergeProps } from 'vue'
import ChipContent from '#kit/components/fragments/chip/content.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { useChipControl } from '#kit/composables/chip/useChipControl'
import { useChipTip } from '#kit/utils/chip/useChipTip'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { ICONS } from '#kit/shared/constants/icons'
import { mChipProps } from './props'
import type { MChipPropsOptions, MChipSlots } from './props'

// In the two-button shape `class`/`style` stay on the wrapper and the rest
// goes to the main action, as the one-button chip receives it.
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const { controlAttrs } = useControlAttrs()

const props = defineProps(mChipProps as MChipPropsOptions<TValue>)
const slots = defineSlots<MChipSlots>()
const emit = defineEmits<{ (event: 'remove'): void }>()

const selectedModel = defineModel<boolean>({ default: false })

const element = useTemplateRef<HTMLElement>('element')

const { isSelected, isDisabled, isBlocked, removeElement, actionAttrs, removeAttrs } = useChipControl(
  props,
  selectedModel,
  element,
  () => emit('remove'),
)

const remove = useTemplateRef<HTMLElement>('remove')
watchEffect(() => {
  removeElement.value = remove.value
})

const rootAttrs = () => ({ class: attrs.class, style: attrs.style })
const singleAttrs = () => mergeProps(controlAttrs(actionAttrs.value), rootAttrs())

const showsCheck = computed(() => props.type === 'filter' && props.showSelectedIcon)
const hasLeading = () => Boolean(slots.icon || slots.avatar || (showsCheck.value && isSelected.value))
const hasTrailing = () => Boolean(slots.trailing) || props.removal !== 'none'

const { tip, tipText, tipOpen, contentRef, requestTip, dropTip, onFocusIn, onTipOpen } = useChipTip(isDisabled)

// One leading part and label for both shapes; the chip's own slots pass through.
const content = () => h(ChipContent, {
  'ref': contentRef,
  'selected': isSelected.value,
  'disabled': isDisabled.value,
  'blocked': isBlocked.value,
  'check': showsCheck.value,
  'tip': tip.value,
  'tipText': tipText.value,
  'tipOpen': tipOpen.value,
  'onUpdate:tipOpen': onTipOpen,
}, Object.fromEntries((['default', 'icon', 'avatar', 'selected-icon'] as const)
  .filter(name => slots[name])
  .map(name => [name, slots[name]])))

const chipClasses = () => [
  `ui-chip--${props.type}`,
  `ui-chip--${props.type === 'input' ? 'outlined' : props.variant}`,
  {
    'ui-chip--selected': isSelected.value,
    'ui-chip--disabled': isDisabled.value,
    'ui-chip--blocked': isBlocked.value,
    'ui-chip--leading': hasLeading(),
    'ui-chip--avatar': Boolean(slots.avatar),
    'ui-chip--trailing': hasTrailing(),
  },
]

if (import.meta.dev) {
  watchEffect(() => {
    if (props.type === 'input' && props.variant === 'elevated') {
      console.warn('[m-chip] an input chip has no elevated variant; it stays outlined.')
    }
    if (props.removal !== 'none' && !props.removeLabel) {
      console.warn('[m-chip] the remove action has no name: pass `remove-label`.')
    }
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/chip/index' as t;
@use '#kit/assets/stylesheet/components/chip/states' as states;

.ui-chip {
  $t: material-map(t.$tokens, 'md-chip');

  position: relative;
  isolation: isolate;
  display: inline-flex;

  // In a scrolling row a chip keeps its width; it never squeezes its label.
  flex-shrink: 0;
  align-items: center;
  gap: g($t, 'gap');
  max-inline-size: 100%;
  min-block-size: g($t, 'height');
  box-sizing: border-box;
  padding-inline: g($t, 'padding.plain');
  border: g($t, 'outlined.width') solid transparent;
  border-radius: g($t, 'radius');
  background-color: transparent;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition:
    background-color g($t, 'motion.state.duration') g($t, 'motion.state.easing'),
    color g($t, 'motion.state.duration') g($t, 'motion.state.easing'),
    border-color g($t, 'motion.state.duration') g($t, 'motion.state.easing'),
    box-shadow g($t, 'motion.state.duration') g($t, 'motion.state.easing'),
    padding g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');

  @include typescale(g($t, 'text.type'));
  @include states.layer($t);
  @include states.padding($t);
  @include states.roles($t);
  @include states.multi($t);

  &:not(.ui-chip--multi) {
    @include touch-target;
  }

  &__trailing {
    display: inline-flex;
    flex-shrink: 0;
    font-size: g($t, 'icon.size');
  }

  &:focus-visible {
    @include focus-ring;
  }

  // Selection is blocked by the group `max`; the chip stays focusable so the
  // user can reach it and understand why it cannot be selected.
  &--blocked {
    cursor: default;
    opacity: g($t, 'blocked.opacity');
  }

  &--disabled {
    cursor: default;
    pointer-events: none;
  }

  @include states.forced;
}
</style>
