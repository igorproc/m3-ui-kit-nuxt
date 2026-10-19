<template>
  <section class="fixture-hotkey-matrix">
    <h1>MHotkey — state matrix</h1>

    <table>
      <thead>
        <tr>
          <th scope="col">
            Combination
          </th>
          <th
            v-for="platform in platforms"
            :key="platform"
            scope="col"
          >
            {{ platform }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template
          v-for="combo in combos"
          :key="combo.name"
        >
          <tr
            v-for="state in states"
            :key="`${combo.name}-${state.name}`"
          >
            <th scope="row">
              {{ combo.name }} · {{ state.name }}
            </th>
            <td
              v-for="platform in platforms"
              :key="platform"
            >
              <MHotkey
                :keys="combo.keys"
                :platform="platform"
                :disabled="state.disabled"
                :data-test="`${combo.name}-${state.name}-${platform}`"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <h2>Every spelling of one key</h2>
    <div class="fixture-hotkey-matrix__row">
      <MHotkey
        v-for="spelling in spellings"
        :key="spelling"
        :keys="['alt', spelling]"
        platform="windows"
        :data-test="`spelling-${spelling}`"
      />
    </div>

    <h2>Registered shortcut</h2>
    <p>
      Press
      <MHotkey
        :hotkey="search"
        data-test="live"
      />
      to count. Typing it in the field below does nothing.
    </p>
    <label class="fixture-hotkey-matrix__field">
      Search field
      <input
        type="text"
        data-test="field"
      >
    </label>
    <output data-test="activations">{{ activations }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MHotkey from '#kit/components/ui/hotkey/index.vue'
import { useHotkey } from '#kit/composables/hotkey/useHotkey'
import { provideHotkeyLabels } from '#kit/composables/hotkey/useHotkeyLabels'
import type { HotkeyKey, HotkeyPlatform } from '#kit/shared/types/hotkey'

provideHotkeyLabels({ disabled: 'unavailable' })

const platforms: HotkeyPlatform[] = ['auto', 'mac', 'windows', 'linux']
const combos: Array<{ name: string, keys: HotkeyKey[] }> = [
  { name: 'mod-k', keys: ['mod', 'k'] },
  { name: 'shift-mod-p', keys: ['shift', 'mod', 'p'] },
  { name: 'alt-arrowup', keys: ['alt', 'arrowup'] },
  { name: 'ctrl-enter', keys: ['ctrl', 'enter'] },
  { name: 'meta-space', keys: ['meta', 'space'] },
  { name: 'escape', keys: ['escape'] },
  { name: 'question', keys: ['?'] },
]
const states = [
  { name: 'enabled', disabled: false },
  { name: 'disabled', disabled: true },
]
const spellings = ['arrowup', 'ArrowUp', 'up', 'UP', 'arrow-up']

const activations = ref(0)
const search = useHotkey(['mod', 'k'], () => {
  activations.value++
})
</script>

<style lang="scss">
.fixture-hotkey-matrix {
  display: grid;
  justify-items: start;
  gap: 16rem;

  table {
    border-spacing: 12rem;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
  }

  &__field {
    display: grid;
    gap: 4rem;
  }
}
</style>
