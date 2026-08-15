<template>
  <span class="ui-breadcrumbs-divider">
    <slot>
      <MIcon
        v-if="isIcon"
        class="ui-breadcrumbs-divider__icon"
        :name="divider"
      />
      <template v-else>{{ divider }}</template>
    </slot>
  </span>
</template>

<script setup lang="ts">
/**
 * Private decorative leaf of `<MBreadcrumbs>`.
 *
 * The parent inserts it only between crumbs and hides the surrounding `li`
 * from assistive technology, so a separator is never announced between every
 * item. The leaf owns no state, focus behavior or route logic.
 */
import MIcon from '~/components/ui/icon/index.vue'

/**
 * Icon names follow the kit convention (`round-chevron-right`,
 * `ic:round-chevron-right`): lowercase segments joined by `-` or `:`. Anything
 * else — `/`, `>`, `•` — is literal separator text.
 */
const ICON_NAME = /^[a-z][a-z0-9]*(?:[-:][a-z0-9]+)+$/

const props = defineProps({
  /** Separator value passed through from the parent. */
  divider: { type: String, required: true },
})

const isIcon = computed(() => ICON_NAME.test(props.divider))
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/breadcrumbs/index' as t;

.ui-breadcrumbs-divider {
  $t: material-map(t.$tokens, 'md-breadcrumbs');

  display: inline-flex;
  align-items: center;
  color: g($t, 'divider-color');
  font-size: g($t, 'divider-size');
  line-height: 0;
  user-select: none;

  [dir='rtl'] & .ui-breadcrumbs-divider__icon {
    transform: g($t, 'divider-rtl-transform');
  }
}
</style>
