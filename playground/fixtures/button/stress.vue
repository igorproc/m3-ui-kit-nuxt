<template>
  <section class="fixture-stress">
    <h1>MButton — stress content</h1>

    <div class="fixture-stress__narrow">
      <MButton data-test="long-text">
        Save all pending changes to the shared workspace and notify every reviewer
      </MButton>
    </div>

    <div class="fixture-stress__narrow">
      <MButton data-test="long-word">
        https://example.com/a/very/long/path/without/any/spaces/at/all
      </MButton>
    </div>

    <MButton data-test="one-char">
      ×
    </MButton>

    <MButton
      data-test="empty"
      aria-label="Empty label"
    />

    <MButton data-test="mixed-script">
      Сохранить 保存 حفظ 🙂
    </MButton>
  </section>
</template>

<script setup lang="ts">
import MButton from '#kit/components/ui/button/index.vue'
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: 160rem;
  }
}
</style>
