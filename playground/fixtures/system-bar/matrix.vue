<template>
  <section class="fixture-system-bar">
    <h1>MSystemBar — content matrix</h1>

    <table class="fixture-system-bar__table">
      <thead>
        <tr>
          <th scope="col">
            Content
          </th>
          <th scope="col">
            Bar
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">
            text
          </th>
          <td class="fixture-system-bar__cell">
            <MSystemBar data-test="text">
              12:30
            </MSystemBar>
          </td>
        </tr>
        <tr>
          <th scope="row">
            prepend + text
          </th>
          <td class="fixture-system-bar__cell">
            <MSystemBar data-test="prepend-text">
              <template #prepend>
                <MIcon :name="ICONS.cloud" />
              </template>
              Synced
            </MSystemBar>
          </td>
        </tr>
        <tr>
          <th scope="row">
            text + append
          </th>
          <td class="fixture-system-bar__cell">
            <MSystemBar data-test="text-append">
              12:30
              <template #append>
                <MIcon :name="ICONS.notifications" />
                <MIcon :name="ICONS.language" />
              </template>
            </MSystemBar>
          </td>
        </tr>
        <tr>
          <th scope="row">
            prepend + text + append
          </th>
          <td class="fixture-system-bar__cell">
            <MSystemBar data-test="full">
              <template #prepend>
                <MIcon :name="ICONS.accessTime" />
              </template>
              Updated a minute ago
              <template #append>
                <MIcon :name="ICONS.cloud" />
                <MIcon :name="ICONS.security" />
              </template>
            </MSystemBar>
          </td>
        </tr>
        <tr>
          <th scope="row">
            icons only
          </th>
          <td class="fixture-system-bar__cell">
            <MSystemBar data-test="icons-only">
              <template #prepend>
                <MIcon :name="ICONS.notifications" />
              </template>
              <template #append>
                <MIcon :name="ICONS.cloud" />
              </template>
            </MSystemBar>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import MSystemBar from '#kit/components/ui/system-bar/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
</script>

<style lang="scss">
.fixture-system-bar {
  display: grid;
  gap: 16rem;

  &__table {
    width: 100%;
    border-spacing: 12rem;
  }

  &__cell {
    width: 100%;
  }
}
</style>
