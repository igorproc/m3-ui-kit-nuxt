<template>
  <form
    class="ui-form-renderer"
    :aria-busy="form.pending.value ? 'true' : undefined"
    @submit.prevent="form.submit"
  >
    <FormRendererSummary
      v-if="summary.entries.value.length"
      ref="summaryAlert"
      :title="errorSummaryTitle"
      :entries="summary.entries.value"
      @pick="summary.focusField"
    />

    <FormRendererField
      v-for="field in fields"
      :key="field.name"
      :ref="summary.fieldRef(field.name)"
      :field="field"
    />

    <div class="ui-form-renderer__actions">
      <slot
        :pending="form.pending.value"
        :is-error="form.isError.value"
      >
        <m-button
          type="submit"
          :loading="form.pending.value"
        >
          {{ submitLabel }}
        </m-button>
      </slot>
    </div>

    <div
      class="ui-form-renderer__status"
      role="status"
    >
      {{ statusText }}
    </div>
  </form>
</template>

<script setup lang="ts">
import FormRendererField from '#kit/components/fragments/form-renderer/field/index.vue'
import FormRendererSummary from '#kit/components/fragments/form-renderer/summary/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import { useErrorSummary } from '#kit/composables/form-renderer/useErrorSummary'
import { useFormSchema } from '#kit/composables/useFormSchema'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'

interface Props {
  /**
   * The fields, in order. Read once, when the renderer is created: to switch
   * to another schema, give the renderer a new `:key`.
   */
  config: FormFieldConfig[]
  /** Called with the validated values; the button shows progress while it runs. */
  onSubmit?: (values: Record<string, unknown>) => Promise<void> | void
  /** Text of the default submit button. The kit ships no wording of its own. */
  submitLabel?: string
  /** Heading of the error summary shown above the fields after a failed submit; the kit ships none. */
  errorSummaryTitle?: string
  /** The submit result in words, read out from a status region that stays mounted; the kit ships none. */
  statusText?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** The values passed validation and `onSubmit` finished. Not `submit`: that name is the `onSubmit` prop's. */
  (event: 'submitted', values: Record<string, unknown>): void
  /** Validation stopped the submit; the messages by field. */
  (event: 'invalid', errors: Record<string, string | undefined>): void
}>()

/**
 * The values, both ways out: the model seeds the fields once (a value in it
 * wins over the field's `default`) and follows every change the user makes.
 */
const model = defineModel<Record<string, unknown>>()

const slots = defineSlots<{
  /** Replaces the default submit button. */
  default?: (scope: { pending: boolean, isError: boolean }) => unknown
}>()

const seeded = props.config.map(field => (model.value && field.name in model.value ? { ...field, default: model.value[field.name] } : field))

const summaryAlert = useTemplateRef<{ focus: () => void }>('summaryAlert')
const summary = useErrorSummary(seeded, () => summaryAlert.value?.focus())

const { form, fields } = useFormSchema(seeded, {
  onSubmit: async (values) => {
    summary.clear()
    await props.onSubmit?.(values)
    emit('submitted', values)
  },
  onValidationError: (errors) => {
    summary.show(errors)
    if (import.meta.dev && !props.errorSummaryTitle) {
      console.warn('[m-form-renderer] the error summary has no title: pass `error-summary-title`.')
    }
    emit('invalid', errors)
  },
})

watch(() => form.values.value, (values) => {
  model.value = { ...values }
}, { deep: true })

if (import.meta.dev) {
  watchEffect(() => {
    if (!slots.default && !props.submitLabel) {
      console.warn('[m-form-renderer] the default submit button has no name: pass `submit-label` or fill the default slot.')
    }
  })

  for (const field of props.config) {
    const own = field.props ?? {}
    const controls = own.controls ?? 'split'
    const named = (own.incrementLabel ?? own['increment-label']) && (own.decrementLabel ?? own['decrement-label'])
    if (field.type === 'number' && (controls === 'split' || controls === 'stacked') && !named) {
      console.warn(`[m-form-renderer] the steppers of the number field "${field.name}" have no names: pass \`incrementLabel\` and \`decrementLabel\` in its \`props\`.`)
    }
  }
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/form-renderer' as t;

.ui-form-renderer {
  $t: material-map(t.$tokens, 'md-form-renderer');

  display: flex;
  flex-direction: column;
  gap: g($t, 'gap');

  // At the end of the row, as the actions of M3 dialogs and cards (W29-А).
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: g($t, 'actions.gap');
  }

  &__status {
    @include sr-only;
  }
}
</style>
