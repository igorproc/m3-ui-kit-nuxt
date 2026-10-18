<template>
  <span class="order-customer">
    <!-- Decorative: the name is right beside it. -->
    <MAvatar
      :name="name"
      alt=""
      density="compact"
      :variant="business ? 'outlined' : 'tonal'"
      :shape="business ? 'medium' : 'full'"
    />
    <span class="order-customer__text">
      <span class="order-customer__name">{{ name }}</span>
      <span class="order-customer__email">{{ email }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  email: string
}>()

const business = computed(() => /^(?:ООО|ИП)\s/.test(props.name))
</script>

<style lang="scss">
.order-customer {
  display: inline-flex;
  align-items: center;
  gap: spacing(12);
  min-width: 0;

  &__text {
    display: grid;
    min-width: 0;
  }

  &__name {
    overflow-wrap: anywhere;
  }

  &__email {
    color: var(--md-sys-color-on-surface-variant);
    overflow-wrap: anywhere;

    @include typescale('body-small');
  }
}
</style>
