<template>
  <section
    class="fixture-toolbar"
    data-test="toolbar-fixture"
  >
    <h1>MToolbar — matrix</h1>

    <h2>Floating, standard and vibrant</h2>
    <div class="fixture-toolbar__row">
      <MToolbar
        v-model="format"
        :items="formatItems"
        multiple
        aria-label="Formatting"
        data-test="floating-standard"
      />
      <MToolbar
        v-model="format"
        :items="formatItems"
        multiple
        scheme="vibrant"
        aria-label="Formatting, vibrant"
        data-test="floating-vibrant"
      >
        <template #fab>
          <MButtonFab
            aria-label="Compose"
            data-test="fab"
          >
            <MIcon name="round-edit" />
          </MButtonFab>
        </template>
      </MToolbar>
    </div>

    <h2>Vertical</h2>
    <MToolbar
      v-model="align"
      :items="alignItems"
      orientation="vertical"
      aria-label="Alignment"
      data-test="vertical"
    />

    <h2>Docked, with a "more" menu</h2>
    <MToolbar
      v-model="view"
      type="docked"
      :items="viewItems"
      :max-visible="3"
      more-label="More views"
      aria-label="Views"
      data-test="docked-standard"
    />
    <MToolbar
      type="docked"
      scheme="vibrant"
      :items="actionItems"
      aria-label="Actions"
      data-test="docked-vibrant"
      @select="lastAction = $event.id"
    />
    <p>
      Last action: <span data-test="last-action">{{ lastAction }}</span>,
      view: <span data-test="view">{{ view }}</span>
    </p>

    <h2>A row that does not fit</h2>
    <div class="fixture-toolbar__narrow">
      <MToolbar
        :items="actionItems"
        aria-label="Narrow actions"
        data-test="narrow"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButtonFab from '#kit/components/ui/button/fab/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MToolbar from '#kit/components/ui/toolbar/index.vue'
import type { MToolbarItem } from '#kit/components/ui/toolbar/props'
import type { ToolbarModel } from '#kit/composables/useToolbar'

const formatItems: MToolbarItem[] = [
  { id: 'bold', icon: 'round-format-bold', ariaLabel: 'Bold' },
  { id: 'italic', icon: 'round-format-italic', ariaLabel: 'Italic' },
  { id: 'underline', icon: 'round-format-underlined', ariaLabel: 'Underline' },
]
const format = ref<ToolbarModel>(['italic'])

const alignItems: MToolbarItem[] = [
  { id: 'start', icon: 'round-format-align-left', ariaLabel: 'Align start' },
  { id: 'center', icon: 'round-format-align-center', ariaLabel: 'Align center' },
]
const align = ref<ToolbarModel>('center')

const viewItems: MToolbarItem[] = [
  { id: 'list', icon: 'round-view-list', label: 'List' },
  { id: 'grid', icon: 'round-grid-view', label: 'Grid' },
  { id: 'board', icon: 'round-view-kanban', label: 'Board' },
  { id: 'calendar', icon: 'round-calendar-month', label: 'Calendar' },
  { id: 'timeline', icon: 'round-timeline', label: 'Timeline', disabled: true },
]
const view = ref<ToolbarModel>('grid')

const actionItems: MToolbarItem[] = [
  { id: 'archive', icon: 'round-archive', ariaLabel: 'Archive' },
  { id: 'delete', icon: 'round-delete', ariaLabel: 'Delete' },
  { id: 'label', icon: 'round-label', ariaLabel: 'Label' },
  { id: 'snooze', icon: 'round-snooze', ariaLabel: 'Snooze' },
  { id: 'move', icon: 'round-drive-file-move', ariaLabel: 'Move' },
  { id: 'print', icon: 'round-print', ariaLabel: 'Print' },
  { id: 'share', icon: 'round-share', ariaLabel: 'Share' },
]
const lastAction = ref('')
</script>

<style lang="scss">
.fixture-toolbar {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 24rem;
  }

  &__narrow {
    inline-size: 200rem;
  }
}
</style>
