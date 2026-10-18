<template>
  <section class="fixture-files">
    <h1>MFileInput — state matrix</h1>

    <div
      v-for="variant in variants"
      :key="variant"
      class="fixture-files__row"
    >
      <MFileInput
        v-for="state in states"
        :key="state.name"
        v-model="values[`${state.name}-${variant}`]"
        :variant="variant"
        :label="`Attachment ${state.name} ${variant}`"
        browse-label="Browse"
        clear-label="Remove the files"
        :reject-messages="{ type: 'not a PDF', size: 'larger than 1 KB' }"
        accept="application/pdf"
        :max-size="1024"
        v-bind="state.props"
        :data-test="`${state.name}-${variant}`"
      />
    </div>

    <h2>Without a browse label</h2>
    <MFileInput
      v-model="iconOnly"
      label="Attachment with an icon button"
      data-test="icon-only"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MFileInput from '#kit/components/ui/file-input/index.vue'

const variants = ['filled', 'outlined'] as const

const report = new File(['%PDF'], 'report.pdf', { type: 'application/pdf' })
const photo = new File(['%PDF'], 'photo.pdf', { type: 'application/pdf' })

const states = [
  { name: 'empty', props: {}, value: null },
  { name: 'one', props: {}, value: report },
  { name: 'many', props: { multiple: true }, value: [report, photo] },
  { name: 'required', props: { required: true }, value: null },
  { name: 'error', props: { errorMessage: 'Attach the signed contract' }, value: null },
  { name: 'readonly', props: { readonly: true }, value: report },
  { name: 'disabled', props: { disabled: true }, value: report },
]

const values = reactive<Record<string, File | File[] | null>>({})
for (const state of states) {
  for (const variant of variants) {
    values[`${state.name}-${variant}`] = state.value
  }
}

const iconOnly = ref<File | null>(null)
</script>

<style lang="scss">
.fixture-files {
  display: grid;
  gap: 16rem;

  &__row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280rem, 1fr));
    gap: 16rem;
  }
}
</style>
