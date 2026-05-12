<template>
  <div class="ui-tabs">
    <div
      class="ui-tabs__list"
      role="tablist"
    >
      <button
        v-for="item in items"
        :key="item.value"
        class="ui-tabs__tab"
        :class="{
          'ui-tabs__tab--active': item.value === currentValue,
          'ui-tabs__tab--disabled': item.disabled,
        }"
        type="button"
        role="tab"
        :aria-selected="item.value === currentValue"
        :disabled="item.disabled"
        @click="onSelect(item)"
      >
        <span
          v-if="item.icon"
          class="ui-tabs__tab-icon"
        >
          <m-icon :name="item.icon" />
        </span>

        <span class="ui-tabs__tab-label">
          {{ item.label }}
        </span>
      </button>
    </div>

    <div
      v-if="$slots.default"
      class="ui-tabs__content"
      role="tabpanel"
    >
      <slot :value="currentValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
type TabValue = string | number

interface TabItem {
  value: TabValue
  label: string
  icon?: string
  disabled?: boolean
}

interface Props {
  items: TabItem[]
}

const props = defineProps<Props>()

const modelValue = defineModel<TabValue | null>({ default: null })

const currentValue = computed<TabValue | null>(() => {
  if (modelValue.value !== null && modelValue.value !== undefined) {
    return modelValue.value
  }

  return props.items?.[0]?.value ?? null
})

function onSelect(item: TabItem) {
  if (item.disabled) {
    return
  }

  modelValue.value = item.value
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/tabs' as v;

.ui-tabs {
  display: flex;
  flex-direction: column;
  gap: v.$list-gap;

  &__list {
    display: flex;
    align-items: stretch;
    border-bottom: 1rem solid v.$list-border-color;
    width: 100%;
  }

  &__tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: v.$tab-gap;
    padding-inline: v.$tab-padding-inline;
    min-height: v.$tab-min-height;
    flex: 1;
    border: none;
    background-color: transparent;
    color: v.$tab-text-color;
    cursor: pointer;
    outline: none;
    transition:
      color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    @include typescale(v.$tab-text-type);

    &-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: v.$tab-icon-size;
    }

    &-label {
      white-space: nowrap;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-color: v.$tab-state-layer-bg;
      opacity: 0;
      transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    }

    &:hover::before {
      opacity: v.$state-layer-opacity-hover;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: v.$tab-indicator-height;
      background-color: v.$tab-indicator-color;
      border-radius: 3rem 3rem 0 0;
      transform: translateX(-50%);
      transition: width var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    }

    &--active {
      color: v.$tab-active-color;

      &::after {
        width: v.$tab-active-indicator-width;
      }

      &::before {
        background-color: v.$tab-active-state-layer-bg;
      }
    }

    &--disabled {
      cursor: default;
      opacity: v.$tab-disabled-opacity;
      pointer-events: none;
    }
  }

  &__content {
    padding: v.$content-padding;
  }
}
</style>
