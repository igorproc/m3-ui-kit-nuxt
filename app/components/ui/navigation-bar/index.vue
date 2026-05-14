<template>
  <nav
    class="ui-navigation-bar"
    :style="layoutItemStyles"
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="ui-navigation-bar__item"
      :class="{ 'ui-navigation-bar__item--active': item.id === modelValue }"
      @click="onSelect(item.id)"
    >
      <span class="ui-navigation-bar__icon-wrapper">
        <m-icon
          class="ui-navigation-bar__icon"
          :name="item.icon"
          aria-hidden="true"
        />

        <m-badge
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

// Self-register in layout system as footer area
const { layoutItemStyles } = useLayoutItem({
  id: 'navigation-bar',
  area: 'footer',
})

const modelValue = defineModel<string | null>({ default: null })

function onSelect(id: string) {
  modelValue.value = id
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/navigation-bar' as v;

.ui-navigation-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-inline: v.$padding-inline;
  padding-block: v.$padding-block;
  border-radius: v.$border-radius;
  background-color: v.$bg-color;
  box-shadow: v.$shadow;
  color: v.$text-color;

  &__item {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: v.$item-gap;
    padding-block: v.$item-padding-block;
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
    max-width: v.$label-max-width;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item--active {
    color: v.$item-active-color;
  }
}
</style>
