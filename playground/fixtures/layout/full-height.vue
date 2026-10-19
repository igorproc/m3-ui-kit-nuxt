<template>
  <MLayout
    full-height
    data-test="layout"
  >
    <MAppBar
      title="Full-height shell"
      data-test="app-bar"
    />

    <MLayoutMain data-test="main">
      <MContainer>
        <MCol
          v-for="index in 24"
          :key="index"
          tablet-xs="4"
          desktop-xs="3"
        >
          <p
            class="fixture-layout-full__card"
            :data-test="`card-${index}`"
          >
            {{ text }}
          </p>
        </MCol>
      </MContainer>
    </MLayoutMain>

    <MLayoutFooter
      sticky
      size-token="56rem"
      class="fixture-layout-full__footer"
      data-test="footer"
    >
      <p
        class="fixture-layout-full__caption"
        data-test="footer-text"
      >
        Pinned footer: main scrolls between the bars, the page does not.
      </p>
    </MLayoutFooter>
  </MLayout>
</template>

<script setup lang="ts">
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MLayoutFooter from '#kit/components/ui/layout/footer.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import MContainer from '#kit/components/ui/container/index.vue'
import MCol from '#kit/components/ui/col/index.vue'

const text = 'A card in the scrolling main. Two dozen of them overflow any window, so main gets a scrollbar while the bars stay put.'
</script>

<style lang="scss">
.fixture-layout-full__card {
  margin: 0;
  min-block-size: 240rem;
}

.fixture-layout-full__footer {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}

.fixture-layout-full__caption {
  display: flex;
  align-items: center;
  margin: 0;
  min-block-size: 56rem;
  padding-inline: 16rem;
}
</style>
