<template>
  <section class="fixture-subtree-dir">
    <h1>A menu in a subtree that runs against the page</h1>

    <div
      dir="rtl"
      class="fixture-subtree-dir__rtl"
    >
      <MButton
        data-test="menu-trigger"
        @click="open = !open"
      >
        إجراءات
        <MMenu
          v-model="open"
          aria-label="إجراءات"
        >
          <MMenuItem label="نسخ" />
          <MMenuItem label="مشاركة الرابط مع الفريق" />
        </MMenu>
      </MButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'

const open = ref(false)
</script>

<style lang="scss">
.fixture-subtree-dir__rtl {
  display: flex;
  justify-content: center;
}
</style>
