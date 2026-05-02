<template>
  <nav class="ui-navigation-bar">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="ui-navigation-bar__item"
      :class="{ 'ui-navigation-bar__item--active': item.id === modelValue }"
      @click="onSelect(item.id)"
    >
      <span class="ui-navigation-bar__icon-wrapper">
        <ui-icon
          class="ui-navigation-bar__icon"
          :name="item.icon"
          aria-hidden="true"
        />

        <ui-badge
          v-if="item.badge != null && item.badge > 0"
          class="ui-navigation-bar__badge"
          variant="standard"
          :value="item.badge"
        />
      </span>

      <span class="ui-navigation-bar__label">
        {{ item.label }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
interface NavigationItem {
  id: string
  icon: string
  label: string
  badge?: number
}

interface Props {
  items: NavigationItem[]
}

defineProps<Props>()

const modelValue = defineModel<string | null>({ default: null })

function onSelect(id: string) {
  modelValue.value = id
}
</script>

<style lang="scss">
.ui-navigation-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-inline: 12rem;
  padding-block: 8rem;
  border-radius: var(--sys-shape-corner-large);
  background-color: var(--color-surface);
  box-shadow:
    0 -2rem 4rem rgb(0 0 0 / 8%),
    0 -4rem 8rem rgb(0 0 0 / 10%);
  color: var(--color-surface-variant-contrast);

  &__item {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    padding-block: 4rem;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--color-on-surface-variant);

    @include typescale('label-medium');
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
    max-width: 72rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item--active {
    color: var(--color-primary);
  }
}
</style>
