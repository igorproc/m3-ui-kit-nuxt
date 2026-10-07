<template>
  <section class="fixture-icon-matrix">
    <h1>MIcon — size, fill and meaning matrix</h1>

    <table data-test="matrix">
      <thead>
        <tr>
          <th scope="col">
            Owner font size
          </th>
          <th
            v-for="column in columns"
            :key="column.id"
            scope="col"
          >
            {{ column.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="size in sizes"
          :key="size"
        >
          <th scope="row">
            {{ size }}
          </th>
          <td
            v-for="column in columns"
            :key="column.id"
            :class="`fixture-icon-matrix__size--${size}`"
          >
            <MIcon
              :name="ICONS.star"
              :filled="column.filled"
              :label="column.label"
              :data-test="`${size}-${column.id}`"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Icon beside a label</h2>
    <p
      v-for="size in sizes"
      :key="size"
      class="fixture-icon-matrix__line"
      :class="`fixture-icon-matrix__size--${size}`"
    >
      <MIcon
        :name="ICONS.settings"
        :data-test="`line-${size}`"
      />
      Settings
    </p>
  </section>
</template>

<script setup lang="ts">
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

const sizes = [20, 24, 40, 48]

const columns = [
  { id: 'outline', title: 'Outline', filled: false, label: undefined },
  { id: 'outline-labelled', title: 'Outline, labelled', filled: false, label: 'Favorite' },
  { id: 'filled', title: 'Filled', filled: true, label: undefined },
  { id: 'filled-labelled', title: 'Filled, labelled', filled: true, label: 'Favorite' },
]
</script>

<style lang="scss">
.fixture-icon-matrix {
  display: grid;
  gap: 16rem;

  table {
    border-spacing: 12rem;
  }

  &__line {
    display: flex;
    align-items: center;
    gap: 8rem;
    margin: 0;
  }

  &__size--20 {
    font-size: 20rem;
  }

  &__size--24 {
    font-size: 24rem;
  }

  &__size--40 {
    font-size: 40rem;
  }

  &__size--48 {
    font-size: 48rem;
  }
}
</style>
