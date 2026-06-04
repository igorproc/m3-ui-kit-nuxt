<template>
  <m-dropdown-item
    :selected="ctx.isSelected(option)"
    @click="ctx.select(option)"
  >
    <slot>
      {{ option.label }}
    </slot>
  </m-dropdown-item>
</template>

<script setup lang="ts">
import { useDropdownContext } from '../context'
import type { DropdownOption } from '../types'
import MDropdownItem from '../item/index.vue'

interface Props {
  option: DropdownOption
}

defineProps<Props>()

const ctx = useDropdownContext()
</script>
