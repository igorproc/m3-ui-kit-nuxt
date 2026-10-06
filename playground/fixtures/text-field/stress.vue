<template>
  <section class="fixture-stress">
    <h1>MTextField — stress content</h1>

    <div class="fixture-stress__narrow">
      <MTextField
        v-model="longLabel"
        label="Billing address as it appears on the statement of your primary card"
        data-test="long-label"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextField
        v-model="longWord"
        variant="outlined"
        label="Website"
        type="url"
        helper-text="https://example.com/a/very/long/path/without/any/spaces/at/all/that/never/breaks"
        data-test="long-word-helper"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextField
        v-model="longWord"
        label="Email"
        error-message="averyveryverylongemailaddresswithoutanybreak@example-domain-that-is-long.com is taken"
        data-test="long-word-error"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextField
        v-model="count"
        label="Quantity"
        type="number"
        data-test="zero"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextField
        v-model="mixed"
        variant="outlined"
        label="Имя 名前 الاسم 🙂"
        data-test="mixed-script"
      >
        <template #prepend>
          <MIcon name="person" />
        </template>
        <template #append>
          <MIcon name="close" />
        </template>
      </MTextField>
    </div>

    <div class="fixture-stress__narrow">
      <MTextField
        v-model="toggled"
        label="Username"
        :error-message="showError ? 'That name is taken' : undefined"
        data-test="toggle-field"
      />
      <MButton
        data-test="toggle-error"
        @click="showError = !showError"
      >
        Toggle error
      </MButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'

const longLabel = ref('')
const longWord = ref('')
// v-model casts a type="number" value; 0 must still read as a value.
const count = ref(0 as unknown as string)
const mixed = ref('Сохранить 保存 حفظ 🙂')
const toggled = ref('')
const showError = ref(false)
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    display: grid;
    gap: 8rem;
    width: min(240rem, 100%);
  }
}
</style>
