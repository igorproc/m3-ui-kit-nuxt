<template>
  <div
    class="ui-avatar"
    :class="[`ui-avatar--density-${density}`, `ui-avatar--${variant}`, `ui-avatar--shape-${shape}`]"
    v-bind="rootAttrs"
  >
    <slot
      :density="density"
      :failed="failed"
    >
      <img
        v-if="showImage"
        ref="image"
        :key="src"
        class="ui-avatar__image"
        v-bind="imageAttrs"
      >
      <!-- `name` is reserved on `<slot>`, so the payload is bound as one object. -->
      <slot
        v-else
        name="fallback"
        v-bind="fallbackSlotProps"
      >
        <span
          v-if="initials"
          class="ui-avatar__initials"
          aria-hidden="true"
        >{{ initials }}</span>
        <MIcon
          v-else
          class="ui-avatar__icon"
          :name="fallbackIcon"
        />
      </slot>
    </slot>
  </div>
</template>

<script setup lang="ts">
import MIcon from '#kit/components/ui/icon/index.vue'
import { useAvatar } from '#kit/composables/avatar/useAvatar'
import { useRetiredValueWarning } from '#kit/composables/button/useRetiredValueWarning'
import type { MAvatarDefaultSlot, MAvatarFallbackSlot } from './props'
import { AVATAR_SIZE_TO_DENSITY, mAvatarProps } from './props'

const props = defineProps(mAvatarProps)
const emit = defineEmits<{
  (event: 'load' | 'error', value: Event): void
}>()

defineSlots<{
  default?: (props: MAvatarDefaultSlot) => unknown
  fallback?: (props: MAvatarFallbackSlot) => unknown
}>()

const slots = useSlots()
const image = useTemplateRef<HTMLImageElement>('image')

useRetiredValueWarning('m-avatar', 'size', () => props.size, {
  sm: '`density="compact"`',
  md: '`density="default"`',
  lg: '`density="comfortable"`',
})

const density = computed(() => (props.size ? AVATAR_SIZE_TO_DENSITY[props.size] : props.density))

const { normalizedName, initials, fallbackIcon, failed, showImage, errorEvent, rootAttrs, imageAttrs } = useAvatar(props, {
  image,
  ownsContent: () => Boolean(slots.default),
  onLoad: event => emit('load', event),
  onError: event => emit('error', event),
})

const fallbackSlotProps = computed<MAvatarFallbackSlot>(() => ({
  name: normalizedName.value,
  initials: initials.value,
  icon: fallbackIcon.value,
  error: errorEvent.value,
}))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/avatar/index' as t;

.ui-avatar {
  $t: material-map(t.$tokens, 'md-avatar');

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  user-select: none;

  &__image {
    width: 100%;
    height: 100%;
    object-fit: g($t, 'image.fit');
  }

  &__initials {
    line-height: 1;
  }

  // Each step reserves the final box before the image resolves, so a load or
  // a failure never shifts layout.
  @each $step in ('compact', 'default', 'comfortable') {
    &--density-#{$step} {
      width: g($t, 'density.#{$step}.size');
      height: g($t, 'density.#{$step}.size');

      .ui-avatar__icon { font-size: g($t, 'density.#{$step}.icon.size'); }

      .ui-avatar__initials {
        @include apply-typography(g($t, 'density.#{$step}.initials.typography'));
      }
    }
  }

  @each $shape in ('full', 'large', 'medium', 'small') {
    &--shape-#{$shape} { border-radius: g($t, 'shape.#{$shape}'); }
  }

  @each $variant in ('tonal', 'filled', 'outlined') {
    &--#{$variant} {
      color: g($t, '#{$variant}.content.color');
      background-color: g($t, '#{$variant}.container.color');
    }
  }

  // A border, not a shadow: forced colors keep it, and an image sits inside it
  // instead of covering it.
  &--outlined {
    border: g($t, 'outlined.outline.width') solid g($t, 'outlined.outline.color');
  }

  // Tonal and filled are told apart from the page only by their container
  // tone, which forced colors drop.
  &--tonal,
  &--filled {
    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }
}
</style>
