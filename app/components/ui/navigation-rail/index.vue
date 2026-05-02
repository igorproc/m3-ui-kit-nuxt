<template>
  <nav class="ui-navigation-rail">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="ui-navigation-rail__item"
      :class="{ 'ui-navigation-rail__item--active': item.id === modelValue }"
      @click="onSelect(item.id)"
    >
      <span class="ui-navigation-rail__icon-wrapper">
        <ui-icon
          class="ui-navigation-rail__icon"
          :name="item.icon"
          aria-hidden="true"
        />

        <ui-badge
          v-if="item.badge != null && item.badge > 0"
          class="ui-navigation-rail__badge"
          :value="item.badge"
        />
      </span>

      <span class="ui-navigation-rail__label">
        {{ item.label }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
interface NavigationRailItem {
  id: string
  icon: string
  label: string
  badge?: number
}

interface Props {
  items: NavigationRailItem[]
}

defineProps<Props>()

const modelValue = defineModel<string | null>({ default: null })

function onSelect(id: string) {
  modelValue.value = id
}
</script>

<style lang="scss">
.ui-navigation-rail {
  width: 80rem;
  padding-block: 12rem;
  padding-inline: 8rem;
  border-radius: var(--sys-shape-corner-large);
  background-color: var(--color-surface);
  box-shadow: 0 0 0 1rem color-mix(in srgb, var(--color-outline-variant) 40%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rem;
  color: var(--color-surface-variant-contrast);

  &__item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    padding: 4rem 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--color-on-surface-variant);

    @include typescale('label-small');
  }

  &__icon-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    font-size: 24rem;
  }

  &__badge {
    position: absolute;
    top: -12rem;
    right: -24rem;
  }

  &__label {
    text-align: center;
  }

  &__item--active {
    color: var(--color-primary);
  }
}
</style>
