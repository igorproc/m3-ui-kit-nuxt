<script setup lang="ts">
const options = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 },
  { label: 'Option 3', value: 3 },
  { label: 'Option 4', value: 4 },
]

const selectedValue = ref(1)
const isDisabled = ref(false)
const variant = ref<'filled' | 'outlined'>('filled')
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-dropdown
      </h2>

      <p class="ui-test-section__description">
        Dropdown component using ui-text-field and ui-menu.
      </p>

      <div class="ui-test-section__controls">
        <label class="ui-test-toggle">
          <input
            v-model="isDisabled"
            type="checkbox"
          >
          <span>disabled</span>
        </label>

        <label class="ui-test-toggle">
          <select v-model="variant">
            <option value="filled">filled</option>
            <option value="outlined">outlined</option>
          </select>
          <span>variant</span>
        </label>
      </div>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__row">
        <h3 class="ui-test-grid__row-title">
          Selected value: {{ selectedValue }}
        </h3>

        <div style="max-width: 320rem;">
          <ui-dropdown
            v-model="selectedValue"
            :options="options"
            label="Select an option"
            placeholder="Choose one..."
            :disabled="isDisabled"
            :variant="variant"
          />
        </div>
      </div>
    </div>
  </section>
</template>
