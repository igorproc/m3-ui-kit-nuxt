<template>
  <span class="orders-profile">
    <MButtonIcon
      ref="trigger"
      :aria-label="`Профиль: ${USER.name}`"
      aria-haspopup="menu"
      :aria-expanded="String(open)"
      @click="open = !open"
    >
      <MAvatar
        :name="USER.name"
        alt=""
        density="compact"
        variant="filled"
      />
    </MButtonIcon>

    <MMenu
      v-model="open"
      absolute
      origin="top right"
    >
      <button
        type="button"
        class="ui-menu__item"
        @click="toggleTheme"
      >
        <span class="ui-menu__item-label">{{ isDark ? 'Светлая тема' : 'Тёмная тема' }}</span>
        <MIcon :name="isDark ? 'ic:outline-light-mode' : 'ic:outline-dark-mode'" />
      </button>
      <button
        type="button"
        class="ui-menu__item"
        @click="choose('Настройки магазина')"
      >
        <span class="ui-menu__item-label">Настройки магазина</span>
        <MIcon name="ic:outline-settings" />
      </button>
      <button
        type="button"
        class="ui-menu__item"
        @click="choose('Выход')"
      >
        <span class="ui-menu__item-label">Выйти</span>
        <MIcon name="ic:outline-logout" />
      </button>
    </MMenu>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useMenuFocusReturn } from './useMenuFocusReturn'

const emit = defineEmits<{
  (event: 'pick', label: string): void
}>()

const USER = { name: 'Анна Смирнова' }

const open = ref(false)
const trigger = useTemplateRef<ComponentPublicInstance>('trigger')
useMenuFocusReturn(open, trigger)

const theme = useMaterialTheme()
const isDark = computed(() => theme.definition === 'dark')

function toggleTheme() {
  theme.definition = isDark.value ? 'light' : 'dark'
  open.value = false
}

function choose(label: string) {
  open.value = false
  emit('pick', label)
}
</script>

<style lang="scss">
.orders-profile {
  display: inline-flex;
}
</style>
