<template>
  <div
    class="ui-textarea__footer"
    :class="{ 'ui-textarea__footer--disabled': state.disabled }"
    :inert="isInactive || undefined"
  >
    <div
      v-if="$slots.start"
      class="ui-textarea__footer-group"
    >
      <slot
        name="start"
        v-bind="state"
      />
    </div>

    <div class="ui-textarea__footer-group ui-textarea__footer-group--end">
      <slot
        name="end"
        v-bind="state"
      >
        <slot v-bind="state" />
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

/**
 * The field's state, for the actions inside: a button bound to `disabled`
 * takes its own disabled roles, the way the rest of the field recedes.
 */
interface FooterSlotProps {
  disabled: boolean
  readonly: boolean
}

defineSlots<{
  /** Leading group — formatting controls, hints. */
  start?: (props: FooterSlotProps) => unknown
  /** Trailing group — the submit action. Falls back to the default slot. */
  end?: (props: FooterSlotProps) => unknown
  default?: (props: FooterSlotProps) => unknown
}>()

const fieldState = inject(textareaFieldStateKey, null)

const state = computed<FooterSlotProps>(() => ({
  disabled: Boolean(fieldState?.value.disabled),
  readonly: Boolean(fieldState?.value.readonly),
}))
const isInactive = computed(() => state.value.disabled || state.value.readonly)
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

  // Disabled recedes by roles, as the rest of the field: content at 38% (the
  // surface goes with the container's, in `<MTextarea>`). Read-only keeps its
  // look; `inert` takes the actions out of reach in both.
  &--disabled {
    color: g($t, 'disabled.color');
  }

  &-group {
    display: flex;
    align-items: center;
    gap: g($t, 'footer.gap');
    min-width: 0;

    &--end {
      margin-inline-start: auto;
    }
  }
}
</style>
