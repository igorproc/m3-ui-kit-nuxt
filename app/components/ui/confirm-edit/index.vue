<template>
  <slot
    name="activator"
    :props="activatorProps"
    :open="openEditor"
    :close="requestClose"
    :is-open="open"
  />

  <MDialog
    v-if="resolvedPresentation === 'dialog'"
    v-model="hostOpen"
    :title="title"
    :click-to-close="true"
    :esc-to-close="true"
  >
    <EditorContent />
  </MDialog>

  <MOverlay
    v-else
    v-model="hostOpen"
    mode="popover"
    transition="ui-confirm-edit-pop"
  >
    <section
      :id="surfaceId"
      class="ui-confirm-edit"
      role="dialog"
      :style="popoverStyle"
      :aria-labelledby="titleId"
      :aria-busy="transaction.saving.value"
    >
      <h2
        :id="titleId"
        class="ui-confirm-edit__title"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </h2>
      <EditorContent />
    </section>
  </MOverlay>

  <MDialog
    v-model="discardOpen"
    :title="discardTitle"
    :click-to-close="false"
    :esc-to-close="false"
  >
    <p>{{ discardText }}</p>
    <template #actions>
      <MButton
        type="button"
        variant="text"
        @click="discardOpen = false"
      >
        Continue editing
      </MButton>
      <MButton
        type="button"
        color="error"
        @click="confirmDiscard"
      >
        Discard changes
      </MButton>
    </template>
  </MDialog>
</template>

<script setup lang="ts" generic="T">
import type { CSSProperties } from 'vue'
import { h } from 'vue'
import MButton from '~/components/ui/button/index.vue'
import MDialog from '~/components/ui/dialog/index.vue'
import MOverlay from '~/components/ui/overlay/index.vue'
import { useConfirmEditTransaction } from '~/composables/confirm-edit/useConfirmEditTransaction'
import { useBreakpoint } from '~/composables/useBreakpoint'
import { mConfirmEditProps } from './props'

const props = defineProps(mConfirmEditProps)
const model = defineModel<T>({ required: true })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  (event: 'save' | 'cancel', value: T): void
  (event: 'open' | 'close'): void
  (event: 'error', error: unknown): void
  (event: 'conflict', external: T, draft: T): void
}>()
const slots = useSlots()
const discardOpen = ref(false)
const activator = shallowRef<HTMLElement>()
const anchorRect = shallowRef<{ left: number, top: number, width: number }>()
const surfaceId = useId()
const titleId = `${surfaceId}-title`
const { less } = useBreakpoint()
const resolvedPresentation = computed(() => props.presentation === 'auto'
  ? (less.value.medium ? 'dialog' : 'popover')
  : props.presentation)

const transaction = useConfirmEditTransaction<T>({
  model,
  open,
  clone: props.clone as ((value: T) => T) | undefined,
  compare: props.compare as ((draft: T, committed: T) => boolean) | undefined,
  save: props.save as ((draft: T, committed: T) => T | undefined | Promise<T | undefined>) | undefined,
  onSave: value => emit('save', value),
  onError: error => emit('error', error),
  onConflict: (external, draft) => emit('conflict', external, draft),
})

const activatorProps = computed(() => ({
  'aria-haspopup': 'dialog' as const,
  'aria-expanded': open.value,
  'aria-controls': surfaceId,
  'disabled': props.disabled,
  'onClick': openEditor,
}))
const popoverStyle = computed<CSSProperties | undefined>(() => anchorRect.value
  ? {
      insetInlineStart: `${anchorRect.value.left}px`,
      insetBlockStart: `${anchorRect.value.top}px`,
      minWidth: `${anchorRect.value.width}px`,
    }
  : undefined)

const hostOpen = computed({
  get: () => open.value,
  set: (value) => {
    if (value) openEditor()
    else void requestClose()
  },
})

function openEditor(event?: Event) {
  if (props.disabled || open.value) return
  const target = event?.currentTarget
  if (target instanceof HTMLElement) {
    activator.value = target
    const rect = target.getBoundingClientRect()
    anchorRect.value = { left: rect.left, top: rect.bottom, width: rect.width }
  }
  open.value = true
}

async function requestClose(explicit = false) {
  if (!open.value || transaction.saving.value) return false
  if (explicit || !transaction.dirty.value) {
    transaction.cancel()
    open.value = false
    return true
  }
  if (props.dirtyCloseBehavior === 'prevent') return false
  if (props.dirtyCloseBehavior === 'discard') {
    transaction.cancel()
    open.value = false
    return true
  }
  discardOpen.value = true
  return false
}

function confirmDiscard() {
  discardOpen.value = false
  transaction.cancel()
  emit('cancel', transaction.committed.value)
  open.value = false
}

async function saveAndClose() {
  if (!await transaction.save()) return
  open.value = false
}

function explicitCancel() {
  emit('cancel', transaction.committed.value)
  void requestClose(true)
}

const editorState = () => ({
  draft: transaction.draft.value,
  committed: transaction.committed.value,
  dirty: transaction.dirty.value,
  saving: transaction.saving.value,
  conflicted: transaction.conflicted.value,
  error: transaction.error.value,
  setDraft: transaction.setDraft,
  patchDraft: transaction.patchDraft,
  save: saveAndClose,
  cancel: explicitCancel,
  reset: transaction.reset,
  sync: transaction.sync,
})

const EditorContent = () => h('div', { class: 'ui-confirm-edit__body' }, [
  transaction.conflicted.value
    ? h('div', { class: 'ui-confirm-edit__conflict', role: 'alert' }, slots.conflict?.(editorState()) ?? [
        h('span', 'The value changed outside this editor.'),
        h(MButton, { type: 'button', variant: 'text', onClick: transaction.sync }, () => 'Use latest value'),
      ])
    : null,
  transaction.error.value
    ? h('div', { class: 'ui-confirm-edit__error', role: 'alert' }, slots.error?.({ error: transaction.error.value, retry: saveAndClose }) ?? String(transaction.error.value))
    : null,
  h('div', { class: 'ui-confirm-edit__editor' }, slots.editor?.(editorState()) ?? []),
  h('div', { class: 'ui-confirm-edit__actions' }, slots.actions?.(editorState()) ?? [
    h(MButton, { type: 'button', variant: 'text', disabled: transaction.saving.value, onClick: explicitCancel }, () => props.cancelText),
    h(MButton, {
      type: 'button',
      disabled: !transaction.dirty.value || transaction.saving.value || transaction.conflicted.value,
      loading: transaction.saving.value,
      onClick: saveAndClose,
    }, () => props.saveText),
  ]),
])

watch(open, (value, previous) => {
  if (value === previous) return
  emit(value ? 'open' : 'close')
  if (!value) nextTick(() => activator.value?.focus())
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/confirm-edit' as t;

.ui-confirm-edit {
  $t: material-map(t.$tokens, 'md-confirm-edit');

  display: flex;
  position: fixed;
  flex-direction: column;
  min-width: g($t, 'surface-min-width');
  max-width: g($t, 'surface-max-width');
  margin: g($t, 'surface-margin');
  padding: g($t, 'surface-padding');
  gap: g($t, 'surface-gap');
  border-radius: g($t, 'surface-shape');
  background: g($t, 'surface-container');
  color: g($t, 'surface-color');
  box-shadow: g($t, 'surface-elevation');

  &__title {
    margin: 0;

    @include typescale(g($t, 'title-typography'));
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: g($t, 'surface-gap');
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: g($t, 'actions-gap');
  }

  &__error {
    color: g($t, 'error-color');
  }

  &__conflict {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: g($t, 'conflict-padding');
    border-radius: g($t, 'conflict-shape');
    background: g($t, 'conflict-container');
    color: g($t, 'conflict-color');
  }
}
</style>
