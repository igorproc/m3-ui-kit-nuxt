<template>
  <section class="fixture-switch-stress">
    <h1>MSwitch — stress content</h1>

    <div
      class="fixture-switch-stress__narrow"
      data-test="long-label"
    >
      <MSwitch
        v-model="sync"
        label="Keep every draft, comment and attachment in sync across all of the devices signed in to this account"
        helper-text="Turning this off keeps the copies already on each device but stops new changes from travelling"
        required
      />
    </div>

    <div
      class="fixture-switch-stress__narrow"
      data-test="long-word"
    >
      <MSwitch
        v-model="link"
        icons="both"
        label="https://example.com/a/very/long/path/without/any/spaces/at/all"
      />
    </div>

    <div
      class="fixture-switch-stress__narrow"
      data-test="long-error"
    >
      <MSwitch
        v-model="terms"
        label="Share usage data"
        error-message="Turn usage sharing on before you continue: the trial needs it to measure the seats you use"
      />
    </div>

    <div data-test="mixed-script">
      <MSwitch
        v-model="script"
        icons="selected"
        label="Сохранить 保存 حفظ 🙂"
      />
    </div>

    <h2>Many settings</h2>
    <div
      class="fixture-switch-stress__list"
      data-test="many"
    >
      <MSwitch
        v-for="setting in settings"
        :key="setting"
        v-model="enabled[setting]"
        :label="setting"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MSwitch from '#kit/components/ui/switch/index.vue'

const settings = Array.from({ length: 12 }, (_, index) => `Notification channel ${index + 1}`)

const sync = ref(true)
const link = ref(false)
const terms = ref(false)
const script = ref(true)
const enabled = reactive<Record<string, boolean>>(Object.fromEntries(settings.map((setting, index) => [setting, index % 2 === 0])))
</script>

<style lang="scss">
.fixture-switch-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    inline-size: 200rem;
  }

  &__list {
    display: grid;
    gap: 8rem;
  }
}
</style>
