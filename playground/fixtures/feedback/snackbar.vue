<template>
  <MLayout data-test="layout">
    <MLayoutMain>
      <h1>Snackbar over a navigation bar</h1>
      <div class="fixture-snackbar__row">
        <MButton
          data-test="open-message"
          @click="open('message')"
        >
          Message
        </MButton>
        <MButton
          data-test="open-url"
          @click="open('url')"
        >
          Long URL
        </MButton>
        <MButton
          data-test="open-empty"
          @click="open('empty')"
        >
          Empty
        </MButton>
      </div>

      <MSnackbar
        :model-value="shown === 'message'"
        label="Draft saved"
        action-label="Undo"
        closable
        close-label="Close"
        duration="indefinite"
        @update:model-value="close"
      />
      <MSnackbar
        :model-value="shown === 'url'"
        :label="`Copied ${longUrl}`"
        closable
        close-label="Close"
        duration="indefinite"
        @update:model-value="close"
      />
      <MSnackbar
        :model-value="shown === 'empty'"
        label=""
        closable
        close-label="Close"
        duration="indefinite"
        @update:model-value="close"
      />
    </MLayoutMain>

    <MNavigationBar
      v-model="destination"
      :items="destinations"
      aria-label="Sections"
      data-test="bar"
    />
  </MLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MNavigationBar from '#kit/components/ui/navigation-bar/index.vue'
import MSnackbar from '#kit/components/ui/snackbar/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import type { MNavigationBarItem } from '#kit/components/ui/navigation-bar/props'

type Case = 'message' | 'url' | 'empty'

const destinations: MNavigationBarItem[] = [
  { id: 'inbox', icon: 'outline-inbox', label: 'Inbox' },
  { id: 'outbox', icon: 'outline-send', label: 'Outbox' },
  { id: 'favorites', icon: 'outline-star', label: 'Favorites' },
]
const destination = ref<string | null>('inbox')
const longUrl = `https://example.com/${'averylongpathsegmentwithoutbreaks'.repeat(6)}`

const shown = ref<Case | null>(null)
const open = (which: Case) => {
  shown.value = which
}
const close = (value: boolean) => {
  if (!value) shown.value = null
}
</script>

<style lang="scss">
.fixture-snackbar {
  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }
}
</style>
