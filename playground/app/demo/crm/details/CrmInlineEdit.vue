<template>
  <div class="crm-inline-edit">
    <div
      v-if="!tx.editing.value"
      class="crm-inline-edit__view"
    >
      <p class="crm-inline-edit__value">
        <span class="crm-inline-edit__label">{{ label }}</span>
        <span class="crm-inline-edit__text">{{ display }}</span>
      </p>
      <MButtonIcon
        ref="editButton"
        :aria-label="`Изменить: ${label.toLocaleLowerCase('ru-RU')}`"
        @click="start"
      >
        <MIcon :name="ICONS.edit" />
      </MButtonIcon>
    </div>

    <form
      v-else
      class="crm-inline-edit__form"
      novalidate
      @submit.prevent="save"
      @keydown.esc.prevent="cancel"
    >
      <MTextField
        v-if="kind === 'text'"
        ref="textField"
        class="crm-inline-edit__field"
        :model-value="String(tx.draft.value)"
        :label="label"
        :error-message="problem"
        :disabled="tx.pending.value"
        density="compact"
        @update:model-value="tx.setDraft"
      />
      <MNumberInput
        v-else
        ref="numberField"
        class="crm-inline-edit__field"
        :model-value="typeof tx.draft.value === 'number' ? tx.draft.value : null"
        :label="label"
        :error-message="problem"
        :disabled="tx.pending.value"
        locale="ru-RU"
        unit="₽"
        :min="0"
        :step="10000"
        :controls="false"
        density="compact"
        @update:model-value="value => tx.setDraft(value ?? 0)"
      />

      <MLoading
        v-if="tx.pending.value"
        inline
        size="small"
        aria-label="Сохранение"
      />
      <MButtonIcon
        type="submit"
        variant="tonal"
        aria-label="Сохранить"
        :disabled="tx.pending.value"
      >
        <MIcon :name="ICONS.check" />
      </MButtonIcon>
      <MButtonIcon
        aria-label="Отменить изменение"
        @click="cancel"
      >
        <MIcon :name="ICONS.close" />
      </MButtonIcon>
    </form>

    <p
      class="crm-inline-edit__status"
      role="status"
    >
      {{ statusText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useConfirmEditTransaction } from '#kit/composables/confirm-edit/useConfirmEditTransaction'
import type { MFieldParts } from '#kit/components/ui/text-field/props'
import { ICONS } from '#kit/shared/constants/icons'
import { formatMoney } from '../data/crmFormat'
import { useCrmDelay } from '../composables/useCrmDelay'

/**
 * The confirm-edit recipe: `MConfirmEdit` was withdrawn, the kit ships the
 * transaction (`useConfirmEditTransaction`) and leaves the markup to the app.
 */
const props = defineProps<{
  kind: 'text' | 'money'
  label: string
}>()

const model = defineModel<string | number>({ required: true })

const { wait } = useCrmDelay()

const tx = useConfirmEditTransaction<string | number>({
  model,
  save: async (draft, { signal }) => {
    await wait(600, signal)
    return typeof draft === 'string' ? draft.trim() : draft
  },
})

const editButton = ref<ComponentPublicInstance | null>(null)
const textField = ref<MFieldParts | null>(null)
const numberField = ref<MFieldParts | null>(null)
const statusText = ref('')

const display = computed(() => (props.kind === 'money' ? formatMoney(Number(model.value)) : String(model.value)))

const problem = computed(() => {
  const draft = tx.draft.value
  if (props.kind === 'text' && !String(draft).trim()) return 'Название не может быть пустым'
  if (props.kind === 'money' && !(Number(draft) > 0)) return 'Сумма должна быть больше нуля'
  if (tx.outcome.value === 'error') return 'Не удалось сохранить, попробуйте ещё раз'
  return undefined
})

async function start() {
  statusText.value = ''
  tx.begin()
  await nextTick()
  if (props.kind === 'text') textField.value?.input?.focus()
  else numberField.value?.input?.focus()
}

async function focusEditButton() {
  await nextTick()
  const element = editButton.value?.$el as HTMLElement | undefined
  element?.focus()
}

async function save() {
  if (problem.value) return
  const result = await tx.commit()
  if (result.outcome === 'saved') {
    statusText.value = `${props.label}: сохранено`
    await focusEditButton()
  }
}

function cancel() {
  tx.cancel()
  statusText.value = 'Изменение отменено'
  focusEditButton()
}

// A save in flight belongs to this field; closing the sheet abandons it.
onBeforeUnmount(() => {
  if (tx.pending.value) tx.cancel()
})
</script>

<style lang="scss">
.crm-inline-edit {
  &__view,
  &__form {
    display: flex;
    align-items: center;
    gap: spacing(8);
  }

  &__form {
    align-items: flex-start;
  }

  &__value {
    display: grid;
    flex: 1 1 auto;
    gap: spacing(2);
    margin: 0;
    min-width: 0;
  }

  &__label {
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('label-medium');
  }

  &__text {
    overflow-wrap: anywhere;
    color: var(--md-sys-color-on-surface);

    @include typescale('title-medium');
  }

  &__field {
    flex: 1 1 auto;
  }

  &__status {
    @include sr-only;
  }
}
</style>
