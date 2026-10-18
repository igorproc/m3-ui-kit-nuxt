<template>
  <MPagination
    v-model="page"
    class="crm-pager"
    :length="length"
    :total-visible="5"
    :disabled="disabled"
    show-first-last
    aria-label="Страницы списка сделок"
    first-label="Первая страница"
    previous-label="Предыдущая страница"
    next-label="Следующая страница"
    last-label="Последняя страница"
  >
    <!-- Page buttons are named by the kit in English with no prop to change
         it, so they are drawn here; the slot's `ariaLabel` key is not spread
         either, because a camelCase key renders as `arialabel` in SSR HTML. -->
    <template #item="{ page: number, current, props: control }">
      <MButton
        class="crm-pager__page"
        :variant="current ? 'tonal' : 'text'"
        :disabled="control.disabled"
        :aria-current="control.ariaCurrent"
        :aria-label="current ? `Страница ${number}, текущая` : `Перейти на страницу ${number}`"
        @click="control.onClick"
      >
        {{ number }}
      </MButton>
    </template>
  </MPagination>
</template>

<script setup lang="ts">
defineProps<{
  length: number
  disabled?: boolean
}>()

const page = defineModel<number>({ required: true })
</script>

<style lang="scss">
.crm-pager__page {
  min-width: spacing(40);
}
</style>
