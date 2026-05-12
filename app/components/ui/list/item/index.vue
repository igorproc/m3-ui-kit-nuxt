<template>
  <component
    :is="tag"
    class="ui-list-item"
    :class="{
      'ui-list-item--interactive': interactive || tag === 'button' || tag === 'a' || to,
      'ui-list-item--disabled': disabled,
    }"
    :disabled="disabled"
    v-bind="bindings"
  >
    <div
      v-if="$slots.leading || leadingIcon"
      class="ui-list-item__leading"
    >
      <slot name="leading">
        <m-icon
          v-if="leadingIcon"
          :name="leadingIcon"
        />
      </slot>
    </div>

    <div class="ui-list-item__body">
      <div
        v-if="headline"
        class="ui-list-item__headline"
      >
        {{ headline }}
      </div>
      <slot />
      <div
        v-if="supportingText"
        class="ui-list-item__supporting"
      >
        {{ supportingText }}
      </div>
    </div>

    <div
      v-if="$slots.trailing || trailingIcon"
      class="ui-list-item__trailing"
    >
      <slot name="trailing">
        <m-icon
          v-if="trailingIcon"
          :name="trailingIcon"
        />
      </slot>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { NuxtLinkProps } from '#app'

const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

interface Props {
  headline?: string
  supportingText?: string
  leadingIcon?: string
  trailingIcon?: string
  tag?: string
  to?: NuxtLinkProps['to']
  disabled?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  headline: '',
  supportingText: '',
  leadingIcon: '',
  trailingIcon: '',
  to: undefined,
  disabled: false,
  interactive: false,
})

const bindings = computed(() => {
  if (props.to) {
    return { to: props.to }
  }
  return {}
})

const tag = computed(() => {
  if (props.to) {
    return NuxtLink
  }
  return props.tag
})
</script>

<style lang="scss">
.ui-list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16rem;
  padding: 8rem 16rem;
  min-height: 56rem; // One-line height (M3 specs)
  border-radius: var(--sys-shape-corner-small);
  background-color: transparent;
  border: none;
  width: 100%;
  text-align: left;
  color: var(--color-on-surface);
  text-decoration: none;
  box-sizing: border-box;
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  &--interactive {
    cursor: pointer;

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, transparent);
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    }
  }

  &--disabled {
    cursor: default;
    opacity: 0.38;
    pointer-events: none;
  }

  &__leading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-on-surface-variant);
    font-size: 24rem;
  }

  &__body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  &__headline {
    color: var(--color-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @include typescale('body-large');
  }

  &__supporting {
    color: var(--color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @include typescale('body-medium');
  }

  &__trailing {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-on-surface-variant);
    font-size: 24rem;
  }
}
</style>
