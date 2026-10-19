<template>
  <section class="fixture-lazy">
    <h1>MLazy — state matrix</h1>

    <table>
      <thead>
        <tr>
          <th scope="col">
            State
          </th>
          <th
            v-for="mode in modes"
            :key="mode"
            scope="col"
          >
            {{ mode }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.name"
        >
          <th scope="row">
            {{ row.name }}
          </th>
          <td
            v-for="mode in modes"
            :key="mode"
          >
            <span v-if="row.idle && mode !== 'on-interaction'">—</span>

            <component
              :is="row.clientOnly && mode === 'eager' ? ClientOnly : Bare"
              v-else
            >
              <MLazy
                :mode="mode"
                :min-height="96"
                :active="preActivated(row, mode)"
                :interactions="row.interactions"
                error-text="Preview failed to load"
                retry-label="Try again"
                :data-test="`${row.name}-${mode}`"
              >
                <component :is="row.content" />

                <template #placeholder="{ activate }">
                  <MButton
                    v-if="row.ownControl"
                    variant="tonal"
                    @click="activate"
                  >
                    Load preview
                  </MButton>
                  <div
                    v-else
                    class="fixture-lazy__skeleton"
                  >
                    Load preview
                  </div>
                </template>

                <template
                  v-if="row.fallback"
                  #fallback
                >
                  <div class="fixture-lazy__skeleton">
                    Loading preview…
                  </div>
                </template>

                <template
                  v-if="row.errorSlot"
                  #error="{ retry }"
                >
                  <div class="fixture-lazy__error">
                    <p>Preview unavailable</p>
                    <MButton
                      variant="text"
                      @click="retry"
                    >
                      Reload preview
                    </MButton>
                  </div>
                </template>
              </MLazy>
            </component>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent, defineComponent, h, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { ClientOnly } from '#components'
import MButton from '#kit/components/ui/button/index.vue'
import MLazy from '#kit/components/ui/lazy/index.vue'
import type { MLazyInteraction, MLazyMode } from '#kit/components/ui/lazy/props'

interface Row {
  name: string
  content: Component
  idle?: boolean
  interactions?: MLazyInteraction[]
  ownControl?: boolean
  fallback?: boolean
  errorSlot?: boolean
  clientOnly?: boolean
}

const Bare = defineComponent({ setup: (_, { slots }) => () => slots.default?.() })
const Instant = defineComponent({ setup: () => () => h('p', { class: 'fixture-lazy__card' }, 'Preview loaded') })
const Endless = defineAsyncComponent(() => new Promise<Component>(() => {}))
const Broken = defineAsyncComponent(() => Promise.reject(new Error('Fixture: the preview chunk failed to load')))

const modes: MLazyMode[] = ['eager', 'on-idle', 'on-view', 'on-interaction']
const rows: Row[] = [
  { name: 'idle', content: Instant, idle: true },
  { name: 'idle-click', content: Instant, idle: true, interactions: ['click'] },
  { name: 'idle-own-control', content: Instant, idle: true, ownControl: true },
  { name: 'pending', content: Endless, fallback: true, clientOnly: true },
  { name: 'pending-no-fallback', content: Endless, clientOnly: true },
  { name: 'active', content: Instant },
  { name: 'error', content: Broken, clientOnly: true },
  { name: 'error-slot', content: Broken, errorSlot: true, clientOnly: true },
]

const hydrated = ref(false)

onMounted(() => {
  hydrated.value = true
})

function preActivated(row: Row, mode: MLazyMode) {
  return mode === 'on-interaction' && !row.idle ? hydrated.value : undefined
}
</script>

<style lang="scss">
.fixture-lazy {
  display: grid;
  gap: 16rem;

  table {
    border-spacing: 12rem;
  }

  td {
    min-width: 160rem;
    vertical-align: top;
  }

  &__skeleton,
  &__card,
  &__error {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    min-height: 96rem;
    margin: 0;
    padding: 8rem;
    border-radius: var(--sys-shape-corner-medium);
    overflow-wrap: anywhere;
  }

  &__skeleton {
    background: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface-variant);
  }

  &__card {
    background: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }

  &__error {
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }
}
</style>
