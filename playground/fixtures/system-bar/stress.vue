<template>
  <section class="fixture-system-bar-stress">
    <h1>MSystemBar — stress content</h1>

    <MSystemBar data-test="long-text">
      You are offline. Changes made on this device are kept locally and will sync with the shared workspace as soon as the connection comes back; until then other reviewers will not see your latest edits, comments or uploaded files
      <template #append>
        <MIcon :name="ICONS.cloud" />
      </template>
    </MSystemBar>

    <MSystemBar data-test="long-word">
      <template #prepend>
        <MIcon :name="ICONS.language" />
      </template>
      https://example.com/workspace/shared/documents/a-very-long-path-without-any-spaces-at-all/that-keeps-going-and-going/and-going-further-than-any-status-bar-can-show/on-a-phone-or-a-desktop-screen
    </MSystemBar>

    <MSystemBar data-test="mixed-script">
      Сохранено 保存しました تم الحفظ 🙂
    </MSystemBar>

    <MSystemBar data-test="empty" />

    <MSystemBar data-test="many">
      12:30
      <template #append>
        <MIcon
          v-for="icon in manyIcons"
          :key="icon"
          :name="icon"
        />
      </template>
    </MSystemBar>
  </section>
</template>

<script setup lang="ts">
import MSystemBar from '#kit/components/ui/system-bar/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

const manyIcons = [
  ICONS.notifications,
  ICONS.cloud,
  ICONS.security,
  ICONS.language,
  ICONS.accessTime,
  ICONS.email,
  ICONS.phone,
  ICONS.place,
]
</script>

<style lang="scss">
.fixture-system-bar-stress {
  display: grid;
  gap: 16rem;
}
</style>
