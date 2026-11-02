<template>
  <!-- A filter chip keeps the leading box even unselected, at zero width: the
       checkmark grows into it instead of popping in. -->
  <span
    v-if="check || $slots.icon || $slots.avatar"
    class="ui-chip__leading"
  >
    <span
      v-if="check && selected"
      class="ui-chip__check"
    >
      <slot
        name="selected-icon"
        v-bind="{ selected, disabled, blocked }"
      >
        <MIcon :name="ICONS.check" />
      </slot>
    </span>
    <span
      v-else-if="$slots.avatar"
      class="ui-chip__avatar"
    >
      <slot name="avatar" />
    </span>
    <span
      v-else-if="$slots.icon"
      class="ui-chip__icon"
    >
      <slot name="icon" />
    </span>
  </span>

  <!-- The tooltip wraps the label only once a cut-off label was found (W19-А):
       until then — and in the server frame — the markup stays the plain one. -->
  <MTooltip
    v-if="tip"
    class="ui-chip__tip"
    :text="tipText"
    :open="tipOpen"
    @update:open="emit('update:tipOpen', $event)"
  >
    <span
      ref="label"
      class="ui-chip__label"
    >
      <slot />
    </span>
  </MTooltip>
  <span
    v-else
    ref="label"
    class="ui-chip__label"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * The leading part and the label of `<MChip>`, shared by its one-button and
 * two-button shapes. Private; styled by the chip's own block.
 */
import { useTemplateRef } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MTooltip from '#kit/components/ui/tooltip/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

defineProps<{
  selected: boolean
  disabled: boolean
  blocked: boolean
  /** The chip shows a checkmark while selected (a filter chip). */
  check: boolean
  /** Mount the tooltip of a cut-off label. */
  tip?: boolean
  tipText?: string
  tipOpen?: boolean
}>()

const emit = defineEmits<{ (event: 'update:tipOpen', value: boolean): void }>()

const label = useTemplateRef<HTMLElement>('label')

/** The label element, for the chip to measure on demand. */
defineExpose({ label })

defineSlots<{
  'default'?: () => unknown
  'icon'?: () => unknown
  'avatar'?: () => unknown
  'selected-icon'?: (scope: { selected: boolean, disabled: boolean, blocked: boolean }) => unknown
}>()
</script>
