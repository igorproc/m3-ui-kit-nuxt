<template>
  <section class="demo-material__showcase">
    <h2 class="demo-material__section-title">
      Component Showcase
    </h2>

    <!-- Badges -->
    <div class="demo-material__showcase-item">
      <h3 class="demo-material__showcase-subtitle">
        Badges
      </h3>
      <div class="demo-material__badges">
        <div class="demo-material__preview-container demo-material__preview-container--badge">
          <span class="demo-material__badge-wrapper">
            <m-icon
              :name="ICONS.info"
              style="font-size: 24rem;"
            />
            <m-badge
              dot
              class="demo-material__badge-pos"
            />
          </span>
          <span class="demo-material__preview-label">Small (Dot)</span>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--badge">
          <span class="demo-material__badge-wrapper">
            <m-icon
              :name="ICONS.info"
              style="font-size: 24rem;"
            />
            <m-badge
              value="3"
              class="demo-material__badge-pos"
            />
          </span>
          <span class="demo-material__preview-label">Large (Single Digit)</span>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--badge">
          <span class="demo-material__badge-wrapper">
            <m-icon
              :name="ICONS.info"
              style="font-size: 24rem;"
            />
            <m-badge
              value="999"
              max="99"
              class="demo-material__badge-pos"
            />
          </span>
          <span class="demo-material__preview-label">Large (Multi Digit + Max)</span>
        </div>
      </div>
    </div>

    <!-- Buttons -->
    <div class="demo-material__showcase-item">
      <h3 class="demo-material__showcase-subtitle">
        Buttons
      </h3>
      <div class="demo-material__buttons">
        <div class="demo-material__preview-container demo-material__preview-container--button">
          <m-button variant="filled">
            Filled
          </m-button>
          <m-button variant="filled">
            <template #prepend>
              <m-icon :name="ICONS.add" />
            </template>
            Filled Icon
          </m-button>
        </div>

        <!-- FAB Preview -->
        <div class="demo-material__preview-container demo-material__preview-container--button">
          <UiButtonFab color="primary">
            <m-icon name="ic:baseline-add" />
          </UiButtonFab>
          <UiButtonFab color="secondary">
            <m-icon name="ic:baseline-edit" />
          </UiButtonFab>
          <UiButtonFab
            color="tertiary"
            size="small"
          >
            <m-icon name="ic:baseline-check" />
          </UiButtonFab>
          <UiButtonFab
            color="surface"
            size="large"
          >
            <m-icon name="ic:baseline-explore" />
          </UiButtonFab>
        </div>

        <!-- Extended FAB Preview -->
        <div class="demo-material__preview-container demo-material__preview-container--button">
          <UiButtonExtendedFab color="primary">
            <template #prepend>
              <m-icon name="ic:baseline-add" />
            </template>
            Create
          </UiButtonExtendedFab>
          <UiButtonExtendedFab color="secondary">
            Edit Profile
          </UiButtonExtendedFab>
        </div>

        <!-- Icon Buttons Preview -->
        <div class="demo-material__preview-container demo-material__preview-container--button">
          <UiButtonIcon variant="text">
            <m-icon name="ic:baseline-search" />
          </UiButtonIcon>
          <UiButtonIcon variant="filled">
            <m-icon name="ic:baseline-settings" />
          </UiButtonIcon>
          <UiButtonIcon variant="tonal">
            <m-icon name="ic:baseline-info" />
          </UiButtonIcon>
          <UiButtonIcon variant="outlined">
            <m-icon name="ic:baseline-explore" />
          </UiButtonIcon>
        </div>

        <!-- Segmented Button Preview -->
        <div class="demo-material__preview-container demo-material__preview-container--button">
          <UiButtonSegmented
            :items="[
              { label: 'Map', value: 'map' },
              { label: 'Transit', value: 'transit' },
              { label: 'Satellite', value: 'satellite' },
            ]"
            :model-value="['map']"
            multiple
          />
        </div>

        <!-- Split Button Preview -->
        <div class="demo-material__preview-container demo-material__preview-container--button">
          <UiButtonSplit
            variant="filled"
            :items="[
              { label: 'Reply All', value: 'reply_all', icon: 'ic:baseline-reply-all' },
              { label: 'Forward', value: 'forward', icon: 'ic:baseline-forward' },
            ]"
          >
            Reply
          </UiButtonSplit>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--button">
          <m-button variant="elevated">
            Elevated
          </m-button>
          <m-button variant="elevated">
            <template #prepend>
              <m-icon :name="ICONS.add" />
            </template>
            Elevated Icon
          </m-button>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--button">
          <m-button variant="tonal">
            Tonal
          </m-button>
          <m-button variant="tonal">
            <template #prepend>
              <m-icon :name="ICONS.add" />
            </template>
            Tonal Icon
          </m-button>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--button">
          <m-button variant="outlined">
            Outlined
          </m-button>
          <m-button variant="outlined">
            <template #prepend>
              <m-icon :name="ICONS.add" />
            </template>
            Outlined Icon
          </m-button>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--button">
          <m-button variant="text">
            Text
          </m-button>
          <m-button variant="text">
            <template #prepend>
              <m-icon :name="ICONS.add" />
            </template>
            Text Icon
          </m-button>
        </div>
      </div>
    </div>
    <!-- Progress & Loading -->
    <div class="demo-material__showcase-item">
      <h3 class="demo-material__showcase-subtitle">
        Progress & Loading
      </h3>
      <div class="demo-material__buttons">
        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="min-width: 200px;"
        >
          <UiProgress
            variant="linear"
            :value="45"
          />
          <span class="demo-material__preview-label">Linear Determinate</span>
        </div>

        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="min-width: 200px;"
        >
          <UiProgress
            variant="linear"
            indeterminate
          />
          <span class="demo-material__preview-label">Linear Indeterminate</span>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--badge">
          <UiProgress
            variant="circular"
            :value="60"
          />
          <span class="demo-material__preview-label">Circular Determinate</span>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--badge">
          <UiProgress
            variant="circular"
            indeterminate
          />
          <span class="demo-material__preview-label">Circular Indeterminate</span>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--badge">
          <UiLoading size="medium" />
          <span class="demo-material__preview-label">Loading (Circular)</span>
        </div>

        <div class="demo-material__preview-container demo-material__preview-container--badge">
          <UiLoading
            variant="expressive"
            size="medium"
          />
          <span class="demo-material__preview-label">Loading (Expressive)</span>
        </div>
      </div>
    </div>

    <!-- Overlays & Modals -->
    <div class="demo-material__showcase-item">
      <h3 class="demo-material__showcase-subtitle">
        Overlays & Modals
      </h3>
      <div class="demo-material__buttons">
        <div class="demo-material__preview-container demo-material__preview-container--button">
          <m-button
            variant="filled"
            @click="showBasicDialog = true"
          >
            Open Basic Dialog
          </m-button>

          <m-button
            variant="tonal"
            @click="showNested1 = true"
          >
            Open Nested Cascade Test
          </m-button>
        </div>

        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="padding: 64rem;"
        >
          <UiTooltip text="I am a zero-dependency teleported tooltip!">
            <m-button variant="outlined">
              Hover me for Tooltip
            </m-button>
          </UiTooltip>
        </div>
      </div>
    </div>

    <!-- Sliders -->
    <div class="demo-material__showcase-item">
      <h3 class="demo-material__showcase-subtitle">
        Sliders
      </h3>

      <div style="display: flex; gap: 32rem; flex-wrap: wrap;">
        <!-- Horizontal Sliders -->
        <div
          class="demo-material__buttons"
          style="flex-direction: column; flex: 1; min-width: 300rem;"
        >
          <div
            class="demo-material__preview-container demo-material__preview-container--button"
            style="width: calc(100% - 74rem);"
          >
            <UiSlider
              v-model="sliderValContinuous"
              name="test"
              show-value
              label="Continuous"
            />
          </div>

          <div
            class="demo-material__preview-container demo-material__preview-container--button"
            style="width: calc(100% - 74rem);"
          >
            <UiSlider
              v-model="sliderValDiscrete"
              discrete
              :step="10"
              show-value
              label="Discrete"
            />
          </div>

          <div
            class="demo-material__preview-container demo-material__preview-container--button"
            style="width: calc(100% - 74rem);"
          >
            <UiSlider
              v-model="sliderValRange"
              range
              show-value
              label="Range"
            />
          </div>
        </div>

        <!-- Vertical Sliders -->
        <div
          class="demo-material__buttons"
          style="flex: 1; min-width: 300rem; align-items: stretch;"
        >
          <div
            class="demo-material__preview-container demo-material__preview-container--button"
            style="flex: 1;"
          >
            <UiSlider
              v-model="sliderValVerticalContinuous"
              orientation="vertical"
              show-value
              label="Continuous"
            />
          </div>

          <div
            class="demo-material__preview-container demo-material__preview-container--button"
            style="flex: 1;"
          >
            <UiSlider
              v-model="sliderValVerticalDiscrete"
              discrete
              :step="10"
              orientation="vertical"
              show-value
              label="Discrete"
            />
          </div>

          <div
            class="demo-material__preview-container demo-material__preview-container--button"
            style="flex: 1;"
          >
            <UiSlider
              v-model="sliderValVerticalRange"
              range
              orientation="vertical"
              show-value
              label="Range"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dropdowns -->
    <div class="demo-material__showcase-item">
      <h3 class="demo-material__showcase-subtitle">
        Dropdowns
      </h3>
      <div class="demo-material__buttons">
        <!-- Filled Dropdown -->
        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="min-width: 250rem; align-items: stretch;"
        >
          <UiDropdown
            v-model="dropdownValFilled"
            label="Filled Dropdown"
            :options="dropdownOptions"
          />
          <span class="demo-material__preview-label">Filled Variant</span>
        </div>

        <!-- Outlined Dropdown -->
        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="min-width: 250rem; align-items: stretch;"
        >
          <UiDropdown
            v-model="dropdownValOutlined"
            label="Outlined Dropdown"
            variant="outlined"
            :options="dropdownOptions"
          />
          <span class="demo-material__preview-label">Outlined Variant</span>
        </div>

        <!-- Disabled Dropdown -->
        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="min-width: 250rem; align-items: stretch;"
        >
          <UiDropdown
            v-model="dropdownValDisabled"
            label="Disabled Dropdown"
            disabled
            :options="dropdownOptions"
          />
          <span class="demo-material__preview-label">Disabled State</span>
        </div>

        <!-- Custom Slot Dropdown (Specific Items Slot Filled) -->
        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="min-width: 320rem; align-items: stretch;"
        >
          <UiDropdown
            v-model="dropdownValCustom"
            label="Custom Slot (Filled)"
            :items="dropdownCustomItems"
          >
            <template #default="{ item, selected, onSelect }">
              <UiDropdownItem
                :selected="selected"
                @click="onSelect"
              >
                <template #leading>
                  <m-icon
                    :name="item.icon"
                    style="font-size: 20rem; color: var(--color-primary);"
                  />
                </template>
                <div style="display: flex; flex-direction: column; padding: 4rem 0;">
                  <span style="font-weight: 500; font-size: 14rem;">{{ item.name }}</span>
                  <span style="font-size: 11rem; color: var(--color-on-surface-variant);">{{ item.desc }}</span>
                </div>
              </UiDropdownItem>
            </template>
          </UiDropdown>
          <span class="demo-material__preview-label">Custom Items (Slot Filled)</span>
        </div>

        <!-- Multiple Dropdown (chips, menu stays open) -->
        <div
          class="demo-material__preview-container demo-material__preview-container--button"
          style="min-width: 320rem; align-items: stretch;"
        >
          <UiDropdown
            v-model="dropdownValMultiple"
            label="Multiple (Chips)"
            variant="outlined"
            multiple
            :options="dropdownOptions"
          />
          <span class="demo-material__preview-label">Multi-select (Chips Slot)</span>
        </div>
      </div>
    </div>

    <!-- Auto-built Form (MFormRenderer) -->
    <div class="demo-material__showcase-item">
      <h3 class="demo-material__showcase-subtitle">
        Auto-built Form (MFormRenderer)
      </h3>

      <div class="demo-material__form-demo">
        <!-- Field manager -->
        <div class="demo-material__form-builder">
          <span class="demo-material__preview-label">Fields ({{ formFields.length }})</span>

          <ul class="demo-material__field-list">
            <li
              v-for="field in formFields"
              :key="field.name"
              class="demo-material__field-row"
            >
              <span class="demo-material__field-tag">{{ field.type }}</span>
              <span class="demo-material__field-name">{{ field.label || field.name }}</span>
              <UiButtonIcon
                variant="text"
                @click="removeField(field.name)"
              >
                <m-icon name="ic:baseline-close" />
              </UiButtonIcon>
            </li>
          </ul>

          <div class="demo-material__field-adder">
            <UiDropdown
              v-model="newFieldType"
              label="Field type"
              :options="fieldTypeOptions"
            />
            <m-text-field
              v-model="newFieldName"
              label="Name (schema key)"
            />
            <m-text-field
              v-model="newFieldLabel"
              label="Label"
            />
            <m-checkbox
              v-model="newFieldRequired"
              label="Required"
            />
            <m-button
              variant="tonal"
              @click="addField"
            >
              <template #prepend>
                <m-icon :name="ICONS.add" />
              </template>
              Add field
            </m-button>
            <span
              v-if="addFieldError"
              class="demo-material__field-error"
            >
              {{ addFieldError }}
            </span>
          </div>
        </div>

        <!-- Generated form -->
        <div class="demo-material__form-preview">
          <m-form-renderer
            :key="formKey"
            :config="formFields"
            :on-submit="onFormSubmit"
          />

          <pre
            v-if="submittedValues"
            class="demo-material__form-result"
          >{{ JSON.stringify(submittedValues, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </section>

  <!-- Demo Overlays Layer -->
  <teleport to="body">
    <UiDialog
      v-model="showBasicDialog"
      title="Basic Dialog"
    >
      <p>This is a standard template-based dialog.</p>
      <template #actions>
        <m-button
          variant="text"
          @click="showBasicDialog = false"
        >
          Close
        </m-button>
      </template>
    </UiDialog>

    <!-- Nested Cascade Demo -->
    <UiDialog
      ref="nested1Ref"
      v-model="showNested1"
      title="Nested Step 1 (Parent)"
    >
      <p>I am the parent dialog. I can open another dialog.</p>
      <div style="margin-top: 16rem;">
        <m-button
          variant="tonal"
          @click="showNested2 = true"
        >
          Open Step 2
        </m-button>
      </div>
      <template #actions>
        <m-button
          variant="text"
          @click="nested1Ref?.close()"
        >
          Close
        </m-button>
      </template>

      <!-- Child Dialog rendered inside Parent template -->
      <UiDialog
        ref="nested2Ref"
        v-model="showNested2"
        title="Nested Step 2 (Child)"
      >
        <p>I am the child dialog. I can open a bottom sheet!</p>
        <div style="margin-top: 16rem;">
          <m-button
            variant="filled"
            @click="showNested3 = true"
          >
            Open Step 3 (Sheet)
          </m-button>
        </div>
        <template #actions>
          <m-button
            variant="text"
            @click="nested2Ref?.close()"
          >
            Close
          </m-button>
        </template>

        <UiSheet
          ref="nested3Ref"
          v-model="showNested3"
        >
          <div style="padding: 16rem;">
            <h3>Nested Step 3 (Sheet Child)</h3>
            <p>I am a sheet child. You can close only this sheet, or perform a manual programmatic close of all open modals.</p>
            <div style="display: flex; gap: 8rem; margin-top: 16rem;">
              <m-button
                variant="filled"
                @click="showNested3 = false; showNested2 = false; showNested1 = false"
              >
                Close All Modals
              </m-button>
              <m-button
                variant="text"
                @click="showNested3 = false"
              >
                Close Only Sheet
              </m-button>
            </div>
          </div>
        </UiSheet>
      </UiDialog>
    </UiDialog>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ICONS } from '~~/shared/constants/icons'
import type { FormFieldConfig, FormFieldType } from '~/composables/useFormSchema'

import UiButtonSplit from '~/components/ui/button/split/index.vue'
import UiButtonFab from '~/components/ui/button/fab/index.vue'
import UiButtonIcon from '~/components/ui/button/icon/index.vue'
import UiButtonSegmented from '~/components/ui/button/segmented/index.vue'
import UiButtonExtendedFab from '~/components/ui/button/extended-fab/index.vue'
import UiProgress from '~/components/ui/progress/index.vue'
import UiLoading from '~/components/ui/loading/index.vue'
import UiSlider from '~/components/ui/slider/index.vue'
import UiDialog from '~/components/ui/dialog/index.vue'
import UiSheet from '~/components/ui/sheet/index.vue'
import UiTooltip from '~/components/ui/tooltip/index.vue'
import UiDropdown from '~/components/ui/dropdown/index.vue'
import UiDropdownItem from '~/components/ui/dropdown/item/index.vue'

const sliderValContinuous = ref(50)
const sliderValDiscrete = ref(20)
const sliderValRange = ref([20, 80])

const sliderValVerticalContinuous = ref(50)
const sliderValVerticalDiscrete = ref(20)
const sliderValVerticalRange = ref([20, 80])

const showBasicDialog = ref(false)
const showNested1 = ref(false)
const showNested2 = ref(false)
const showNested3 = ref(false)

const nested1Ref = ref()
const nested2Ref = ref()
const nested3Ref = ref()

const dropdownValFilled = ref('option1')
const dropdownValOutlined = ref('option2')
const dropdownValDisabled = ref('option1')
const dropdownValCustom = ref('custom1')
const dropdownValMultiple = ref<string[]>(['option1', 'option3'])

const dropdownOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
]

const dropdownCustomItems = [
  { id: 'custom1', name: 'Profile Settings', desc: 'Manage account settings', icon: ICONS.widgets },
  { id: 'custom2', name: 'Notification Center', desc: 'Control alerts and messages', icon: 'ic:baseline-notifications' },
  { id: 'custom3', name: 'Security Preferences', desc: 'Update passwords and auth', icon: 'ic:baseline-security' },
]

// --- Auto-built form (MFormRenderer) demo ---
const formFields = ref<FormFieldConfig[]>([
  { type: 'text', name: 'fullName', label: 'Full name', rules: { required: true, min: 2 } },
  { type: 'text', name: 'email', label: 'Email', rules: { required: true, email: true } },
  { type: 'number', name: 'age', label: 'Age', rules: { min: 18, max: 120 } },
  { type: 'checkbox', name: 'subscribe', label: 'Subscribe to newsletter' },
  { type: 'switch', name: 'darkMode', label: 'Enable dark mode' },
  {
    type: 'radio',
    name: 'plan',
    label: 'Plan',
    rules: { required: true },
    options: [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
    ],
  },
])

// useFormSchema runs once at MFormRenderer setup, so changing the field set
// remounts the renderer via this key to rebuild the schema/form.
const formKey = computed(() => formFields.value.map(field => `${field.type}:${field.name}`).join('|'))

const submittedValues = ref<Record<string, unknown> | null>(null)

function onFormSubmit(values: Record<string, unknown>) {
  submittedValues.value = values
}

const fieldTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Switch', value: 'switch' },
  { label: 'Radio', value: 'radio' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Search', value: 'search' },
]

const newFieldType = ref<FormFieldType>('text')
const newFieldName = ref('')
const newFieldLabel = ref('')
const newFieldRequired = ref(false)
const addFieldError = ref('')

function addField() {
  const name = newFieldName.value.trim()

  if (!name) {
    addFieldError.value = 'Name is required'
    return
  }
  if (formFields.value.some(field => field.name === name)) {
    addFieldError.value = 'Name must be unique'
    return
  }

  const field: FormFieldConfig = {
    type: newFieldType.value,
    name,
    label: newFieldLabel.value.trim() || name,
  }

  if (newFieldRequired.value) {
    field.rules = { required: true }
  }
  if (newFieldType.value === 'radio') {
    field.options = [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
    ]
  }

  formFields.value = [...formFields.value, field]
  submittedValues.value = null
  newFieldName.value = ''
  newFieldLabel.value = ''
  newFieldRequired.value = false
  addFieldError.value = ''
}

function removeField(name: string) {
  formFields.value = formFields.value.filter(field => field.name !== name)
  submittedValues.value = null
}
</script>

<style lang="scss">
.demo-material {
  &__showcase {
    display: flex;
    flex-direction: column;
    gap: 32rem;
  }

  &__section-title {
    margin: 0;
    color: var(--color-primary-container-contrast);
    @include typescale('headline-medium');
  }

  &__showcase-item {
    display: flex;
    flex-direction: column;
    gap: 16rem;
  }

  &__showcase-subtitle {
    margin: 0;
    color: var(--color-on-surface-variant);
    @include typescale('title-large');
  }

  &__app-bars {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320rem, 1fr));
    gap: 24rem;
    align-items: start;
  }

  &__preview-container {
    border: 1rem solid var(--color-outline-variant);
    border-radius: var(--sys-shape-corner-medium, 12rem);
    overflow: hidden;
    position: relative;
    background-color: var(--color-surface);

    &--badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16rem;
      padding: 32rem;
    }

    &--button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16rem;
      padding: 32rem;
    }
  }

  &__badges,
  &__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
    align-items: flex-start;
  }

  &__badge-wrapper {
    position: relative;
    display: inline-flex;
    color: var(--color-on-surface);
  }

  &__badge-pos {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
  }

  &__preview-label {
    @include typescale('label-medium');
    color: var(--color-on-surface-variant);
  }

  &__form-demo {
    display: flex;
    flex-wrap: wrap;
    gap: 24rem;
    align-items: flex-start;
  }

  &__form-builder {
    display: flex;
    flex-direction: column;
    gap: 16rem;
    flex: 1;
    min-width: 320rem;
  }

  &__field-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8rem;
  }

  &__field-row {
    display: flex;
    align-items: center;
    gap: 8rem;
  }

  &__field-tag {
    @include typescale('label-small');
    padding: 2rem 8rem;
    border-radius: 999rem;
    border: 1rem solid var(--color-outline-variant);
    color: var(--color-on-surface-variant);
    text-transform: uppercase;
  }

  &__field-name {
    flex: 1;
    color: var(--color-on-surface);
  }

  &__field-adder {
    display: flex;
    flex-direction: column;
    gap: 12rem;
    align-items: stretch;
    padding: 16rem;
    border: 1rem solid var(--color-outline-variant);
    border-radius: 12rem;
  }

  &__field-error {
    @include typescale('label-small');
    color: var(--color-error);
  }

  &__form-preview {
    display: flex;
    flex-direction: column;
    gap: 16rem;
    flex: 1;
    min-width: 320rem;
    padding: 24rem;
    border: 1rem solid var(--color-outline-variant);
    border-radius: 12rem;
    background-color: var(--color-surface);
  }

  &__form-result {
    @include typescale('body-small');
    margin: 0;
    padding: 16rem;
    border-radius: 12rem;
    background-color: var(--color-surface-container-high);
    color: var(--color-on-surface);
    overflow: auto;
    white-space: pre-wrap;
  }
}
</style>
