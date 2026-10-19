<template>
  <section class="fixture-loading">
    <h1>MLoading — matrix</h1>

    <table>
      <thead>
        <tr>
          <th scope="col">
            Type
          </th>
          <th
            v-for="size in sizes"
            :key="size"
            scope="col"
          >
            {{ size }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="type in types"
          :key="type"
        >
          <th scope="row">
            {{ type }}
          </th>
          <td
            v-for="size in sizes"
            :key="size"
          >
            <MLoading
              :type="type"
              :size="size"
              :aria-label="`Loading, ${type} ${size}`"
              :data-test="`${type}-${size}`"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Inline in text</h2>
    <p
      v-for="type in types"
      :key="type"
      class="fixture-loading__text"
      :data-test="`text-${type}`"
    >
      Saving the draft
      <MLoading
        :type="type"
        inline
        :aria-label="`Saving, ${type}`"
        :data-test="`inline-${type}`"
      />
      to the server.
    </p>

    <h2>In a host that announces being busy</h2>
    <div class="fixture-loading__row">
      <MButton
        loading
        data-test="in-button"
      >
        Save
      </MButton>
      <MButton
        loading
        data-test="in-button-icon"
      >
        <template #prepend>
          <MIcon :name="ICONS.add" />
        </template>
        Add
      </MButton>
    </div>

    <h2>Shape morph</h2>
    <div class="fixture-loading__row">
      <MShape
        class="fixture-loading__shape"
        :name="shape"
        data-test="shape"
      />
      <button
        type="button"
        data-test="shape-next"
        @click="nextShape"
      >
        Next shape
      </button>
      <output data-test="shape-name">{{ shape }}</output>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MLoading from '#kit/components/ui/loading/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MShape from '#kit/components/ui/shape/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { M3ShapeName } from '#kit/assets/icon/shapes'
import type { MLoadingSize, MLoadingType } from '#kit/components/ui/loading/props'

const types: MLoadingType[] = ['circular', 'expressive']
const sizes: MLoadingSize[] = ['small', 'medium', 'large']

const shapes: M3ShapeName[] = ['circle', 'flower', 'square', 'heart']
const shape = ref<M3ShapeName>('circle')

function nextShape() {
  shape.value = shapes[(shapes.indexOf(shape.value) + 1) % shapes.length]!
}
</script>

<style lang="scss">
.fixture-loading {
  display: grid;
  gap: 16rem;
  justify-items: start;

  table {
    border-spacing: 16rem;
  }

  &__text {
    font-size: 20rem;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16rem;
  }

  &__shape {
    width: 96rem;
    height: 96rem;
    color: var(--md-sys-color-primary);
  }
}
</style>
