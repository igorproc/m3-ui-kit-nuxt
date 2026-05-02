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
.ui-badge {
  --ui-badge-size: 16rem;
  --ui-badge-padding-inline: 4rem;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--ui-badge-size);
  min-height: var(--ui-badge-size);
  padding-inline: var(--ui-badge-padding-inline);
  border-radius: var(--sys-shape-corner-full);
  background-color: var(--color-warn);
  color: var(--color-warn-contrast);
  z-index: 1;

  // Typography: Label Small (M3 numeric badge uses 11px font)
  @include typescale('label-small');

  font-size: 11rem;
  line-height: 16rem;

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &--dot {
    --ui-badge-size: 6rem;

    padding-inline: 0;
    min-width: var(--ui-badge-size);
    min-height: var(--ui-badge-size);
  }
}
</style>
