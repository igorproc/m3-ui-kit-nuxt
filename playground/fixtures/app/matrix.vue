<template>
  <section class="fixture-app-matrix">
    <h1>MApp — application boundary</h1>

    <h2>Theme definition</h2>
    <div
      class="fixture-app-matrix__row"
      role="group"
      aria-label="Theme definition"
    >
      <MButton
        v-for="definition in definitions"
        :key="definition"
        :variant="theme.definition === definition ? 'filled' : 'outlined'"
        :aria-pressed="theme.definition === definition"
        :data-test="`definition-${definition}`"
        @click="theme.definition = definition"
      >
        {{ definition }}
      </MButton>
    </div>

    <h2>Head attributes</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">
            Attribute
          </th>
          <th scope="col">
            Controller value
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="name in attributes"
          :key="name"
        >
          <th scope="row">
            {{ name }}
          </th>
          <td :data-test="`attr-${name}`">
            {{ theme.htmlAttrs[name] }}
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Root roles</h2>
    <p
      class="fixture-app-matrix__probe"
      data-test="role-probe"
    >
      background / on-background
    </p>

    <h2>Overlay host</h2>
    <div class="fixture-app-matrix__field">
      <MDropdown
        v-model="fruit"
        :items="items"
        item-title="name"
        item-value="id"
        label="Overlay probe"
        data-test="overlay-probe"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDropdown from '#kit/components/ui/dropdown/index.vue'
import { useMaterialTheme } from '#kit/composables/useMaterialTheme'
import type { TDefinition } from '#kit/shared/types/kit'

const theme = useMaterialTheme()

const definitions: TDefinition[] = ['light', 'dark', 'system']
const attributes = ['data-definition', 'data-palette', 'data-contrast'] as const

const items = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
]
const fruit = ref<number>()
</script>

<style lang="scss">
.fixture-app-matrix {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16rem;

  table {
    width: 100%;
    table-layout: fixed;
    border-spacing: 8rem;
  }

  th,
  td {
    overflow-wrap: anywhere;
    text-align: start;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
  }

  &__probe {
    padding: 12rem;
    background-color: var(--md-sys-color-background);
    color: var(--md-sys-color-on-background);
  }

  &__field {
    max-width: 320rem;
  }
}
</style>
