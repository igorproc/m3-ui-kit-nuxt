<template>
  <MTextField
    v-model="draft"
    class="ui-color-edit"
    :label="label"
    :disabled="ctx.disabled.value"
    :error="!ctx.valid.value"
    variant="outlined"
    spellcheck="false"
    autocapitalize="none"
    autocomplete="off"
    @keydown.enter.prevent="commit"
    @keydown.esc.prevent="revert"
    @blur="commit"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useColorPickerContext } from '~/composables/color-picker/context'

/** Private edit leaf: a text field over the formatted value with draft/commit. */
const ctx = useColorPickerContext()

const label = 'Color value'
const draft = ref(ctx.value.value ?? '')

// Keep the draft in sync with committed value (e.g. canvas/swatch changes).
watch(() => ctx.value.value, (value) => {
  draft.value = value ?? ''
})

function commit() {
  if (draft.value.trim() === '') {
    revert()
    return
  }
  if (ctx.selectColor(draft.value)) ctx.commit('edit')
  else revert()
}

function revert() {
  draft.value = ctx.value.value ?? ''
}
</script>
