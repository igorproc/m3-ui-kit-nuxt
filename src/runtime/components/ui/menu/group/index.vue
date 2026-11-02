<template>
  <div
    class="ui-menu__group"
    role="group"
    :aria-labelledby="hasLabel ? labelId : undefined"
  >
    <div
      v-if="hasLabel"
      :id="labelId"
      class="ui-menu__group-label"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * `<MMenuGroup>` — a set of related `<MMenuItem>`s in an `<MMenu>`, for
 * `menuitemradio` items a required one. A menu of groups draws each group as
 * its own piece, a small gap apart; a label names the group for assistive
 * tech as well.
 */
import { computed, onScopeDispose, useId, useSlots } from 'vue'
import { useMenuContext } from '../context'

const props = defineProps({
  /** Visible name of the group; the `label` slot takes precedence. */
  label: { type: String, default: '' },
})

const slots = useSlots()
const labelId = useId()
const hasLabel = computed(() => Boolean(props.label || slots.label))

onScopeDispose(useMenuContext().registerGroup())
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/menu/index' as t;

$t: material-map(t.$tokens, 'md-menu');

.ui-menu {
  &__group-label {
    padding: g($t, 'group.label.padding');

    @include typescale(g($t, 'group.label.type'));
  }
}
</style>
