<template>
  <div
    class="ui-app-bar"
    :class="`ui-app-bar--${variant}`"
    :style="layoutItemStyles"
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
  </div>
</template>

<script setup lang="ts">
type AppBarVariant = 'center-aligned' | 'small'

interface Props {
  title?: string
  subtitle?: string
  variant?: AppBarVariant
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  variant: 'center-aligned',
})

// Self-register in layout system with correct size token
const sizeToken = computed(() =>
  props.variant === 'small'
    ? '--ui-app-bar-height-small'
    : '--ui-app-bar-height-center-aligned',
)

const { layoutItemStyles } = useLayoutItem({
  id: 'app-bar',
  sizeToken,
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/app-bar' as v;

.ui-app-bar {
  display: flex;
  align-items: center;
  gap: v.$gap;
  padding-inline: v.$padding-inline;
  padding-block: v.$padding-block;
  border-radius: v.$border-radius;
  background-color: v.$bg-color;
  color: v.$text-color;
  box-shadow: v.$shadow;
  position: sticky;
  top: 0;
  z-index: z(header);

  &--center-aligned {
    min-height: calc(var(--ui-app-bar-height-center-aligned) - #{v.$padding-block * 2});
  }

  &--small {
    min-height: var(--ui-app-bar-height-small);
  }

  &__nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: v.$nav-min-width;
    min-height: v.$nav-min-height;
  }

  &__title {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: v.$title-gap;
    min-width: 0;
  }

  &__title-text {
    margin: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    @include typescale(v.$title-text-type);
  }

  &__subtitle {
    margin: 0;
    color: v.$subtitle-color;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    @include typescale(v.$subtitle-text-type);
  }

  &__actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: v.$actions-gap;
  }
}
</style>
