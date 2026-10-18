<template>
  <section
    class="crm-tasks"
    aria-labelledby="crm-tasks-title"
  >
    <h2
      id="crm-tasks-title"
      class="crm-tasks__title"
    >
      Задачи по сделкам
    </h2>

    <MAlert
      v-if="store.overdueTasks.value.length"
      type="warning"
      icon="outline-warning-amber"
      :title="`Просрочено: ${countLabel(store.overdueTasks.value.length, ['задача', 'задачи', 'задач'])}`"
      text="Перенесите срок или закройте задачу, чтобы она не тормозила сделку."
    >
      <template #actions>
        <MButton
          v-model:selected="overdueOnly"
          variant="text"
        >
          Только просроченные
        </MButton>
      </template>
    </MAlert>

    <MList
      v-if="tasks.length"
      class="crm-tasks__list"
      aria-label="Список задач"
    >
      <MListItem
        v-for="task in tasks"
        :key="task.id"
        :headline="task.title"
        :supporting-text="task.context"
        :trailing-supporting-text="task.dueText"
        :class="{ 'crm-tasks__item--done': task.done }"
      >
        <template #leading>
          <MCheckbox
            :model-value="task.done"
            :aria-label="`Выполнено: ${task.title}`"
            @update:model-value="store.toggleTask(task.id)"
          />
        </template>

        <template
          v-if="task.overdue"
          #trailing
        >
          <MChip
            type="assist"
            :aria-label="`+1 день: перенести «${task.title}»`"
            @click="store.postponeTask(task.id)"
          >
            <template #icon>
              <MIcon name="outline-event" />
            </template>
            +1 день
          </MChip>
        </template>
      </MListItem>
    </MList>

    <p
      v-else
      class="crm-tasks__empty"
    >
      Задач по выбранным сделкам нет.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CRM_TODAY, countLabel, daysBetween, formatShortDate } from '../data/crmFormat'
import { findOwner } from '../data/crmLookup'
import type { CrmTask } from '../data/crmTypes'
import { useCrmStore } from '../composables/useCrmStore'

const store = useCrmStore()
const overdueOnly = ref(false)

function dueText(task: CrmTask): string {
  const days = daysBetween(CRM_TODAY, task.due)
  if (task.done) return 'Готово'
  if (days === 0) return 'Сегодня'
  if (days < 0) return `Просрочена на ${countLabel(-days, ['день', 'дня', 'дней'])}`
  return `До ${formatShortDate(task.due)}`
}

const tasks = computed(() => {
  const visible = new Set(store.visibleDeals.value.map(deal => deal.id))
  const titles = new Map(store.deals.value.map(deal => [deal.id, deal.title]))

  return store.tasks.value
    .filter(task => visible.has(task.dealId))
    .filter(task => !overdueOnly.value || (!task.done && task.due < CRM_TODAY))
    .sort((left, right) => Number(left.done) - Number(right.done) || left.due.localeCompare(right.due))
    .map(task => ({
      ...task,
      overdue: !task.done && task.due < CRM_TODAY,
      dueText: dueText(task),
      context: `${titles.get(task.dealId) ?? task.dealId} · ${findOwner(task.ownerId).name}`,
    }))
})
</script>

<style lang="scss">
.crm-tasks {
  display: grid;
  gap: spacing(16);

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('title-large');
  }

  &__list {
    border-radius: var(--sys-shape-corner-large);
    background-color: var(--md-sys-color-surface-container-low);
  }

  &__item--done {
    opacity: 0.6;
  }

  &__empty {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
