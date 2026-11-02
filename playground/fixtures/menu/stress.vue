<template>
  <section class="fixture-menu-stress">
    <h1>MMenu — stress content</h1>

    <div class="fixture-menu-stress__row">
      <MMenu v-model="many">
        <template #activator="{ props: trigger }">
          <MButton
            v-bind="trigger"
            data-test="many-trigger"
          >
            Forty items
          </MButton>
        </template>

        <MMenuItem
          v-for="index in 40"
          :key="index"
          :label="`Item ${index}`"
          :data-test="`many-${index}`"
        />
      </MMenu>

      <MMenu v-model="longWord">
        <template #activator="{ props: trigger }">
          <MButton
            v-bind="trigger"
            data-test="long-trigger"
          >
            Long word
          </MButton>
        </template>

        <MMenuItem
          label="https://example.com/a/very/long/path/without/any/spaces/at/all"
          trailing-text="Ctrl+Shift+L"
          data-test="long-item"
        />
        <MMenuItem
          label="Сохранить 保存 حفظ"
          supporting-text="Mixed scripts in one row, with a supporting line that runs long enough to wrap"
        />
      </MMenu>

      <MButton
        data-test="open-dialog"
        @click="dialog = true"
      >
        Menu in a dialog
      </MButton>
    </div>

    <MDialog
      v-model="dialog"
      title="Document"
    >
      <MMenu v-model="inDialog">
        <template #activator="{ props: trigger }">
          <MButton
            v-bind="trigger"
            data-test="dialog-trigger"
          >
            Export
          </MButton>
        </template>

        <MMenuItem
          label="PDF"
          data-test="dialog-pdf"
        />
        <MMenuItem label="Word" />
      </MMenu>
    </MDialog>

    <MMenu
      v-model="corner"
      placement="bottom-end"
    >
      <template #activator="{ props: trigger }">
        <MButton
          v-bind="trigger"
          class="fixture-menu-stress__corner"
          data-test="corner-trigger"
        >
          Corner
        </MButton>
      </template>

      <MMenuItem label="Archive" />
      <MMenuItem label="Move" />
      <MMenuItem label="Delete" />
    </MMenu>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDialog from '#kit/components/ui/dialog/index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'

const many = ref(false)
const longWord = ref(false)
const dialog = ref(false)
const inDialog = ref(false)
const corner = ref(false)
</script>

<style lang="scss">
.fixture-menu-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
  }

  // Compound with the button's own class: in a production build its chunk can
  // come after this one, and its `position: relative` would win.
  &__corner.ui-button {
    position: fixed;
    inset-block-end: 16rem;
    inset-inline-end: 16rem;
  }
}
</style>
