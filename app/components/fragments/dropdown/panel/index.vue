<template>
  <m-menu
    class="ui-dropdown__menu"
    absolute
    match-width
    :origin="ctx.menuOrigin.value"
    :model-value="ctx.isOpen.value"
    @update:model-value="onUpdate"
    @click-outside="ctx.close"
  >
    <m-list
      :id="ctx.listboxId"
      class="ui-dropdown__list"
      role="listbox"
      :aria-multiselectable="ctx.multiple.value || undefined"
    >
      <slot />
    </m-list>
  </m-menu>
</template>

<script setup lang="ts">
import { useDropdownContext } from '~/components/ui/dropdown/context'
import MMenu from '~/components/ui/menu/index.vue'
import MList from '~/components/ui/list/index.vue'

const ctx = useDropdownContext()

const onUpdate = (value: boolean) => {
  if (!value) ctx.close()
}
</script>
