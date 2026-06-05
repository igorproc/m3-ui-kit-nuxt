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
@use '~/assets/stylesheet/components/card/index' as t;

$prefix: 'md-card';

.ui-card {
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  gap: g($t, 'gap');
  padding: g($t, 'padding');
  border-radius: g($t, 'radius');
  border-width: g($t, 'border-width');
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
    background-color: g($t, 'elevated-bg');
    border-color: transparent;
    box-shadow: g($t, 'elevated-shadow');

    &:hover {
      background-color: color-mix(in srgb, #{g($t, 'state-layer-color')} #{g($t, 'hover-opacity')}, #{g($t, 'elevated-bg')});
      box-shadow: g($t, 'elevated-hover-shadow');
    }
  }

  &--filled {
    background-color: g($t, 'filled-bg');
    border-color: transparent;
    box-shadow: g($t, 'filled-shadow');

    &:hover {
      background-color: color-mix(in srgb, #{g($t, 'state-layer-color')} #{g($t, 'hover-opacity')}, #{g($t, 'filled-bg')});
      box-shadow: g($t, 'filled-hover-shadow');
    }
  }

  &--outlined {
    background-color: g($t, 'outlined-bg');
    border-color: g($t, 'outlined-border-color');
    box-shadow: g($t, 'outlined-shadow');

    &:hover {
      background-color: color-mix(in srgb, #{g($t, 'state-layer-color')} #{g($t, 'hover-opacity')}, #{g($t, 'outlined-bg')});
      box-shadow: g($t, 'outlined-hover-shadow');
    }
  }

  &__media {
    overflow: hidden;
    margin: calc(#{g($t, 'padding')} * -1) calc(#{g($t, 'padding')} * -1) 0; // Full width media
    border-radius: g($t, 'radius') g($t, 'radius') 0 0;

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

    @include typescale(g($t, 'title-type'));
  }

  &__subtitle {
    margin: 0;
    color: g($t, 'subtitle-color');

    @include typescale(g($t, 'subtitle-type'));
  }

  &__content {
    flex: 1 1 auto;

    @include typescale(g($t, 'content-type'));
  }

  &__actions {
    margin-top: 8rem; // Keeping this internal
    display: flex;
    justify-content: flex-end;
    gap: 8rem;
  }
}
</style>
