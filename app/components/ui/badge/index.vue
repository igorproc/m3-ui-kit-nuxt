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
interface Props {
  value?: string | number
  max?: number
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  max: 99,
  dot: false,
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
  {
    'ui-badge--large': !props.dot,
    'ui-badge--small': props.dot,
  },
])
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/badge' as v;

.ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: v.$shape;
  background-color: v.$bg-color;
  color: v.$text-color;
  z-index: 1;

  &--large {
    min-width: v.$size;
    min-height: v.$size;
    padding-inline: v.$padding-inline;
    @include typescale(v.$label-text-type);
  }

  &--small {
    padding-inline: v.$dot-padding-inline;
    min-width: v.$dot-size;
    min-height: v.$dot-size;
    width: v.$dot-size;
    height: v.$dot-size;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
