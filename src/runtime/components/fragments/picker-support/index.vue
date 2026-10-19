<template>
  <div class="ui-picker-support">
    <p
      v-if="!hasError && (helperText || $slots.helper)"
      :id="helperId"
      class="ui-picker-support__line"
    >
      <slot name="helper">
        {{ helperText }}
      </slot>
    </p>

    <!-- Always mounted and always the same live region: only its content changes. -->
    <p
      :id="errorId"
      class="ui-picker-support__line ui-picker-support__line--error"
      role="alert"
    >
      <MIcon
        v-if="hasError"
        :name="ICONS.error"
        class="ui-picker-support__icon"
        aria-hidden="true"
      />
      <template v-if="hasError">
        {{ errorText }}
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * The support line of the date and time pickers: helper text, or the error in
 * its place with a glyph. The host decides when the line is shown and owns the
 * ids it points `aria-describedby` at.
 */
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

const props = defineProps<{
  helperId: string
  errorId: string
  helperText?: string
  error?: boolean
  errorText?: string
}>()

defineSlots<{ helper?: () => unknown }>()

const hasError = computed(() => Boolean(props.error || props.errorText))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/picker-support' as t;

.ui-picker-support {
  $t: material-map(t.$tokens, 'm-picker-support');

  display: grid;
  min-height: g($t, 'line.height');
  margin-block-start: g($t, 'margin.top');
  color: g($t, 'color');

  @include typescale(g($t, 'typography'));

  // Helper and error share one cell: the error takes the helper's place.
  &__line {
    display: flex;
    grid-area: 1 / 1;
    align-items: center;
    gap: g($t, 'line.gap');
    margin: 0;
    overflow-wrap: anywhere;

    &--error {
      color: g($t, 'error');
    }
  }

  &__icon {
    flex: 0 0 auto;
    font-size: g($t, 'icon.size');
  }
}
</style>
