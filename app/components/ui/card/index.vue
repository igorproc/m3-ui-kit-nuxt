<template>
  <article
    class="ui-card"
    :class="`ui-card--${variant}`"
  >
    <div
      v-if="$slots.media"
      class="ui-card__media"
    >
      <slot name="media" />
    </div>

    <header
      v-if="$slots.header || title"
      class="ui-card__header"
    >
      <slot name="header">
        <p
          v-if="title"
          class="ui-card__title"
        >
          {{ title }}
        </p>

        <p
          v-if="subtitle"
          class="ui-card__subtitle"
        >
          {{ subtitle }}
        </p>
      </slot>
    </header>

    <div class="ui-card__content">
      <slot />
    </div>

    <footer
      v-if="$slots.actions"
      class="ui-card__actions"
    >
      <slot name="actions" />
    </footer>
  </article>
</template>

<script setup lang="ts">
type CardVariant = 'elevated' | 'filled' | 'outlined'

interface Props {
  title?: string
  subtitle?: string
  variant?: CardVariant
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  variant: 'elevated',
})
</script>

<style lang="scss">
.ui-card {
  display: flex;
  flex-direction: column;
  gap: 12rem;
  padding: 16rem;
  border-radius: var(--sys-shape-corner-medium);
  border-width: 1rem;
  border-style: solid;
  border-color: transparent;
  background-color: var(--color-surface);
  color: var(--color-surface-contrast);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 8%);
  transition:
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  &--elevated {
    background-color: var(--color-surface-container-low, var(--color-surface));
    border-color: transparent;
    box-shadow: 0 1rem 3rem 1rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 1

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, var(--color-surface-container-low, var(--color-surface)));
      box-shadow: 0 2rem 6rem 2rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 2
    }
  }

  &--filled {
    background-color: var(--color-surface-container-highest, var(--color-surface-variant));
    border-color: transparent;
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, var(--color-surface-container-highest, var(--color-surface-variant)));
      box-shadow: 0 1rem 3rem 1rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 1
    }
  }

  &--outlined {
    background-color: var(--color-surface);
    border-color: var(--color-outline-variant);
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, var(--color-surface));
      box-shadow: 0 1rem 3rem 1rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 1
    }
  }

  &__media {
    overflow: hidden;
    margin: -16rem -16rem 0; // Full width media
    border-radius: var(--sys-shape-corner-medium) var(--sys-shape-corner-medium) 0 0;

    img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }

  &__title {
    margin: 0;

    // Typography: Title Medium
    @include typescale('title-medium');
  }

  &__subtitle {
    margin: 0;
    color: var(--color-surface-variant-contrast);

    // Typography: Body Medium
    @include typescale('body-medium');
  }

  &__content {
    flex: 1 1 auto;

    // Typography: Body Medium
    @include typescale('body-medium');
  }

  &__actions {
    margin-top: 8rem;
    display: flex;
    justify-content: flex-end;
    gap: 8rem;
  }
}
</style>
