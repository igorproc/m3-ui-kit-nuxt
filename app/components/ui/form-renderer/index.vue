<template>
  <form
    class="ui-form-renderer"
    @submit.prevent="form.submit"
  >
    <m-form-renderer-field
      v-for="field in fields"
      :key="field.name"
      :field="field"
    />

    <div class="ui-form-renderer__actions">
      <slot
        :pending="form.pending.value"
        :is-error="form.isError.value"
      >
        <m-button
          type="submit"
          :disabled="form.pending.value"
        >
          Submit
        </m-button>
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useFormSchema, type FormFieldConfig } from '~/composables/useFormSchema'

interface Props {
  config: FormFieldConfig[]
  onSubmit?: (values: Record<string, unknown>) => Promise<void> | void
}

const props = defineProps<Props>()

const { form, fields } = useFormSchema(props.config, { onSubmit: props.onSubmit })
</script>

<style lang="scss">
.ui-form-renderer {
  display: flex;
  flex-direction: column;
  gap: 16rem;

  &__actions {
    display: flex;
    gap: 8rem;
  }
}
</style>
