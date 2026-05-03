<template>
  <span
    class="ui-badge"
    :class="badgeClasses"
    role="status"
    aria-live="polite"
  >
    <span
      v-if="!dot && displayValue"
      class="ui-badge__label"
    >
      <slot>
        {{ displayValue }}
      </slot>
    </span>
  </span>
</template>

<script setup lang="ts">
type BadgeVariant = 'standard' | 'large'

interface Props {
  value?: string | number
  max?: number
  dot?: boolean
  variant?: BadgeVariant
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  max: 99,
  dot: false,
  variant: 'standard',
})

const displayValue = computed(() => {
  if (props.dot) {
    return ''
  }

  const raw = props.value

  if (raw === undefined || raw === null || raw === '') {
    return ''
  }

  const numeric = Number(raw)

  if (Number.isNaN(numeric)) {
    return String(raw)
  }

  if (numeric > props.max) {
    return `${props.max}+`
  }

  return String(numeric)
})

const badgeClasses = computed(() => [
  `ui-badge--${props.variant}`,
  {
    'ui-badge--dot': props.dot,
  },
])
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/badge' as v;

.ui-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: v.$size;
  min-height: v.$size;
  padding-inline: v.$padding-inline;
  border-radius: v.$shape;
  background-color: v.$bg-color;
  color: v.$text-color;
  z-index: 1;

  @include typescale(v.$label-text-type);

  font-size: v.$font-size;
  line-height: v.$line-height;

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &--dot {
    padding-inline: v.$dot-padding-inline;
    min-width: v.$dot-size;
    min-height: v.$dot-size;
  }
}
</style>
