<template>
  <section class="fixture-dialog">
    <h1>MDialog — matrix</h1>

    <div class="fixture-dialog__row">
      <MButton
        v-for="item in cases"
        :key="item.id"
        variant="outlined"
        :data-test="`open-${item.id}`"
        @click="opened = item.id"
      >
        {{ item.label }}
      </MButton>
    </div>
    <output data-test="result">{{ result }}</output>

    <MDialog
      v-for="item in cases"
      :key="item.id"
      :model-value="opened === item.id"
      :title="item.title"
      :role="item.role"
      :persistent="item.persistent"
      :aria-label="item.ariaLabel"
      :data-test="`dialog-${item.id}`"
      @update:model-value="opened = $event ? item.id : ''"
      @confirm="result = `confirm:${$event}`"
      @cancel="result = `cancel:${$event}`"
    >
      <template
        v-if="item.icon"
        #icon
      >
        <MIcon :name="ICONS.settings" />
      </template>
      <template
        v-if="item.titleSlot"
        #title
      >
        Delete <em>draft</em>?
      </template>

      <p>{{ item.text }}</p>
      <MTextField
        v-if="item.autofocus"
        v-model="fileName"
        label="File name"
        autofocus
        :data-test="`${item.id}-field`"
      />

      <template #actions="{ confirm, cancel }">
        <MButton
          v-if="item.actions > 2"
          variant="text"
          :data-test="`${item.id}-extra`"
          @click="confirm('later')"
        >
          Later
        </MButton>
        <MButton
          v-if="item.actions > 1"
          variant="text"
          :data-test="`${item.id}-cancel`"
          @click="cancel"
        >
          Cancel
        </MButton>
        <MButton
          variant="text"
          :data-test="`${item.id}-confirm`"
          @click="confirm(item.id)"
        >
          OK
        </MButton>
      </template>
    </MDialog>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDialog from '#kit/components/ui/dialog/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'
import type { MDialogRole } from '#kit/components/ui/dialog/props'
import { ICONS } from '#kit/shared/constants/icons'

interface DialogCase {
  id: string
  label: string
  title?: string
  titleSlot?: boolean
  ariaLabel?: string
  icon?: boolean
  role?: MDialogRole
  persistent?: boolean
  autofocus?: boolean
  actions: 1 | 2 | 3
  text: string
}

const cases: DialogCase[] = [
  { id: 'basic', label: 'Basic', title: 'Reset settings?', actions: 2, text: 'Every setting goes back to its default.' },
  { id: 'icon', label: 'With icon', title: 'Reset settings?', icon: true, actions: 2, text: 'Every setting goes back to its default.' },
  { id: 'slot-title', label: 'Title slot', titleSlot: true, actions: 2, text: 'The draft is gone for good.' },
  { id: 'aria-label', label: 'Named by aria-label', ariaLabel: 'Quick note', actions: 1, text: 'Saved to your notes.' },
  { id: 'three', label: 'Three actions', title: 'Discard changes?', actions: 3, text: 'You have unsaved changes.' },
  { id: 'persistent', label: 'Persistent', title: 'Finish setup', persistent: true, actions: 1, text: 'Only the button closes this dialog.' },
  { id: 'alert', label: 'Alert dialog', title: 'Delete project?', role: 'alertdialog', actions: 2, text: 'This cannot be undone.' },
  { id: 'autofocus', label: 'Autofocus', title: 'Rename file', autofocus: true, actions: 2, text: 'Pick a new name.' },
]

const opened = ref('')
const result = ref('')
const fileName = ref('report.pdf')
</script>

<style lang="scss">
.fixture-dialog {
  display: grid;
  gap: 16rem;
  justify-items: start;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }
}
</style>
