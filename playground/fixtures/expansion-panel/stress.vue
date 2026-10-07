<template>
  <section class="fixture-expansion-panel-stress">
    <h1>MExpansionPanel — stress content</h1>

    <h2>Long unbroken title</h2>
    <MExpansionPanel
      title="https://example.com/a/very/long/path/without/any/spaces/that/would/push/the/chevron/out"
      description="Supercalifragilisticexpialidocious-and-then-some-more-characters-without-a-break"
      data-test="panel-long-word"
    >
      <p>https://example.com/another/very/long/path/inside/the/content/without/any/spaces/at/all</p>
    </MExpansionPanel>

    <h2>Form in a collapsed panel</h2>
    <MExpansionPanel
      v-model="formOpen"
      title="Billing address"
      data-test="panel-form"
    >
      <form
        class="fixture-expansion-panel-stress__form"
        @submit.prevent
      >
        <label
          v-for="field in fields"
          :key="field"
        >
          {{ field }}
          <input
            :name="field"
            :data-test="`field-${field}`"
          >
        </label>
      </form>
    </MExpansionPanel>
    <MExpansionPanel
      title="Delivery notes"
      data-test="panel-after-form"
    >
      <p>Leave the parcel at the door.</p>
    </MExpansionPanel>

    <h2>Closed from inside</h2>
    <MExpansionPanel
      v-model="doneOpen"
      title="Review your order"
      data-test="panel-close-from-inside"
    >
      <MButton
        data-test="close-from-inside"
        @click="doneOpen = false"
      >
        Done
      </MButton>
    </MExpansionPanel>

    <h2>No title, named by aria-label</h2>
    <MExpansionPanel
      aria-label="Untitled section"
      data-test="panel-aria-label"
    >
      <p>The name reaches the header button through the attributes.</p>
    </MExpansionPanel>

    <h2>Twenty panels, mode and value switched on the fly</h2>
    <div class="fixture-expansion-panel-stress__controls">
      <label>
        <input
          v-model="multiple"
          type="checkbox"
          data-test="toggle-multiple"
        >
        Several open at once
      </label>
      <button
        type="button"
        data-test="rename-second"
        @click="secondValue = 'p2-renamed'"
      >
        Rename the second panel
      </button>
    </div>
    <MExpansionPanels
      v-model="twenty"
      :multiple="multiple"
      data-test="group-twenty"
    >
      <MExpansionPanel
        v-for="index in 20"
        :key="index"
        :value="index === 2 ? secondValue : `p${index}`"
        :title="`Question ${index}`"
        :data-test="`twenty-${index}`"
      >
        <p>Answer {{ index }}.</p>
      </MExpansionPanel>
    </MExpansionPanels>
    <output data-test="twenty-model">{{ Array.isArray(twenty) ? twenty.join(',') : twenty }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MExpansionPanel from '#kit/components/ui/expansion-panel/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import MExpansionPanels from '#kit/components/ui/expansion-panels/index.vue'
import type { PanelValue } from '#kit/composables/expansion-panel/useExpansionPanelGroup'

const fields = ['name', 'street', 'city', 'postcode', 'country']

const formOpen = ref(false)
const doneOpen = ref(true)
const multiple = ref(true)
const secondValue = ref('p2')
const twenty = ref<PanelValue | PanelValue[] | undefined>(['p1', 'p3'])
</script>

<style lang="scss">
.fixture-expansion-panel-stress {
  display: grid;
  gap: 16rem;
  max-width: 720rem;

  &__form,
  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
  }

  &__form label {
    display: grid;
    gap: 4rem;
  }
}
</style>
