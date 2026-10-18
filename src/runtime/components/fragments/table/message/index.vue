<template>
  <tr class="ui-table__message-row">
    <td
      class="ui-table__message-cell"
      :colspan="colspan"
    >
      <div
        class="ui-table__message"
        :class="`ui-table__message--${kind}`"
      >
        <slot>
          <!-- The table's `aria-busy` and status region speak for it; the spinner is only seen. -->
          <MLoading
            v-if="kind === 'loading'"
            aria-hidden="true"
          />
          <template v-else-if="kind === 'error' && typeof error === 'string' && error">
            <MIcon
              class="ui-table__message-icon"
              :name="ICONS.error"
            />
            <span>{{ error }}</span>
          </template>
        </slot>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
/**
 * Private body row of `<MTable>` that stands in for the rows: loading, empty
 * or error, across every column. The table's slots replace its content; the
 * kit's own content is wordless (a spinner) or the app's (an error string).
 */
import type { PropType } from 'vue'
import { ICONS } from '#kit/shared/constants/icons'
import MIcon from '#kit/components/ui/icon/index.vue'
import MLoading from '#kit/components/ui/loading/index.vue'
import type { MTableMessage } from '#kit/utils/table/model'

defineProps({
  kind: { type: String as PropType<MTableMessage>, required: true },
  /** Columns to span, the checkbox column included. */
  colspan: { type: Number, required: true },
  error: { type: [Boolean, String] as PropType<boolean | string>, default: false },
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/table/index' as t;

.ui-table {
  $t: material-map(t.$tokens, 'md-table');

  &__message-cell {
    padding: g($t, 'message.padding');
  }

  &__message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: g($t, 'message.gap');
    color: g($t, 'message.color');
    text-align: center;
    overflow-wrap: anywhere;

    @include typescale(g($t, 'message.typography'));

    &--error {
      flex-flow: row wrap;
      color: g($t, 'message.error.color');
    }
  }

  &__message-icon {
    flex-shrink: 0;
    font-size: g($t, 'message.icon.size');
  }

  @each $step in ('compact', 'default', 'comfortable') {
    .ui-table-container--density-#{$step} &__message-row {
      height: g($t, 'density.#{$step}.message');
    }
  }
}
</style>
