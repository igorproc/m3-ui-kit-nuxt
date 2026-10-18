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

    <div
      class="fixture-otp-stress__grid"
      data-test="grid-column"
    >
      <MOtpInput
        v-model="grouped"
        :groups="[3, 3]"
        label="Code in a 200 grid column"
      />
    </div>

    <div
      class="fixture-otp-stress__flex"
      data-test="flex-row"
    >
      <MOtpInput
        v-model="eight"
        :length="8"
        :groups="[4, 4]"
        label="Eight-digit code in a flex row"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MOtpInput from '#kit/components/ui/otp-input/index.vue'

const long = ref('1234')
const narrow = ref('12')
const single = ref('')
const grouped = ref('123')
const eight = ref('1234')
</script>

<style lang="scss">
.fixture-otp-stress {
  display: grid;
  justify-items: start;
  gap: 24rem;

  &__narrow {
    width: 200rem;
  }

  // A grid or flex parent used to keep the code at its content width.
  &__grid {
    display: grid;
    grid-template-columns: 200rem;
  }

  &__flex {
    display: flex;
    width: 200rem;
  }
}
</style>
