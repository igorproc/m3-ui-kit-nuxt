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
type AppBarVariant = 'center-aligned' | 'small' | 'medium' | 'large'

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
const sizeToken = computed(() => {
  switch (props.variant) {
    case 'small':
      return '--ui-app-bar-height-small'
    case 'medium':
      return '--ui-app-bar-height-medium'
    case 'large':
      return '--ui-app-bar-height-large'
    case 'center-aligned':
    default:
      return '--ui-app-bar-height-center-aligned'
  }
})

const { layoutItemStyles } = useLayoutItem({
  id: 'app-bar',
  sizeToken,
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/app-bar' as v;

.ui-app-bar {
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: "nav title actions";
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
  transition: min-height 0.2s ease, background-color 0.2s ease;

  &--center-aligned {
    min-height: var(--ui-app-bar-height-center-aligned);

    .ui-app-bar__title {
      text-align: center;
      align-items: center;
    }
  }

  &--small {
    min-height: var(--ui-app-bar-height-small);
  }

  &--medium {
    min-height: var(--ui-app-bar-height-medium);
    grid-template-areas:
      "nav . actions"
      "title title title";
    grid-template-rows: auto 1fr;
    align-items: start;

    .ui-app-bar__title {
      align-self: end;
      padding-bottom: 24rem; // M3 standard bottom padding for prominent titles
    }

    .ui-app-bar__title-text {
      @include typescale(v.$title-text-type-medium);
    }
  }

  &--large {
    min-height: var(--ui-app-bar-height-large);
    grid-template-areas:
      "nav . actions"
      "title title title";
    grid-template-rows: auto 1fr;
    align-items: start;

    .ui-app-bar__title {
      align-self: end;
      padding-bottom: 28rem;
    }

    .ui-app-bar__title-text {
      @include typescale(v.$title-text-type-large);
    }
  }

  &__nav {
    grid-area: nav;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: v.$nav-min-width;
    min-height: v.$nav-min-height;
    margin-left: calc(-1 * (v.$padding-inline - 4rem)); // Offset by 4px from left edge per M3 spec
  }

  &__title {
    grid-area: title;
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

    @include typescale(v.$title-text-type-small);
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
    grid-area: actions;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: v.$actions-gap;
    margin-right: calc(-1 * (v.$padding-inline - 4rem)); // Offset by 4px from right edge per M3 spec
  }
}
</style>
