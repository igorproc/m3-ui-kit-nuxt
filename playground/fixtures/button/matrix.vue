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

    <h2>Density × shape</h2>
    <div
      v-for="density in densities"
      :key="density"
      class="fixture-row fixture-row--spaced"
    >
      <MButton
        v-for="shape in shapes"
        :key="shape"
        :density="density"
        :shape="shape"
        :data-test="`density-${density}-${shape}`"
      >
        <template #prepend>
          <MIcon :name="ICONS.add" />
        </template>
        {{ density }} {{ shape }}
      </MButton>
    </div>

    <h2>Icon only</h2>
    <div class="fixture-row">
      <MButton
        aria-label="Add item"
        data-test="icon-only-default"
      >
        <template #prepend>
          <MIcon :name="ICONS.add" />
        </template>
      </MButton>
    </div>

    <h2>Toggle</h2>
    <table>
      <tbody>
        <tr
          v-for="row in toggleRows"
          :key="row"
        >
          <th scope="row">
            {{ row }}
          </th>
          <td
            v-for="variant in variants"
            :key="variant"
          >
            <MButton
              v-if="row === 'toggle'"
              v-model:selected="toggles[variant]"
              :variant="variant"
              :data-test="`toggle-${variant}`"
            >
              <!-- The glyph follows the state: a text toggle is otherwise told apart by colour alone. -->
              <template #prepend="{ selected }">
                <MIcon :name="selected ? ICONS.check : ICONS.add" />
              </template>
              {{ variant }}
            </MButton>
            <MButton
              v-else
              :variant="variant"
              selected
              :disabled="row === 'selected-disabled'"
              :data-test="`${row}-${variant}`"
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

    <h2>Link</h2>
    <div class="fixture-row">
      <MButton
        tag="link"
        to="/button/family"
        data-test="link-enabled"
      >
        Family
      </MButton>
      <MButton
        tag="link"
        to="/button/family"
        disabled
        data-test="link-disabled"
      >
        Family, disabled
      </MButton>
    </div>

    <output data-test="activations">{{ activations }}</output>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MButtonDensity, MButtonShape } from '#kit/components/ui/button/props'
import type { MColor, MVariant } from '#kit/shared/types/props'

const variants: MVariant[] = ['elevated', 'filled', 'tonal', 'outlined', 'text']
const colors: MColor[] = ['primary', 'secondary', 'tertiary', 'error']
const densities: MButtonDensity[] = ['compact', 'default', 'comfortable']
const shapes: MButtonShape[] = ['round', 'square']
const toggleRows = ['toggle', 'selected', 'selected-disabled'] as const
const toggles = reactive<Record<string, boolean>>(Object.fromEntries(variants.map(variant => [variant, false])))
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

  // Room above and below for the pointer-target probe of compact buttons.
  &--spaced {
    padding-block: 24rem;
  }
}
</style>
