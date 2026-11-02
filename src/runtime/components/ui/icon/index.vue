<template>
  <span
    class="ui-icon"
    :class="{ 'ui-icon--mirror': mirror }"
    v-bind="rootAttrs"
  >
    <icon
      v-if="glyph"
      class="ui-icon__glyph"
      :name="glyph"
      v-bind="glyphAttrs"
    />
  </span>
</template>

<script setup lang="ts">
import { useIconControl } from '#kit/utils/icon/useIconControl'
import { mIconProps } from './props'

const props = defineProps(mIconProps)

const { glyph, rootAttrs, glyphAttrs } = useIconControl(props)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/icon/index' as t;

$prefix: 'md-icon';

.ui-icon {
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: g($t, 'size');
  height: g($t, 'size');
  line-height: 0;

  &__glyph {
    width: g($t, 'size');
    height: g($t, 'size');
    font-size: inherit;
    fill: g($t, 'fill');

    // CSS-mode icons paint a mask with `background-color: currentcolor`, which
    // forced colors replaces with Canvas — every glyph would vanish.
    @include forced-colors {
      forced-color-adjust: preserve-parent-color;
    }
  }

  // `scale`, not `transform`: a consumer's own transform (a rotated chevron)
  // composes with the mirror instead of replacing it.
  &--mirror:dir(rtl) {
    scale: g($t, 'mirror.scale');
  }
}
</style>
