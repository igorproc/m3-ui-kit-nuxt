<template>
  <section class="fixture-otp">
    <h1>MOtpInput — state matrix</h1>

    <div
      v-for="state in states"
      :key="state.name"
      class="fixture-otp__case"
      :data-test="state.name"
    >
      <MOtpInput
        v-model="values[state.name]"
        :label="`Code, ${state.name}`"
        v-bind="state.props"
      />
    </div>

    <div
      class="fixture-otp__case"
      data-test="live"
    >
      <MOtpInput
        v-model="liveCode"
        label="Code, validated on complete"
        :error-message="liveError"
        @complete="validate"
      />
    </div>
    <output data-test="completions">{{ completions }}</output>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MOtpInput from '#kit/components/ui/otp-input/index.vue'

const states = [
  { name: 'empty', props: {} },
  { name: 'partial', props: {} },
  { name: 'filled', props: {} },
  { name: 'grouped', props: { groups: [3, 3], separator: '–' } },
  { name: 'masked', props: { mask: true } },
  { name: 'alphanumeric', props: { mode: 'alphanumeric' as const, length: 4 } },
  { name: 'error-message', props: { errorMessage: 'The code is wrong' } },
  { name: 'error-only', props: { error: true } },
  { name: 'disabled', props: { disabled: true } },
  { name: 'readonly', props: { readonly: true } },
  { name: 'loading', props: { loading: true } },
  { name: 'label-hidden', props: { labelPlacement: 'hidden' as const } },
]

const values = reactive<Record<string, string>>({
  'partial': '12',
  'filled': '123456',
  'grouped': '1234',
  'masked': '123',
  'error-message': '111111',
  'error-only': '111111',
  'disabled': '12',
  'readonly': '123456',
  'loading': '123456',
})

const liveCode = ref('')
const liveError = ref<string>()
const completions = ref(0)

// The error arrives after the code is complete, the way a server check reports it.
function validate(code: string) {
  completions.value += 1
  liveError.value = code === '000000' ? undefined : 'The code is wrong'
}
</script>

<style lang="scss">
.fixture-otp {
  display: grid;
  gap: 24rem;
  justify-items: start;
}
</style>
