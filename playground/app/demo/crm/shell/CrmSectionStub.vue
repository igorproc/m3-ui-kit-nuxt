<template>
  <MCard
    variant="outlined"
    class="crm-section-stub"
    :title="label"
    subtitle="Этот раздел не входит в демо"
    :heading-level="2"
  >
    <p class="crm-section-stub__text">
      Демо показывает работу со сделками: воронку, таблицу, задачи и карточку
      сделки. Раздел «{{ label }}» оставлен в навигации, чтобы проверить меню
      на всех размерах окна.
    </p>

    <template #actions>
      <MButton
        tag="link"
        :to="dealsLink"
      >
        Перейти к сделкам
      </MButton>
    </template>
  </MCard>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  label: string
  dealsLink: RouteLocationRaw
}>()
</script>

<style lang="scss">
.crm-section-stub {
  max-width: 640rem;

  &__text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-large');
  }
}
</style>
