<template>
  <div
    v-bind="rootAttrs()"
    class="ui-switch"
    :class="switchClasses"
  >
    <label class="ui-switch__field">
      <input
        v-bind="controlAttrs(inputAttrs())"
        v-model="modelValue"
        class="ui-switch__input"
        type="checkbox"
        :disabled="disabled"
        :required="required || undefined"
        role="switch"
      >

      <span class="ui-switch__track">
        <span class="ui-switch__thumb-container">
          <span class="ui-switch__thumb">
            <span
              v-if="showsIcon"
              class="ui-switch__icon"
            >
              <slot
                name="icon"
                :checked="modelValue"
              >
                <MIcon :name="modelValue ? ICONS.check : ICONS.close" />
              </slot>
            </span>
          </span>
          <span class="ui-switch__state-layer" />
        </span>
      </span>

      <span
        v-if="label || $slots.default"
        class="ui-switch__label"
      >
        <slot>
          {{ label }}
        </slot>
        <span
          v-if="required"
          class="ui-switch__required"
          aria-hidden="true"
        > *</span>
      </span>
    </label>

    <!-- Outside the label: its text must neither name the switch nor toggle it. -->
    <ChoiceSupport
      v-if="hasSupport()"
      :id="supportId()"
      class="ui-switch__support"
      :is-error="isError"
      :message="message"
    >
      <template
        v-if="$slots.helper"
        #helper="scope"
      >
        <slot
          name="helper"
          v-bind="scope"
        />
      </template>
      <template
        v-if="$slots.error"
        #error="scope"
      >
        <slot
          name="error"
          v-bind="scope"
        />
      </template>
    </ChoiceSupport>
  </div>
</template>

<script setup lang="ts">
import ChoiceSupport from '#kit/components/fragments/choice-support/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useChoiceField } from '#kit/utils/choice/useChoiceField'
import { mSwitchProps } from './props'
import type { MSwitchSlots } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mSwitchProps)
const slots = defineSlots<MSwitchSlots>()

const modelValue = defineModel<boolean>({ default: false })

// Coerce the synced field value to a strict boolean (the native switch
// contract) without mutating the shared `useField` composable.
const booleanModel = computed({
  get: () => modelValue.value,
  set: (next) => {
    modelValue.value = Boolean(next)
  },
})

const { isError, message, hasSupport, supportId, inputAttrs } = useChoiceField(booleanModel, props, slots)

// `selected`: a glyph only while on; `both`: on and off.
const showsIcon = computed(() => props.icons === 'both' || (props.icons === 'selected' && modelValue.value))

const switchClasses = computed(() => [
  {
    'ui-switch--checked': modelValue.value,
    'ui-switch--disabled': props.disabled,
    'ui-switch--error': isError.value,
    'ui-switch--icon': showsIcon.value,
  },
])
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/switch' as t;
@use '#kit/assets/stylesheet/components/choice/control' as control;

.ui-switch {
  $t: material-map(t.$tokens, 'md-switch');

  isolation: isolate;

  @include control.field($t);

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  // The native input is transparent, so the ring goes on the visible control.
  &__input:focus-visible + &__track {
    @include focus-ring;
  }

  &__track {
    position: relative;
    flex-shrink: 0;
    box-sizing: border-box;
    inline-size: g($t, 'track.width');
    block-size: g($t, 'track.height');
    border: g($t, 'track.border.width') solid g($t, 'unselected.container.border');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'unselected.container.color');
    transition:
      background-color g($t, 'motion.duration') g($t, 'motion.easing'),
      border-color g($t, 'motion.duration') g($t, 'motion.easing');

    @include touch-target;
  }

  &__thumb-container {
    position: absolute;
    top: 50%;
    inset-inline-start: g($t, 'thumb.start');
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: g($t, 'selected.shape.thumb');
    block-size: g($t, 'selected.shape.thumb');
    transform: translateY(-50%);
    transition: transform g($t, 'motion.duration') g($t, 'motion.easing');
  }

  &--checked &__thumb-container {
    transform: translate(g($t, 'thumb.travel'), -50%);
  }

  // The thumb travels towards the inline end, which is the left in RTL.
  &--checked:dir(rtl) &__thumb-container {
    transform: translate(g($t, 'thumb.travel-rtl'), -50%);
  }

  &__thumb {
    z-index: 1;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    inline-size: g($t, 'unselected.shape.thumb');
    block-size: g($t, 'unselected.shape.thumb');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'unselected.content.color');
    transition:
      inline-size g($t, 'motion.duration') g($t, 'motion.easing'),
      block-size g($t, 'motion.duration') g($t, 'motion.easing'),
      background-color g($t, 'motion.duration') g($t, 'motion.easing');
  }

  // On, or with a glyph in either value, the thumb is the 24 one.
  &--checked &__thumb,
  &--icon &__thumb {
    inline-size: g($t, 'selected.shape.thumb');
    block-size: g($t, 'selected.shape.thumb');
  }

  &--checked &__thumb {
    background-color: g($t, 'selected.content.color');
  }

  &__icon {
    display: inline-flex;
    font-size: g($t, 'icon.size');
    color: g($t, 'unselected.content.icon');
    animation: ui-switch-icon g($t, 'motion.icon.duration') g($t, 'motion.icon.easing');
  }

  &--checked &__icon {
    color: g($t, 'selected.content.icon');
  }

  @keyframes ui-switch-icon {
    from {
      opacity: 0;
      rotate: -45deg;
    }
  }

  &__state-layer {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    inline-size: g($t, 'layer.size');
    block-size: g($t, 'layer.size');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'unselected.content.active.layer.color');
    opacity: 0;
    pointer-events: none;
    translate: -50% -50%;
    transition: opacity var(--sys-motion-duration-short-1) var(--sys-motion-easing-linear);
  }

  &:dir(rtl) &__state-layer {
    translate: 50% -50%;
  }

  &--checked &__track {
    border-color: g($t, 'selected.container.color');
    background-color: g($t, 'selected.container.color');
  }

  &--checked &__state-layer {
    background-color: g($t, 'selected.content.active.layer.color');
  }

  // Hover, focus and press: the layer and the thumb's active tone.
  $enabled: ':not(.ui-switch--disabled)';

  @include can-hover {
    &#{$enabled} &__field:hover &__state-layer {
      opacity: g($t, 'state.layer.opacity.hover');
    }

    &#{$enabled} &__field:hover &__thumb {
      background-color: g($t, 'unselected.content.active.color');
    }

    &--checked#{$enabled} &__field:hover &__thumb {
      background-color: g($t, 'selected.content.active.color');
    }
  }

  &__input:focus-visible + &__track &__state-layer {
    opacity: g($t, 'state.layer.opacity.focus');
  }

  &__input:focus-visible + &__track &__thumb,
  &#{$enabled} &__field:active &__thumb {
    background-color: g($t, 'unselected.content.active.color');
  }

  &--checked &__input:focus-visible + &__track &__thumb,
  &--checked#{$enabled} &__field:active &__thumb {
    background-color: g($t, 'selected.content.active.color');
  }

  // A press grows the thumb at once, as Compose snaps it.
  &#{$enabled} &__field:active &__thumb {
    inline-size: g($t, 'thumb.pressed.size');
    block-size: g($t, 'thumb.pressed.size');
    transition: none;
  }

  &#{$enabled} &__field:active &__state-layer {
    opacity: g($t, 'state.layer.opacity.pressed');
  }

  // As the checkbox: the error is the edge and the layer; the support line says why.
  &--error &__track {
    border-color: g($t, 'error.container.border');
  }

  &--error &__state-layer {
    background-color: g($t, 'error.content.active.layer.color');
  }

  // Disabled by roles, not by fading the whole control.
  &--disabled &__state-layer {
    display: none;
  }

  &--disabled &__track {
    border-color: g($t, 'disabled.unselected.container.border');
    background-color: g($t, 'disabled.unselected.container.color');
  }

  &--disabled &__thumb {
    background-color: g($t, 'disabled.unselected.content.color');
  }

  &--disabled &__icon {
    color: g($t, 'disabled.unselected.content.icon');
  }

  &--checked.ui-switch--disabled &__track {
    border-color: transparent;
    background-color: g($t, 'disabled.selected.container.color');
  }

  &--checked.ui-switch--disabled &__thumb {
    background-color: g($t, 'disabled.selected.content.color');
  }

  &--checked.ui-switch--disabled &__icon {
    color: g($t, 'disabled.selected.content.icon');
  }

  // The thumb is only a fill and the checked track only a tone, so forced
  // colors would erase both. `!important` on the thumb beats the hover rules.
  @include forced-colors {
    .ui-switch__thumb {
      background-color: CanvasText !important;
    }

    &--checked .ui-switch__track {
      background-color: Highlight;
      border-color: Highlight;
    }

    &--checked .ui-switch__thumb {
      background-color: HighlightText !important;
    }

    &--error .ui-switch__track {
      border-style: dashed;
    }

    &--disabled .ui-switch__track {
      border-color: GrayText;
    }

    &--disabled .ui-switch__thumb {
      background-color: GrayText !important;
    }

    &--checked.ui-switch--disabled .ui-switch__track {
      background-color: GrayText;
      border-color: GrayText;
    }

    &--checked.ui-switch--disabled .ui-switch__thumb {
      background-color: Canvas !important;
    }
  }
}
</style>
