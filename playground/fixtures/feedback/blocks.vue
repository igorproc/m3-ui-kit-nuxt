<template>
  <section class="fixture-blocks">
    <h1>Alert and banner — stress</h1>

    <h2>Alert</h2>
    <MButton
      variant="text"
      data-test="before-alert"
    >
      Before the alert
    </MButton>
    <MAlert
      v-model="alertShown"
      color="error"
      title="Upload failed"
      :text="longToken"
      closable
      close-label="Dismiss"
      announce="off"
      class="fixture-blocks__block"
      data-test="alert-long"
    >
      <template #actions>
        <MButton
          variant="text"
          data-test="alert-action"
        >
          Retry
        </MButton>
      </template>
    </MAlert>
    <MButton
      variant="text"
      data-test="after-alert"
    >
      After the alert
    </MButton>
    <MButton
      variant="text"
      data-test="next-after-alert"
    >
      Next after the alert
    </MButton>
    <MAlert
      color="info"
      title="Tonal alert"
      text="Set apart by its fill alone."
      announce="off"
      class="fixture-blocks__block"
      data-test="alert-tonal"
    />

    <h2>Banner</h2>
    <MBanner
      v-model="bannerShown"
      layout="inline"
      icon="round-cloud-off"
      title="Sync is off"
      :text="longToken"
      closable
      close-label="Dismiss"
      announce="off"
      class="fixture-blocks__block"
      data-test="banner-plain"
    />
    <MButton
      variant="text"
      data-test="after-banner"
    >
      After the banner
    </MButton>
    <MButton
      variant="text"
      data-test="next-after-banner"
    >
      Next after the banner
    </MButton>
    <MBanner
      variant="tonal"
      layout="stacked"
      title="Terms updated"
      :text="longToken"
      announce="off"
      class="fixture-blocks__block"
      data-test="banner-tonal"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MAlert from '#kit/components/ui/alert/index.vue'
import MBanner from '#kit/components/ui/banner/index.vue'
import MButton from '#kit/components/ui/button/index.vue'

const longToken = `https://example.com/${'verylongsegmentwithoutanybreak'.repeat(8)}`
const alertShown = ref(true)
const bannerShown = ref(true)
</script>

<style lang="scss">
.fixture-blocks {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__block {
    justify-self: stretch;
  }
}
</style>
