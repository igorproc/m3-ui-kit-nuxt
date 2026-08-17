<template>
  <m-dropdown-item
    :entry="option"
    :selected="ctx.isSelected(option)"
    @click="ctx.select(option)"
  >
    <slot>
      {{ option.label }}
    </slot>
  </m-dropdown-item>
</template>

<script setup lang="ts">
import { useDropdownContext } from '#kit/components/ui/dropdown/context'
import type { DropdownOption } from '#kit/components/ui/dropdown/types'
import MDropdownItem from '../item/index.vue'

interface Props {
  option: DropdownOption
}

defineProps<Props>()

const ctx = useDropdownContext()
</script>
