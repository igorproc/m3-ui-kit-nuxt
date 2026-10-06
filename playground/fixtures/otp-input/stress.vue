<template>
  <section class="fixture-otp-stress">
    <h1>MOtpInput — stress content</h1>

    <MOtpInput
      v-model="long"
      :length="12"
      label="Twelve-digit recovery code"
    />

    <div
      class="fixture-otp-stress__narrow"
      data-test="narrow"
    >
      <MOtpInput
        v-model="narrow"
        label="Code in a narrow card"
      />
    </div>

    <div class="fixture-otp-stress__narrow">
      <MOtpInput
        v-model="narrow"
        label="A label long enough to wrap: enter the six-digit code we have just sent to the number ending in 42"
        error-message="https://example.com/a/very/long/path/without/any/spaces/explaining/the/error"
      />
    </div>

    <MOtpInput
      v-model="single"
      :length="1"
      label="One character"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MOtpInput from '#kit/components/ui/otp-input/index.vue'

const long = ref('1234')
const narrow = ref('12')
const single = ref('')
</script>

<style lang="scss">
.fixture-otp-stress {
  display: grid;
  justify-items: start;
  gap: 24rem;

  &__narrow {
    width: 200rem;
  }
}
</style>
