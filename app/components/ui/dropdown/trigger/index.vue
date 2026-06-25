<template>
  <div
    ref="triggerRef"
    class="ui-dropdown__trigger"
    role="combobox"
    :tabindex="ctx.disabled.value ? -1 : 0"
    :aria-expanded="ctx.isOpen.value"
    aria-haspopup="listbox"
    :aria-controls="ctx.listboxId"
    :aria-disabled="ctx.disabled.value || undefined"
    :aria-activedescendant="ctx.activeDescendant.value"
    @click="ctx.toggle"
    @keydown="ctx.onTriggerKeydown"
  >
    <m-text-field
      :path="path"
      :label="label"
      :placeholder="placeholder"
      :model-value="ctx.multiple.value ? '' : ctx.selectedLabel.value"
      :focused="ctx.fieldFocused.value"
      readonly
      :disabled="ctx.disabled.value"
      :variant="ctx.variant.value"
      class="ui-dropdown__field"
      :class="{ 'ui-dropdown__field--multiple': ctx.multiple.value && ctx.selectedItems.value.length }"
    >
      <template
        v-if="ctx.multiple.value && ctx.selectedItems.value.length"
        #prepend
      >
        <slot name="chips" />
      </template>

      <template #append>
        <m-icon
          :name="ICONS.arrowDropDown"
          class="ui-dropdown__arrow"
        />
      </template>
    </m-text-field>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { ICONS } from '~~/shared/constants/icons'
import { useDropdownContext } from '../context'
import MTextField from '~/components/ui/text-field/index.vue'
import MIcon from '~/components/ui/icon/index.vue'

interface Props {
  path?: string
  label?: string
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  path: '',
  label: '',
  placeholder: '',
})

const ctx = useDropdownContext()

// Expose the combobox element so the orchestrator can return focus on close.
const triggerRef = ref<HTMLElement | null>(null)

onMounted(() => ctx.setTriggerEl(triggerRef.value))
onBeforeUnmount(() => ctx.setTriggerEl(null))
</script>
