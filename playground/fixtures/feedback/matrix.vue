<template>
  <section class="fixture-feedback">
    <h1>Feedback — matrix</h1>

    <h2>Linear progress</h2>
    <div class="fixture-feedback__bars">
      <MProgress
        :value="40"
        aria-label="Upload, standard"
        data-test="linear-40"
      />
      <MProgress
        :value="40"
        shape="wavy"
        aria-label="Upload, wavy"
        data-test="wavy-40"
      />
      <MProgress
        indeterminate
        shape="wavy"
        aria-label="Sync, wavy"
        data-test="wavy-indeterminate"
      />
      <MProgress
        indeterminate
        aria-label="Sync, standard"
        data-test="linear-indeterminate"
      />
      <MProgress
        :value="30"
        data-test="linear-labelled"
      >
        Uploading 3 of 10 files
      </MProgress>
    </div>

    <h2>Circular progress</h2>
    <div class="fixture-feedback__row">
      <MProgress
        v-for="density in densities"
        :key="density"
        type="circular"
        :value="60"
        :density="density"
        :aria-label="`Progress, ${density}`"
        :data-test="`circular-${density}`"
      />
      <MProgress
        type="circular"
        shape="wavy"
        :value="60"
        aria-label="Progress, wavy"
        data-test="circular-wavy"
      />
      <MProgress
        type="circular"
        :value="60"
        data-test="circular-labelled"
      >
        Syncing photos
      </MProgress>
    </div>

    <h2>Badges</h2>
    <div class="fixture-feedback__row">
      <MBadge
        :value="7"
        data-test="badge-large"
      />
      <MBadge
        dot
        data-test="badge-dot"
      />
      <MBadge data-test="badge-empty" />
      <MBadge
        value="Новые"
        data-test="badge-long"
      />
    </div>

    <h2>Badges at an icon's corner</h2>
    <div class="fixture-feedback__row">
      <span
        class="fixture-feedback__icon"
        data-test="anchor-large"
      >
        <MIcon :name="ICONS.close" />
        <MBadge
          :value="3"
          class="fixture-feedback__badge-large"
        />
      </span>
      <span
        class="fixture-feedback__icon"
        data-test="anchor-small"
      >
        <MIcon :name="ICONS.close" />
        <MBadge
          dot
          class="fixture-feedback__badge-small"
        />
      </span>
    </div>

    <h2>Stacked banner with actions</h2>
    <MBanner
      layout="stacked"
      title="Sync is off"
      text="Changes stay on this device."
      closable
      close-label="Dismiss"
      announce="off"
      data-test="banner-stacked"
    >
      <template #actions>
        <MButton
          variant="text"
          data-test="banner-action"
        >
          Turn on
        </MButton>
      </template>
    </MBanner>

    <h2>Alert</h2>
    <MAlert
      color="warning"
      variant="outlined"
      title="Storage almost full"
      text="Free some space to keep syncing."
      closable
      close-label="Dismiss"
      announce="off"
      data-test="alert"
    />
  </section>
</template>

<script setup lang="ts">
import MProgress from '#kit/components/ui/progress/index.vue'
import MBadge from '#kit/components/ui/badge/index.vue'
import MBanner from '#kit/components/ui/banner/index.vue'
import MAlert from '#kit/components/ui/alert/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MProgressDensity } from '#kit/components/ui/progress/props'

const densities: MProgressDensity[] = ['compact', 'default', 'comfortable']
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/badge/index' as badge;

.fixture-feedback {
  display: grid;
  gap: 16rem;

  &__bars {
    display: grid;
    gap: 24rem;
    max-width: 480rem;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24rem;
  }

  &__icon {
    position: relative;
    display: inline-flex;
    font-size: 24rem;
  }

  &__badge-large {
    @include badge.badge-anchor(large);
  }

  &__badge-small {
    @include badge.badge-anchor(small);
  }
}
</style>
