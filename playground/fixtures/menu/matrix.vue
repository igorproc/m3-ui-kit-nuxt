<template>
  <section class="fixture-menu">
    <h1>MMenu — matrix</h1>

    <h2>Activator</h2>
    <div class="fixture-menu__activator">
      <MMenu
        v-model="open"
        data-test="actions-menu"
      >
        <template #activator="{ props: trigger }">
          <MButton
            v-bind="trigger"
            data-test="trigger"
          >
            Actions
          </MButton>
        </template>

        <MMenuItem
          label="Copy"
          trailing-text="Ctrl+C"
          :leading-icon="ICONS.edit"
          data-test="item-copy"
          @select="pick('copy')"
        />
        <MMenuItem
          label="Cut"
          disabled
          data-test="item-cut"
          @select="pick('cut')"
        />
        <MMenuItem
          label="Duplicate"
          data-test="item-duplicate"
          @select="pick('duplicate')"
        />
        <MMenuItem
          label="Delete"
          data-test="item-delete"
          @select="pick('delete')"
        />
      </MMenu>

      <MButton
        variant="outlined"
        data-test="after"
      >
        After the menu
      </MButton>

      <output data-test="picked">{{ picked }}</output>
    </div>

    <h2>Expressive: variant × content (mounted open)</h2>
    <div class="fixture-menu__grid">
      <template
        v-for="variant in variants"
        :key="variant"
      >
        <div
          v-for="content in contents"
          :key="`${variant}-${content}`"
          class="fixture-menu__cell"
        >
          <MButton
            variant="tonal"
            :data-test="`anchor-${variant}-${content}`"
          >
            {{ variant }} · {{ content }}
            <MMenu
              :model-value="true"
              :variant="variant"
              :close-on-backdrop="false"
              :lock-scroll="false"
              :data-test="`menu-${variant}-${content}`"
            >
              <template v-if="content === 'items'">
                <MMenuItem
                  label="Cut"
                  trailing-text="Ctrl+X"
                  :leading-icon="ICONS.edit"
                  data-test="rest"
                />
                <MMenuItem
                  label="Paste"
                  supporting-text="Keeps the source formatting"
                  :leading-icon="ICONS.download"
                />
                <MMenuItem
                  label="Rename"
                  disabled
                  data-test="disabled"
                />
                <MMenuItem
                  label="Show grid"
                  role="menuitemcheckbox"
                  selected
                  data-test="selected"
                />
                <MMenuItem
                  label="Show ruler"
                  role="menuitemcheckbox"
                  selected
                  disabled
                  data-test="selected-disabled"
                />
                <MMenuItem
                  label="Details"
                  :trailing-icon="ICONS.chevronRight"
                />
              </template>

              <template v-else-if="content === 'groups'">
                <MMenuGroup
                  label="Sort by"
                  data-test="group-first"
                >
                  <MMenuItem
                    label="Name"
                    role="menuitemradio"
                    selected
                  />
                  <MMenuItem
                    label="Date"
                    role="menuitemradio"
                  />
                </MMenuGroup>
                <MMenuGroup data-test="group-middle">
                  <MMenuItem
                    label="Hidden files"
                    role="menuitemcheckbox"
                  />
                </MMenuGroup>
                <MMenuGroup data-test="group-last">
                  <MMenuItem label="Refresh" />
                  <MMenuItem label="Settings" />
                </MMenuGroup>
              </template>

              <MMenuGroup
                v-else
                label="Single group"
                data-test="group-single"
              >
                <MMenuItem label="Open" />
                <MMenuItem label="Share" />
              </MMenuGroup>
            </MMenu>
          </MButton>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MMenuGroup from '#kit/components/ui/menu/group/index.vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'
import type { MMenuVariant } from '#kit/components/ui/menu/types'
import { ICONS } from '#kit/shared/constants/icons'

const variants: MMenuVariant[] = ['elevated', 'tonal']
const contents = ['items', 'groups', 'single'] as const

const open = ref(false)
const picked = ref('')

function pick(name: string) {
  picked.value = name
  open.value = false
}
</script>

<style lang="scss">
.fixture-menu {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__activator {
    display: flex;
    align-items: flex-start;
    gap: 16rem;
    min-height: 280rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 320rem);
    grid-auto-rows: 480rem;
    gap: 16rem;
  }
}
</style>
