<template>
  <section class="fixture-radio-stress">
    <h1>MRadio — stress content</h1>

    <div class="fixture-radio-stress__narrow">
      <MRadioGroup
        v-model="plan"
        data-test="long-group"
        label="Which plan should we switch the whole organisation to at the start of the next billing period"
        helper-text="You can change the plan again at any time; the difference is settled on the next invoice"
        required
      >
        <MRadio
          value="team"
          label="Team — up to twenty members, shared projects, comments and reviews, weekly digest"
        />
        <MRadio
          value="url"
          label="https://example.com/a/very/long/path/without/any/spaces/at/all"
        />
        <MRadio
          value="script"
          label="Сохранить 保存 حفظ 🙂"
        />
      </MRadioGroup>
    </div>

    <div class="fixture-radio-stress__narrow">
      <MRadioGroup
        v-model="errorPlan"
        data-test="long-error"
        label="Plan"
        error-message="Choose one of the plans before you continue to the payment step of the checkout"
      >
        <MRadio
          value="free"
          label="Free"
        />
      </MRadioGroup>
    </div>

    <MRadioGroup
      v-model="size"
      data-test="many"
      label="Size"
    >
      <MRadio
        v-for="option in sizes"
        :key="option"
        :value="option"
        :label="option"
      />
    </MRadioGroup>

    <h2>A value that changes after mount</h2>
    <MRadioGroup
      v-model="tier"
      data-test="changing"
      label="Tier"
    >
      <MRadio
        value="a"
        label="Basic"
      />
      <MRadio
        :value="changing"
        label="Changing"
      />
    </MRadioGroup>
    <MButton
      variant="outlined"
      data-test="change-value"
      @click="changing = changing === 'b' ? 'b2' : 'b'"
    >
      Change the value
    </MButton>
    <output data-test="tier">{{ tier ?? '' }}</output>

    <h2>No name (warns in development)</h2>
    <MRadioGroup
      v-model="nameless"
      data-test="nameless"
    >
      <MRadio
        value="x"
        label="Unnamed option"
      />
    </MRadioGroup>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MRadio from '#kit/components/ui/radio/index.vue'
import MRadioGroup from '#kit/components/ui/radio/group/index.vue'

const sizes = Array.from({ length: 16 }, (_, index) => `Size ${index + 1}`)

const plan = ref('team')
const errorPlan = ref<string>()
const size = ref('Size 1')
const tier = ref<string>()
const changing = ref('b')
const nameless = ref<string>()
</script>

<style lang="scss">
.fixture-radio-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    inline-size: 200rem;
  }
}
</style>
