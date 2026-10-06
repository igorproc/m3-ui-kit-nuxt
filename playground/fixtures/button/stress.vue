<template>
  <section class="fixture-stress">
    <h1>MButton — stress content</h1>

    <div class="fixture-stress__narrow">
      <MButton data-test="long-text">
        Save all pending changes to the shared workspace and notify every reviewer
      </MButton>
    </div>

    <div class="fixture-stress__narrow">
      <MButton data-test="long-word">
        https://example.com/a/very/long/path/without/any/spaces/at/all
      </MButton>
    </div>

    <MButton data-test="one-char">
      ×
    </MButton>

    <MButton
      data-test="empty"
      aria-label="Empty label"
    />

    <MButton data-test="mixed-script">
      Сохранить 保存 حفظ 🙂
    </MButton>

    <div class="fixture-stress__narrow">
      <MButtonExtendedFab data-test="extended-long">
        <template #prepend>
          <MIcon :name="ICONS.edit" />
        </template>
        Compose a new message to everyone on the distribution list
      </MButtonExtendedFab>
    </div>

    <div class="fixture-stress__narrow">
      <MButtonSegmented
        v-model="segment"
        :items="longSegments"
        aria-label="Long segments"
        data-test="segmented-long"
      />
    </div>

    <MButtonSegmented
      v-model="segment"
      :items="manySegments"
      aria-label="Many segments"
      data-test="segmented-many"
    />

    <h2>Loading keeps the width</h2>
    <MButton
      data-test="toggle-loading"
      variant="outlined"
      @click="loading = !loading"
    >
      Toggle loading
    </MButton>
    <div class="fixture-row">
      <MButton
        :loading="loading"
        data-test="loading-label"
      >
        Submit
      </MButton>
      <MButton
        :loading="loading"
        data-test="loading-prepend"
      >
        <template #prepend>
          <MIcon :name="ICONS.add" />
        </template>
        Add item
      </MButton>
      <MButtonExtendedFab
        :loading="loading"
        data-test="loading-extended"
      >
        Compose
      </MButtonExtendedFab>
      <MButtonIcon
        :loading="loading"
        aria-label="Refresh"
        data-test="loading-icon"
      >
        <MIcon :name="ICONS.history" />
      </MButtonIcon>
    </div>

    <h2>A press while busy does nothing</h2>
    <MButton
      :loading="submitting"
      data-test="submit-once"
      @click="submit"
    >
      Send
    </MButton>
    <output data-test="submissions">{{ submissions }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MButtonExtendedFab from '#kit/components/ui/button/extended-fab/index.vue'
import MButtonSegmented from '#kit/components/ui/button/segmented/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

const longSegments = [
  { label: 'Everything that happened today', value: 'today' },
  { label: 'Supercalifragilisticexpialidocious', value: 'word' },
]
const manySegments = Array.from({ length: 10 }, (_, index) => ({ label: `Option ${index + 1}`, value: index }))

const segment = ref<string | number>('today')
const loading = ref(false)
const submitting = ref(false)
const submissions = ref(0)

// The first press starts the work; the button turns busy before a second can land.
function submit() {
  submissions.value += 1
  submitting.value = true
}
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: 160rem;
  }
}

.fixture-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rem;
}
</style>
