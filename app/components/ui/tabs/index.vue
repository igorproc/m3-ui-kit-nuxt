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
          <ui-icon :name="item.icon" />
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
.ui-tabs {
  display: flex;
  flex-direction: column;
  gap: 8rem;

  &__list {
    display: flex;
    align-items: stretch;
    border-bottom: 1rem solid var(--color-outline-variant);
    width: 100%;
  }

  &__tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rem;
    padding-inline: 16rem;
    min-height: 48rem;
    flex: 1;
    border: none;
    background-color: transparent;
    color: var(--color-on-surface-variant);
    cursor: pointer;
    outline: none;
    transition:
      color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    @include typescale('label-large');

    &-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24rem;
    }

    &-label {
      white-space: nowrap;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-color: var(--color-on-surface);
      opacity: 0;
      transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    }

    &:hover::before {
      opacity: 0.08;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 3rem;
      background-color: var(--color-primary);
      border-radius: 3rem 3rem 0 0;
      transform: translateX(-50%);
      transition: width var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    }

    &--active {
      color: var(--color-primary);

      &::after {
        width: 40rem; // M3 content-aligned indicator
      }

      &::before {
        background-color: var(--color-primary);
      }
    }

    &--disabled {
      cursor: default;
      opacity: 0.38;
      pointer-events: none;
    }
  }

  &__content {
    padding: 16rem 0;
  }
}
</style>
