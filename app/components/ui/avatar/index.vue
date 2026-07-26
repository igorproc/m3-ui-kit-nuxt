<template>
  <div
    class="ui-avatar"
    :class="[`ui-avatar--${size}`, `ui-avatar--${variant}`, `ui-avatar--shape-${shape}`]"
    :role="rootRole"
    :aria-label="rootLabel"
  >
    <slot
      :size="size"
      :failed="failed"
    >
      <img
        v-if="showImage"
        :key="src"
        class="ui-avatar__image"
        :src="src"
        :alt="imageAlt"
        @load="onLoad"
        @error="onError"
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
import MIcon from '~/components/ui/icon/index.vue'
import { getAvatarInitials } from '~~/shared/utils/avatar'
import type { MAvatarFallbackSlot } from './props'
import { mAvatarProps } from './props'

const DEFAULT_ICON = 'round-person'

const props = defineProps(mAvatarProps)
const emit = defineEmits<{
  (event: 'load' | 'error', value: Event): void
}>()

const slots = useSlots()
/** Keyed by URL so a new source is attempted while the failed one stays failed. */
const failedSrc = ref<string>()
const errorEvent = ref<Event>()

const normalizedName = computed(() => props.name?.trim() || undefined)
const initials = computed(() => (normalizedName.value ? getAvatarInitials(normalizedName.value) : ''))
const fallbackIcon = computed(() => props.icon || DEFAULT_ICON)
const failed = computed(() => Boolean(props.src) && failedSrc.value === props.src)
const showImage = computed(() => Boolean(props.src) && !failed.value)

// An explicit `alt` names or silences the image; otherwise `name` labels the
// root and the image stays decorative, so no duplicate name is announced.
const labelledByName = computed(() => props.alt === undefined && Boolean(normalizedName.value))
const imageAlt = computed(() => (props.alt === undefined ? '' : props.alt))
// A custom default slot owns the semantics of its own content.
const rootRole = computed(() => (labelledByName.value && !slots.default ? 'img' : undefined))
const rootLabel = computed(() => (rootRole.value ? normalizedName.value : undefined))

const fallbackSlotProps = computed<MAvatarFallbackSlot>(() => ({
  name: normalizedName.value,
  initials: initials.value,
  icon: fallbackIcon.value,
  error: errorEvent.value,
}))

/** Guards against a late event from a source that is no longer active. */
function isCurrent(event: Event) {
  return (event.target as HTMLImageElement).getAttribute('src') === props.src
}

function onLoad(event: Event) {
  if (!isCurrent(event)) return
  errorEvent.value = undefined
  emit('load', event)
}

function onError(event: Event) {
  if (!isCurrent(event) || failed.value) return
  failedSrc.value = props.src
  errorEvent.value = event
  emit('error', event)
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/avatar/index' as t;

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
    object-fit: g($t, 'image-fit');
  }

  &__initials {
    line-height: 1;
  }

  // Sizes reserve the final box before the image resolves, so a load or a
  // failure never shifts layout.
  @each $size in ('sm', 'md', 'lg') {
    &--#{$size} {
      width: g($t, '#{$size}-size');
      height: g($t, '#{$size}-size');

      .ui-avatar__icon { font-size: g($t, '#{$size}-icon-size'); }

      .ui-avatar__initials {
        @include apply-typography(g($t, '#{$size}-initials-typography'));
      }
    }
  }

  @each $shape in ('full', 'large', 'medium', 'small') {
    &--shape-#{$shape} { border-radius: g($t, 'shape-#{$shape}'); }
  }

  @each $variant in ('tonal', 'filled') {
    &--#{$variant} {
      color: g($t, '#{$variant}-content-color');
      background-color: g($t, '#{$variant}-container-color');
    }
  }

  &--outlined {
    color: g($t, 'outlined-content-color');
    background-color: g($t, 'outlined-container-color');
    box-shadow: inset 0 0 0 g($t, 'outlined-outline-width') g($t, 'outlined-outline-color');
  }
}
</style>
