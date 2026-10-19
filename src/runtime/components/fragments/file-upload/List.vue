<template>
  <!-- Mounted for good: the last row fades like the others, and only then
       does the list go and the empty state come. -->
  <!-- Hidden by a modifier, not v-show: a directive forces the group to render
       again whenever this component does, and a second render in one flush
       overwrites the positions the rows are to slide from. -->
  <TransitionGroup
    ref="list"
    tag="ul"
    name="ui-file-upload-row"
    class="ui-file-upload__list"
    :class="{ 'ui-file-upload__list--empty': !entries.length && !leaving, 'ui-file-upload__list--settling': settling }"
    :aria-label="ctx.messages.value.queue"
    @after-leave="settle"
    @leave-cancelled="settle"
  >
    <!-- One v-for straight under the group: a slot outlet or a wrapped v-for
         is a fragment, which the server writes out and the client flattens —
         a hydration mismatch on every row. A slot row goes through a component. -->
    <component
      :is="slots.item ? SlotRow : FileUploadItem"
      v-for="(entry, index) in entries"
      :key="entry.id"
      v-bind="rowProps(entry, index)"
    />
  </TransitionGroup>

  <slot
    v-if="!entries.length && !leaving"
    name="empty"
  >
    <p
      v-if="ctx.messages.value.empty"
      class="ui-file-upload__empty"
    >
      {{ ctx.messages.value.empty }}
    </p>
  </slot>
</template>

<script setup lang="ts">
/**
 * The upload queue as a list. Removing a row moves focus to the row that takes
 * its place — or, when the queue empties, to the dropzone's button — instead
 * of letting it fall to the page with the button that held it.
 */
import { Comment, Fragment, Text, TransitionGroup, computed, nextTick, ref, watch } from 'vue'
import type { FunctionalComponent, VNode } from 'vue'
import FileUploadItem from './Item.vue'
import { useFileUploadContext } from '#kit/utils/file-upload/context'
import type { FileUploadEntry } from '#kit/composables/file-upload/useFileUploadQueue'
import type { MFileUploadItemSlotProps } from '#kit/components/ui/file-upload/props'

const props = defineProps<{ canUpload: boolean }>()

const slots = defineSlots<{
  item?: (state: MFileUploadItemSlotProps) => VNode[]
  empty?: () => unknown
}>()

/** The first element a slot rendered, through any fragments it is wrapped in. */
function firstElement(nodes: VNode[]): VNode | undefined {
  for (const node of nodes) {
    if (node.type === Fragment) {
      const inner = firstElement(node.children as VNode[])
      if (inner) return inner
    } else if (node.type !== Comment && node.type !== Text) {
      return node
    }
  }
  return undefined
}

/** The consumer's row element itself — one root, the `li` the slot renders. */
const SlotRow: FunctionalComponent<{ render: () => VNode[] }> = props => firstElement(props.render())

const ctx = useFileUploadContext()
const list = ref<{ $el: HTMLElement } | null>(null)
const entries = computed(() => ctx.entries.value)
// Rows still fading out: the list stays until the last one has gone. Counted
// before the render (not in a leave hook): a state change in the middle of the
// group's patch renders it a second time, and the rows then lose the positions
// they were to slide from.
const leaving = ref(0)
watch(() => entries.value.map(entry => entry.id), (next, previous) => {
  leaving.value += previous.filter(id => !next.includes(id)).length
})

// A list that fits its box shrinks the moment a row leaves the flow; clipped
// to that box, the rows sliding up would vanish and come in from its edge.
// While they settle the list does not clip. A list that scrolls keeps its box.
const settling = ref(false)

function settle() {
  leaving.value = Math.max(0, leaving.value - 1)
  if (!leaving.value) settling.value = false
}

const rowProps = (entry: FileUploadEntry, index: number) => slots.item
  ? { render: () => slots.item!(stateOf(entry, index)) }
  : { entry, canUpload: props.canUpload, onRemove: () => remove(index) }

const stateOf = (entry: FileUploadEntry, index: number): MFileUploadItemSlotProps => ({
  entry,
  start: () => ctx.start(entry.id),
  cancel: () => ctx.cancel(entry.id),
  retry: () => ctx.retry(entry.id),
  remove: () => remove(index),
})

function focusTarget(host: HTMLElement | null | undefined, index: number) {
  // A removed row is still in the DOM while it leaves; it is not a target.
  const rows = host ? [...host.querySelectorAll<HTMLElement>('.ui-file-upload__item:not(.ui-file-upload-row-leave-active)')] : []
  const row = rows[Math.min(index, rows.length - 1)]
  const action = row?.querySelector<HTMLElement>('.ui-file-upload__item-actions button:not(:disabled)')
  return action ?? host?.closest('.ui-file-upload')?.querySelector<HTMLElement>('.ui-file-upload__choose')
}

function remove(index: number) {
  const entry = ctx.entries.value[index]
  if (!entry) return

  const host = list.value?.$el
  const component = host?.closest<HTMLElement>('.ui-file-upload')
  const hadFocus = host?.contains(document.activeElement) ?? false
  settling.value = Boolean(host && host.scrollHeight <= host.clientHeight)
  ctx.remove(entry.id)
  if (!hadFocus) return

  // The next row is still sliding into place: focusing it must not scroll.
  nextTick(() => {
    const target = focusTarget(list.value?.$el, index) ?? component?.querySelector<HTMLElement>('.ui-file-upload__choose')
    target?.focus({ preventScroll: true })
  })
}
</script>
