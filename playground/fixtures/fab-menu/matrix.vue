<template>
  <section class="fixture-fab-menu">
    <h1>MFabMenu — matrix</h1>

    <div class="fixture-fab-menu__grid">
      <template
        v-for="color in colors"
        :key="color"
      >
        <div
          v-for="align in aligns"
          :key="align"
          class="fixture-fab-menu__cell"
          :class="`fixture-fab-menu__cell--${align}`"
        >
          <MFabMenu
            :color="color"
            :align="align"
            :items="items"
            :aria-label="`Create, ${color} ${align}`"
            :data-test="`menu-${color}-${align}`"
            @select="item => lastSelect = String(item.value)"
          />
        </div>
      </template>

      <div
        v-for="density in densities"
        :key="density"
        class="fixture-fab-menu__cell fixture-fab-menu__cell--end"
      >
        <MFabMenu
          :density="density"
          :items="items"
          :aria-label="`Create, ${density}`"
          :data-test="`menu-density-${density}`"
        />
      </div>

      <div class="fixture-fab-menu__cell fixture-fab-menu__cell--end">
        <MFabMenu
          disabled
          :items="items"
          aria-label="Create, disabled"
          data-test="menu-disabled"
        />
      </div>

      <div class="fixture-fab-menu__cell fixture-fab-menu__cell--end">
        <MFabMenu
          v-model:open="controlled"
          :items="itemsWithDisabled"
          aria-label="Create, controlled"
          data-test="menu-controlled"
        />
      </div>
    </div>

    <output data-test="last-select">{{ lastSelect }}</output>
    <output data-test="controlled-open">{{ controlled }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MFabMenu from '#kit/components/ui/fab-menu/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MButtonDensity } from '#kit/components/ui/button/props'
import type { MFabMenuAlign, MFabMenuItem } from '#kit/components/ui/fab-menu/props'
import type { MColor } from '#kit/shared/types/props'

const colors: MColor[] = ['primary', 'secondary', 'tertiary']
const aligns: MFabMenuAlign[] = ['start', 'end']
const densities: MButtonDensity[] = ['compact', 'default', 'comfortable']

const items: MFabMenuItem[] = [
  { label: 'Message', icon: ICONS.chat, value: 'message' },
  { label: 'Email', icon: ICONS.email, value: 'email' },
  { label: 'Event', icon: ICONS.event, value: 'event' },
]
const itemsWithDisabled: MFabMenuItem[] = [...items, { label: 'Call', icon: ICONS.phone, value: 'call', disabled: true }]

const lastSelect = ref('')
const controlled = ref(false)
</script>

<style lang="scss">
.fixture-fab-menu {
  display: grid;
  gap: 16rem;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280rem, 1fr));
    gap: 24rem;
  }

  // Room above every FAB for its column of actions.
  &__cell {
    display: flex;
    align-items: flex-end;
    min-height: 320rem;

    &--end {
      justify-content: flex-end;
    }
  }
}
</style>
