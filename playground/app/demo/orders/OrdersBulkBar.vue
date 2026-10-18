<template>
  <MToolbar
    class="orders-bulk"
    role="group"
    aria-label="Действия с выбранными заказами"
  >
    <!-- `group`, not `toolbar`: MToolbar has no arrow-key navigation, which the toolbar role promises. -->
    <p
      class="orders-bulk__count"
      aria-live="polite"
    >
      {{ countText }}
    </p>

    <MButton
      variant="tonal"
      density="compact"
      @click="emit('ship')"
    >
      <template #prepend>
        <MIcon name="ic:outline-local-shipping" />
      </template>
      В доставку
    </MButton>

    <MButton
      variant="text"
      density="compact"
      @click="emit('print')"
    >
      <template #prepend>
        <MIcon name="ic:outline-print" />
      </template>
      Накладные
    </MButton>

    <MButtonSplit
      variant="outlined"
      density="compact"
      trailing-aria-label="Другие форматы экспорта"
      @click="emit('export', 'csv')"
    >
      <template #prepend>
        <MIcon name="ic:outline-file-download" />
      </template>
      Экспорт CSV

      <template #menu="{ close }">
        <button
          v-for="format in EXPORT_FORMATS"
          :key="format.id"
          type="button"
          class="ui-menu__item"
          @click="emit('export', format.id); close()"
        >
          <span class="ui-menu__item-label">{{ format.label }}</span>
        </button>
      </template>
    </MButtonSplit>

    <MButtonIcon
      density="compact"
      aria-label="Снять выделение"
      @click="emit('clear')"
    >
      <MIcon name="ic:outline-close" />
    </MButtonIcon>
  </MToolbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { pluralize } from './data/format'
import type { ExportFormat } from './data/model'

const props = defineProps<{
  count: number
}>()

const emit = defineEmits<{
  (event: 'ship' | 'print' | 'clear'): void
  (event: 'export', format: ExportFormat): void
}>()

const EXPORT_FORMATS: { id: ExportFormat, label: string }[] = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
  { id: 'pdf', label: 'PDF для бухгалтерии' },
  { id: 'email', label: 'Отправить на почту' },
]

const countText = computed(() => `Выбрано: ${pluralize(props.count, ['заказ', 'заказа', 'заказов'])}`)
</script>

<style lang="scss">
.orders-bulk {
  max-width: 100%;

  &__count {
    margin: 0;
    margin-inline-end: auto;
    padding-inline: spacing(8);
    color: var(--md-sys-color-on-surface);

    @include typescale('label-large');
  }
}
</style>
