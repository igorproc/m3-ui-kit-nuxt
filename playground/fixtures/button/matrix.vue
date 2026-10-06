<template>
  <section class="fixture-matrix">
    <h1>MButton — state matrix</h1>

    <table>
      <thead>
        <tr>
          <th scope="col">
            State
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
          v-for="state in states"
          :key="state.name"
        >
          <th scope="row">
            {{ state.name }}
          </th>
          <td
            v-for="variant in variants"
            :key="variant"
          >
            <MButton
              :variant="variant"
              v-bind="state.props"
              :data-test="`${state.name}-${variant}`"
              @click="activations++"
            >
              {{ variant }}
            </MButton>
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Colors (filled)</h2>
    <div class="fixture-row">
      <MButton
        v-for="color in colors"
        :key="color"
        :color="color"
        :data-test="`color-${color}`"
      >
        {{ color }}
      </MButton>
    </div>

    <output data-test="activations">{{ activations }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import type { MColor, MVariant } from '#kit/shared/types/props'

const variants: MVariant[] = ['elevated', 'filled', 'tonal', 'outlined', 'text']
const colors: MColor[] = ['primary', 'secondary', 'tertiary', 'error']
const states = [
  { name: 'enabled', props: {} },
  { name: 'disabled', props: { disabled: true } },
  { name: 'loading', props: { loading: true } },
]

const activations = ref(0)
</script>

<style lang="scss">
.fixture-matrix {
  display: grid;
  gap: 16rem;

  table {
    border-spacing: 12rem;
  }
}

.fixture-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rem;
}
</style>
