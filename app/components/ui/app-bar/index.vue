<template>
  <header
    class="ui-app-bar"
    :class="`ui-app-bar--${variant}`"
  >
    <div
      v-if="$slots.nav"
      class="ui-app-bar__nav"
    >
      <slot name="nav" />
    </div>

    <div class="ui-app-bar__title">
      <slot name="title">
        <p
          v-if="title"
          class="ui-app-bar__title-text"
        >
          {{ title }}
        </p>
      </slot>

      <p
        v-if="subtitle"
        class="ui-app-bar__subtitle"
      >
        {{ subtitle }}
      </p>
    </div>

    <div
      v-if="$slots.actions"
      class="ui-app-bar__actions"
    >
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
type AppBarVariant = 'center-aligned' | 'small'

interface Props {
  title?: string
  subtitle?: string
  variant?: AppBarVariant
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  variant: 'center-aligned',
})
</script>

<style lang="scss">
.ui-app-bar {
  display: flex;
  align-items: center;
  gap: 8rem;
  padding-inline: 16rem;
  padding-block: 8rem;
  border-radius: 0 0 var(--sys-shape-corner-large) var(--sys-shape-corner-large);
  background-color: var(--color-surface);
  color: var(--color-surface-contrast);
  box-shadow:
    0 1rem 2rem rgb(0 0 0 / 8%),
    0 2rem 4rem rgb(0 0 0 / 8%);
  position: relative;
  z-index: 1;

  &--center-aligned {
    min-height: 80rem;
  }

  &--small {
    min-height: 64rem;
  }

  &__nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48rem;
    min-height: 48rem;
  }

  &__title {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2rem;
    min-width: 0;
  }

  &__title-text {
    margin: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    // Typography: Title Large (M3 small/center-aligned top app bar)
    @include typescale('title-large');
  }

  &__subtitle {
    margin: 0;
    color: var(--color-surface-variant-contrast);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    // Typography: Body Medium
    @include typescale('body-medium');
  }

  &__actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4rem;
  }
}
</style>
