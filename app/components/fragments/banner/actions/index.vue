<template>
  <div
    class="ui-banner-actions"
    :class="`ui-banner-actions--${layout}`"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Private layout leaf of `<MBanner>`.
 *
 * It owns action alignment only: it never inspects, registers, prioritizes or
 * invokes the actions the parent slot renders into it. `MBanner` mounts it
 * exclusively when an `actions` slot exists, so no empty wrapper is emitted.
 * No landmark or toolbar role is added — arbitrary links and buttons may
 * appear, and banner actions are not a command toolbar.
 */
import type { PropType } from 'vue'
import type { MBannerLayout } from '~/components/ui/banner/props'

defineProps({
  /** Presentation inherited from the parent banner. */
  layout: { type: String as PropType<MBannerLayout>, required: true },
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/banner/index' as t;

.ui-banner-actions {
  $t: material-map(t.$tokens, 'md-banner');

  display: flex;
  flex-wrap: wrap;
  align-items: center;

  // Logical alignment keeps RTL correct without touching DOM order.
  justify-content: flex-end;
  gap: g($t, 'actions-gap');

  &--stacked {
    justify-content: flex-start;
    margin-block-start: g($t, 'actions-margin-block');
  }

  &--auto {
    justify-content: flex-start;
    margin-block-start: g($t, 'actions-margin-block');

    @media only screen and (min-width: #{g($t, 'auto-threshold')}) {
      justify-content: flex-end;
      margin-block-start: 0;
    }
  }
}
</style>
