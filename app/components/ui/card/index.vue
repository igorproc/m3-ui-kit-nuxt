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
@use '~/assets/stylesheet/components/card' as v;

.ui-card {
  display: flex;
  flex-direction: column;
  gap: v.$gap;
  padding: v.$padding;
  border-radius: v.$border-radius;
  border-width: v.$border-width;
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
    background-color: v.$elevated-bg;
    border-color: transparent;
    box-shadow: v.$elevated-shadow;

    &:hover {
      background-color: color-mix(in srgb, v.$state-layer-color v.$hover-opacity, v.$elevated-bg);
      box-shadow: v.$elevated-hover-shadow;
    }
  }

  &--filled {
    background-color: v.$filled-bg;
    border-color: transparent;
    box-shadow: v.$filled-shadow;

    &:hover {
      background-color: color-mix(in srgb, v.$state-layer-color v.$hover-opacity, v.$filled-bg);
      box-shadow: v.$filled-hover-shadow;
    }
  }

  &--outlined {
    background-color: v.$outlined-bg;
    border-color: v.$outlined-border-color;
    box-shadow: v.$outlined-shadow;

    &:hover {
      background-color: color-mix(in srgb, v.$state-layer-color v.$hover-opacity, v.$outlined-bg);
      box-shadow: v.$outlined-hover-shadow;
    }
  }

  &__media {
    overflow: hidden;
    margin: calc(v.$padding * -1) calc(v.$padding * -1) 0; // Full width media
    border-radius: v.$border-radius v.$border-radius 0 0;

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
    gap: 4rem; // Keeping this small gap internal
  }

  &__title {
    margin: 0;

    @include typescale(v.$title-text-type);
  }

  &__subtitle {
    margin: 0;
    color: v.$subtitle-color;

    @include typescale(v.$subtitle-text-type);
  }

  &__content {
    flex: 1 1 auto;

    @include typescale(v.$content-text-type);
  }

  &__actions {
    margin-top: 8rem; // Keeping this internal
    display: flex;
    justify-content: flex-end;
    gap: 8rem;
  }
}
</style>
