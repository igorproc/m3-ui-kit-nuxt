<template>
  <section class="fixture-overlay">
    <h1>Overlays — matrix</h1>

    <h2>Dialog taller than the window</h2>
    <MButton
      data-test="open-tall-dialog"
      @click="tallDialog = true"
    >
      Open dialog
    </MButton>
    <MDialog
      v-model="tallDialog"
      title="Terms of service"
      data-test="tall-dialog"
      @confirm="dialogResult = `confirm:${$event}`"
      @cancel="dialogResult = `cancel:${$event}`"
    >
      <p
        v-for="line in 40"
        :key="line"
      >
        Clause {{ line }}: the service is provided as is.
      </p>
      <template #actions="{ confirm, cancel }">
        <MButton
          variant="text"
          data-test="dialog-cancel"
          @click="cancel"
        >
          Decline
        </MButton>
        <MButton
          variant="text"
          data-test="dialog-confirm"
          @click="confirm('accepted')"
        >
          Accept
        </MButton>
      </template>
    </MDialog>
    <output data-test="dialog-result">{{ dialogResult }}</output>

    <h2>Sheet taller than the window</h2>
    <MButton
      data-test="open-tall-sheet"
      @click="tallSheet = true"
    >
      Open sheet
    </MButton>
    <MSheet
      v-model="tallSheet"
      aria-label="Share"
      data-test="tall-sheet"
    >
      <p
        v-for="line in 40"
        :key="line"
      >
        Share target {{ line }}
      </p>
    </MSheet>

    <h2>Menu</h2>
    <div class="fixture-overlay__row">
      <MButton
        data-test="menu-trigger"
        @click="menuOpen = !menuOpen"
      >
        Actions
        <MMenu v-model="menuOpen">
          <MMenuItem
            label="Copy"
            data-test="menu-copy"
          />
          <MMenuItem
            label="Cut"
            disabled
            data-test="menu-cut"
          />
          <MMenuItem
            label="Paste"
            data-test="menu-paste"
          />
        </MMenu>
      </MButton>
      <MButton
        variant="outlined"
        data-test="after-menu"
      >
        After the menu
      </MButton>
    </div>

    <h2>Tooltip</h2>
    <div class="fixture-overlay__row">
      <MTooltip text="Archive the message">
        <template #default="{ props }">
          <MButton
            v-bind="props"
            data-test="tooltip-trigger"
          >
            Archive
          </MButton>
        </template>
      </MTooltip>
    </div>

    <h2>Snackbar</h2>
    <MButton
      data-test="open-snackbar"
      @click="snackbar = true"
    >
      Show snackbar
    </MButton>
    <MSnackbar
      v-model="snackbar"
      label="Message archived"
      action-label="Undo"
      data-test="snackbar"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDialog from '#kit/components/ui/dialog/index.vue'
import MSheet from '#kit/components/ui/sheet/index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'
import MTooltip from '#kit/components/ui/tooltip/index.vue'
import MSnackbar from '#kit/components/ui/snackbar/index.vue'

const tallDialog = ref(false)
const tallSheet = ref(false)
const menuOpen = ref(false)
const snackbar = ref(false)
const dialogResult = ref('')
</script>

<style lang="scss">
.fixture-overlay {
  display: grid;
  gap: 16rem;
  justify-items: start;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
  }
}
</style>
