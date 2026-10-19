<template>
  <section class="fixture-surface-matrix">
    <h1>MSurface — preset matrix</h1>

    <h2>Shape × variant</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">
            Shape
          </th>
          <th
            v-for="variant in variants"
            :key="variant"
            scope="col"
          >
            {{ variant }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="shape in shapes"
          :key="shape"
        >
          <th scope="row">
            {{ shape }}
          </th>
          <td
            v-for="variant in variants"
            :key="variant"
          >
            <MSurface
              :variant="variant"
              :shape="shape"
              class="fixture-surface-matrix__cell"
              :data-test="`${shape}-${variant}`"
            >
              {{ variant }}
            </MSurface>
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Tag × variant</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">
            Tag
          </th>
          <th
            v-for="variant in variants"
            :key="variant"
            scope="col"
          >
            {{ variant }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="tag in tags"
          :key="tag"
        >
          <th scope="row">
            {{ tag }}
          </th>
          <td
            v-for="variant in variants"
            :key="variant"
          >
            <MSurface
              :tag="tag"
              :variant="variant"
              shape="medium"
              class="fixture-surface-matrix__cell"
              :data-test="`tag-${tag}-${variant}`"
            >
              {{ tag }}
            </MSurface>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import MSurface from '#kit/components/ui/surface/index.vue'
import type { MSurfaceVariant } from '#kit/components/ui/surface/props'
import type { MShape } from '#kit/shared/types/props'

const variants: MSurfaceVariant[] = ['plain', 'filled', 'elevated', 'outlined']
const shapes: MShape[] = ['none', 'extra-small', 'small', 'medium', 'large', 'extra-large', 'extra-large-top', 'full']
const tags = ['div', 'section', 'article', 'aside']
</script>

<style lang="scss">
.fixture-surface-matrix {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16rem;

  table {
    width: 100%;
    table-layout: fixed;
    border-spacing: 8rem;
  }

  th {
    overflow-wrap: anywhere;
    text-align: start;
  }

  &__cell {
    min-height: 48rem;
    padding: 12rem;
  }
}
</style>
