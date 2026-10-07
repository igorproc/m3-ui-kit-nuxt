<template>
  <section class="fixture-hotkey-stress">
    <h1>MHotkey — stress content</h1>

    <h2>Long combinations</h2>
    <div class="fixture-hotkey-stress__row">
      <MHotkey
        v-for="platform in platforms"
        :key="platform"
        :keys="['ctrl', 'alt', 'shift', 'meta', 'arrowup']"
        :platform="platform"
        :data-test="`long-${platform}`"
      />
    </div>

    <h2>Narrow container</h2>
    <div
      class="fixture-hotkey-stress__narrow"
      data-test="narrow"
    >
      <MHotkey
        :keys="['ctrl', 'alt', 'shift', 'meta', 'pagedown']"
        platform="windows"
        data-test="narrow-long"
      />
      <MHotkey
        :keys="['ctrl', 'supercalifragilisticexpialidocious']"
        platform="windows"
        data-test="narrow-word"
      />
    </div>

    <h2>In running text</h2>
    <p class="fixture-hotkey-stress__text">
      Press
      <MHotkey
        :keys="['mod', 'shift', 'p']"
        data-test="inline"
      />
      to open the command palette, or
      <MHotkey
        :keys="['escape']"
        data-test="inline-single"
      />
      to close it — the hint sits on the line without pushing it apart.
    </p>

    <h2>Many hints</h2>
    <div class="fixture-hotkey-stress__row">
      <MHotkey
        v-for="key in manyKeys"
        :key="key"
        :keys="['mod', key]"
        :data-test="`many-${key}`"
      />
    </div>

    <h2>Custom separator and unknown keys</h2>
    <div class="fixture-hotkey-stress__row">
      <MHotkey
        :keys="['ctrl', 'k']"
        separator="then"
        platform="windows"
        data-test="separator"
      />
      <MHotkey
        :keys="['f12']"
        data-test="function-key"
      />
      <MHotkey
        :keys="['home']"
        data-test="named-unknown"
      />
    </div>

    <h2>Empty</h2>
    <MHotkey
      :keys="[]"
      data-test="empty"
    />
  </section>
</template>

<script setup lang="ts">
import MHotkey from '#kit/components/ui/hotkey/index.vue'
import type { HotkeyPlatform } from '#kit/shared/types/hotkey'

const platforms: HotkeyPlatform[] = ['auto', 'mac', 'windows', 'linux']
const manyKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'l', 'm', 'n', 'o', 'q', 'r']
</script>

<style lang="scss">
.fixture-hotkey-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
  }

  &__narrow {
    display: grid;
    justify-items: start;
    gap: 8rem;
    width: 120rem;
  }

  &__text {
    max-width: 480rem;
  }
}
</style>
