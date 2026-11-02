<template>
  <p
    :id="id"
    class="ui-choice-support"
    :class="{ 'ui-choice-support--error': isError }"
  >
    <!-- Rendered by the host whenever something can appear in it; the alert
         region exists before an error is written into it, so the first one is
         announced. -->
    <MIcon
      v-if="isError && !$slots.error"
      :name="ICONS.error"
      class="ui-choice-support__icon"
    />

    <span
      class="ui-choice-support__alert"
      role="alert"
    >
      <slot
        v-if="isError"
        name="error"
        :message="message"
      >
        {{ message }}
      </slot>
    </span>

    <slot
      v-if="!isError"
      name="helper"
      :message="message"
    >
      {{ message }}
    </slot>
  </p>
</template>

<script setup lang="ts">
/**
 * The support line of the selection family (`MCheckbox`, `MSwitch`, `MRadio`,
 * `MRadioGroup`): helper text, or the error in its place with a glyph. Only
 * the error is announced — a description the user did not ask for should not
 * interrupt them. The host owns the id its control points `aria-describedby` at.
 */
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

defineProps<{
  id: string
  isError: boolean
  message?: string
}>()

defineSlots<{
  helper?: (scope: { message?: string }) => unknown
  error?: (scope: { message?: string }) => unknown
}>()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/choice-support' as t;

.ui-choice-support {
  $t: material-map(t.$tokens, 'm-choice-support');

  display: flex;
  align-items: center;

  // The line is a `<p>`: no UA margin may add to the reserved height.
  margin: 0;
  min-width: 0;
  min-height: g($t, 'min-height');

  // A URL or an address in a message has no break opportunity of its own.
  overflow-wrap: anywhere;
  color: g($t, 'color');

  @include typescale(g($t, 'typography'));

  &--error {
    color: g($t, 'error.color');
  }

  &__icon {
    flex: 0 0 auto;
    margin-inline-end: g($t, 'icon.gap');
    font-size: g($t, 'icon.size');
  }

  &__alert {
    min-width: 0;
  }
}
</style>
