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
@use '~/assets/stylesheet/components/navigation-rail' as v;

.ui-navigation-rail {
  width: v.$width;
  padding-block: v.$padding-block;
  padding-inline: v.$padding-inline;
  border-radius: v.$border-radius;
  background-color: v.$bg-color;
  box-shadow: v.$shadow;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: v.$gap;
  color: v.$text-color;

  &__item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: v.$item-gap;
    padding: v.$item-padding;
    border: none;
    background: transparent;
    cursor: pointer;
    color: v.$item-color;

    @include typescale(v.$item-text-type);
  }

  &__icon-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    font-size: v.$icon-size;
  }

  &__badge {
    position: absolute;
    top: v.$badge-top;
    right: v.$badge-right;
  }

  &__label {
    text-align: center;
  }

  &__item--active {
    color: v.$item-active-color;
  }
}
</style>
