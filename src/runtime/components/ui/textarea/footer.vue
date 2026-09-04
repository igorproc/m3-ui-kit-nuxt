<template>
  <div
    class="ui-textarea__footer"
    :class="{ 'ui-textarea__footer--inactive': isInactive }"
    :inert="isInactive || undefined"
  >
    <div
      v-if="$slots.start"
      class="ui-textarea__footer-group"
    >
      <slot name="start" />
    </div>

    <div class="ui-textarea__footer-group ui-textarea__footer-group--end">
      <slot name="end">
        <slot />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Toolbar row a `<MTextarea>` absorbs into its own container, so the editor and
 * its actions read as one object.
 *
 * Purely presentational except for one thing: it inherits the field's
 * interaction state, so a disabled or read-only textarea does not leave live,
 * tabbable buttons sitting inside a dead box. `inert` does that natively —
 * pointer events, focus and the tab order all go with it.
 */
import { textareaFieldStateKey } from '#kit/composables/textarea/useTextareaControl'

defineSlots<{
  /** Leading group — formatting controls, hints. */
  start?: () => unknown
  /** Trailing group — the submit action. Falls back to the default slot. */
  end?: () => unknown
  default?: () => unknown
}>()

const fieldState = inject(textareaFieldStateKey, null)

const isInactive = computed(() => Boolean(fieldState?.value.disabled || fieldState?.value.readonly))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/textarea' as t;

$t: material-map(t.$tokens, 'm-textarea');

.ui-textarea__footer {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: g($t, 'footer.gap');
  padding: g($t, 'footer.padding.block') g($t, 'footer.padding.inline');

  // A step of tone, no rule. The variant that cannot step up any further gets
  // its layer from `<MTextarea>`, which is the only place that knows the shape.
  background-color: g($t, 'footer.surface');

  &--inactive {
    color: g($t, 'disabled.color');
    opacity: 0.6;
  }

  &-group {
    display: flex;
    align-items: center;
    gap: g($t, 'footer.gap');
    min-width: 0;

    &--end {
      margin-left: auto;
    }
  }
}
</style>
