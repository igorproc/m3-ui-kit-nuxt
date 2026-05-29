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
              name="test"
              v-model="sliderValContinuous"
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
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ICONS } from '~~/shared/constants/icons'

import UiButtonSplit from '~/components/ui/button/split/index.vue'
import UiButtonFab from '~/components/ui/button/fab/index.vue'
import UiButtonIcon from '~/components/ui/button/icon/index.vue'
import UiButtonSegmented from '~/components/ui/button/segmented/index.vue'
import UiButtonExtendedFab from '~/components/ui/button/extended-fab/index.vue'
import UiProgress from '~/components/ui/progress/index.vue'
import UiLoading from '~/components/ui/loading/index.vue'
import UiSlider from '~/components/ui/slider/index.vue'

const sliderValContinuous = ref(50)
const sliderValDiscrete = ref(20)
const sliderValRange = ref([20, 80])

const sliderValVerticalContinuous = ref(50)
const sliderValVerticalDiscrete = ref(20)
const sliderValVerticalRange = ref([20, 80])
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
}
</style>
