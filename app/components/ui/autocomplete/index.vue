<template>
  <div
    class="ui-autocomplete"
    :class="{ 'ui-autocomplete--open': open, 'ui-autocomplete--multiple': multiple }"
  >
    <MTextField
      v-model:focused="focused"
      :model-value="draft"
      :label="label"
      :placeholder="placeholder"
      :helper-text="helperText"
      :error="error"
      :error-message="errorMessage"
      :variant="variant"
      :path="path"
      :name="name"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autofocus="autofocus"
      autocomplete="off"
      :input-attrs="inputAttrs"
      @update:model-value="onInput"
    >
      <template
        v-if="multiple && selectedEntries.length"
        #prepend
      >
        <span class="ui-autocomplete__selections">
          <template
            v-for="entry in selectedEntries"
            :key="entry.key"
          >
            <slot
              name="selection"
              :item="entry.item"
              :value="entry.value"
              :title="entry.title"
              :remove="() => remove(entry)"
            >
              <MChip
                type="input"
                :disabled="disabled || readonly"
                @click.stop="remove(entry)"
              >
                {{ entry.title }}
                <template #trailing>
                  <MIcon name="round-close" />
                </template>
              </MChip>
            </slot>
          </template>
        </span>
      </template>

      <template #append>
        <MButtonIcon
          v-if="clearable && canClear"
          type="button"
          aria-label="Clear selection"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="clear"
        >
          <MIcon name="round-close" />
        </MButtonIcon>

        <MButtonIcon
          type="button"
          aria-label="Toggle options"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="toggle"
        >
          <MIcon :name="open ? 'round-arrow-drop-up' : 'round-arrow-drop-down'" />
        </MButtonIcon>
      </template>
    </MTextField>

    <MMenu
      v-model="open"
      class="ui-autocomplete__menu"
      absolute
      match-width
      origin="top left"
      @click-outside="closeAndRestore"
    >
      <MList
        :id="listboxId"
        class="ui-autocomplete__list"
        role="listbox"
        :aria-multiselectable="multiple ? 'true' : undefined"
        @mousedown.prevent
      >
        <MProgressLinear
          v-if="loading"
          indeterminate
          aria-label="Loading options"
        />

        <slot
          v-if="loading"
          name="loading"
        >
          <div class="ui-autocomplete__state">
            Loading…
          </div>
        </slot>
        <template v-else-if="visibleEntries.length">
          <MListItem
            v-for="(entry, index) in visibleEntries"
            :id="entry.id"
            :key="entry.key"
            class="ui-autocomplete__option"
            :class="{
              'ui-autocomplete__option--active': activeIndex === index,
              'ui-autocomplete__option--selected': isSelected(entry.value),
              'ui-autocomplete__option--disabled': entry.disabled,
            }"
            role="option"
            lines="1"
            :interactive="true"
            :disabled="entry.disabled"
            :aria-selected="isSelected(entry.value)"
            :aria-disabled="entry.disabled ? 'true' : undefined"
            @pointermove="setActive(index)"
            @click="select(entry)"
          >
            <slot
              name="item"
              :item="entry.item"
              :value="entry.value"
              :title="entry.title"
              :selected="isSelected(entry.value)"
              :disabled="entry.disabled"
            >
              {{ entry.title }}
            </slot>
          </MListItem>
        </template>
        <slot
          v-else-if="!items.length"
          name="empty"
        >
          <div class="ui-autocomplete__state">
            No options
          </div>
        </slot>
        <slot
          v-else
          name="no-results"
          :query="search"
        >
          <div class="ui-autocomplete__state">
            No results
          </div>
        </slot>
      </MList>
    </MMenu>
  </div>
</template>

<script setup lang="ts" generic="TItem, TValue = TItem">
import type { InputHTMLAttributes } from 'vue'
import MButtonIcon from '~/components/ui/button/icon/index.vue'
import MChip from '~/components/ui/chip/index.vue'
import MIcon from '~/components/ui/icon/index.vue'
import MList from '~/components/ui/list/index.vue'
import MListItem from '~/components/ui/list/item/index.vue'
import MMenu from '~/components/ui/menu/index.vue'
import MProgressLinear from '~/components/ui/progress/linear/index.vue'
import MTextField from '~/components/ui/text-field/index.vue'
import { useListbox } from '~/composables/listbox/useListbox'
import { mAutocompleteProps } from './props'

const props = defineProps(mAutocompleteProps)
const model = defineModel<TValue | TValue[] | undefined>()
const search = defineModel<string>('search', { default: '' })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  (event: 'select' | 'remove', item: TItem): void
  (event: 'clear' | 'open' | 'close'): void
}>()

interface Entry {
  item: TItem
  value: TValue
  title: string
  disabled: boolean
  key: string | number
  id: string
}

const focused = ref(false)
const composing = ref(false)
const draft = ref(search.value)
const listboxId = useId()

function resolve<TResult>(item: TItem, resolver: string | ((item: unknown) => TResult) | undefined, fallback: TResult): TResult {
  if (typeof resolver === 'function') return resolver(item) as TResult
  if (typeof resolver === 'string' && item && typeof item === 'object') {
    return (item as Record<string, TResult>)[resolver] ?? fallback
  }
  return fallback
}

const entries = computed<Entry[]>(() => props.items.map((raw, index) => {
  const item = raw as TItem
  const title = String(resolve(item, props.itemTitle, typeof item === 'object' ? '' : item))
  const value = resolve(item, props.itemValue, item as unknown as TValue)
  const key = resolve(item, props.itemKey, String(value ?? index))
  return {
    item,
    value,
    title,
    key,
    disabled: Boolean(resolve(item, props.itemDisabled, false)),
    id: `${listboxId}-option-${String(key).replace(/[^\w-]/g, '-')}`,
  }
}))

const selectedValues = computed<TValue[]>(() => props.multiple
  ? (Array.isArray(model.value) ? model.value : []) as TValue[]
  : model.value === undefined ? [] : [model.value as TValue])
const isSelected = (value: TValue) => selectedValues.value.some(selected => Object.is(selected, value))
const selectedEntries = computed(() => selectedValues.value.map((value, index) => entries.value.find(entry => Object.is(entry.value, value)) ?? ({
  item: value as unknown as TItem,
  value,
  title: String(value),
  disabled: false,
  key: `selected-${index}-${String(value)}`,
  id: '',
})))
const queryReady = computed(() => search.value.length >= Math.max(0, props.minSearchLength))
const visibleEntries = computed(() => {
  if (!queryReady.value) return []
  const query = search.value.trim().toLocaleLowerCase()
  return entries.value.filter((entry) => {
    if (props.hideSelected && isSelected(entry.value)) return false
    if (props.filter === false || !query) return true
    if (typeof props.filter === 'function') return props.filter(entry.item, search.value, entry.title)
    const title = entry.title.toLocaleLowerCase()
    return props.filterMode === 'starts-with' ? title.startsWith(query) : title.includes(query)
  })
})

const { activeIndex, activeEntry, activeDescendant, setActive, move } = useListbox(
  visibleEntries,
  open,
  () => props.autoSelectFirst,
)
const canClear = computed(() => !props.mandatory && (selectedValues.value.length > 0 || draft.value !== ''))
const selectedTitle = computed(() => selectedEntries.value[0]?.title ?? '')
const inputAttrs = computed<InputHTMLAttributes>(() => ({
  'role': 'combobox',
  'aria-autocomplete': 'list',
  'aria-haspopup': 'listbox',
  'aria-expanded': String(open.value),
  'aria-controls': listboxId,
  'aria-activedescendant': open.value ? activeDescendant.value : undefined,
  onKeydown,
  'onCompositionstart': () => { composing.value = true },
  'onCompositionend': () => { composing.value = false },
}))

function onInput(value: string) {
  draft.value = value
  search.value = value
  if (!composing.value && !props.disabled && !props.readonly && queryReady.value) open.value = true
}

function restore() {
  const value = props.multiple ? '' : selectedTitle.value
  draft.value = value
  search.value = value
}

function closeAndRestore() {
  open.value = false
  restore()
}

function select(entry: Entry | undefined) {
  if (!entry || entry.disabled || props.disabled || props.readonly) return
  if (props.multiple) {
    const values = [...selectedValues.value]
    const index = values.findIndex(value => Object.is(value, entry.value))
    if (index >= 0) {
      if (props.mandatory && values.length === 1) return
      values.splice(index, 1)
      model.value = values
      emit('remove', entry.item)
    } else {
      values.push(entry.value)
      model.value = values
      emit('select', entry.item)
    }
    draft.value = ''
    search.value = ''
    return
  }
  model.value = entry.value
  draft.value = entry.title
  search.value = entry.title
  open.value = false
  emit('select', entry.item)
}

function remove(entry: Entry) {
  if (!props.multiple || props.disabled || props.readonly) return
  const values = [...selectedValues.value]
  if (props.mandatory && values.length === 1) return
  const index = values.findIndex(value => Object.is(value, entry.value))
  if (index < 0) return
  values.splice(index, 1)
  model.value = values
  emit('remove', entry.item)
}

function clear() {
  if (!canClear.value) return
  model.value = props.multiple ? [] : undefined
  draft.value = ''
  search.value = ''
  emit('clear')
}

function toggle() {
  if (props.disabled || props.readonly) return
  open.value = !open.value
}

function onKeydown(event: KeyboardEvent) {
  if (composing.value || props.disabled || props.readonly) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) open.value = true
    nextTick(() => move(event.key === 'ArrowDown' ? 'next' : 'previous'))
  } else if (open.value && event.key === 'Home') {
    event.preventDefault()
    move('first')
  } else if (open.value && event.key === 'End') {
    event.preventDefault()
    move('last')
  } else if (open.value && event.key === 'Enter') {
    event.preventDefault()
    select(activeEntry.value)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeAndRestore()
  } else if (event.key === 'Tab') {
    closeAndRestore()
  } else if (props.multiple && event.key === 'Backspace' && !draft.value && selectedEntries.value.length) {
    remove(selectedEntries.value.at(-1)!)
  }
}

watch(focused, (value) => {
  if (value && props.openOnFocus && !props.disabled && !props.readonly) open.value = true
  if (!value && !open.value) restore()
})
watch(model, () => {
  if (!focused.value) restore()
})
watch(open, value => emit(value ? 'open' : 'close'))
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/autocomplete' as t;

.ui-autocomplete {
  $t: material-map(t.$tokens, 'md-autocomplete');

  position: relative;
  width: 100%;

  &__selections {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: g($t, 'selections-gap');
  }

  &__menu :deep(.ui-menu__surface) {
    width: 100%;
    min-width: unset;
    top: 0;
    right: 0;
    margin-top: g($t, 'menu-margin-top');
  }

  &__list {
    max-height: g($t, 'menu-max-height');
    padding-block: g($t, 'list-padding-block');
    overflow-y: auto;
  }

  &__option {
    display: flex;
    align-items: center;
    min-height: g($t, 'option-min-height');
    padding-inline: g($t, 'option-padding-inline');
    color: g($t, 'option-color');
    cursor: pointer;

    &--active {
      background: g($t, 'option-hover-container');
    }

    &--selected {
      background: g($t, 'option-selected-container');
      color: g($t, 'option-selected-color');
    }

    &:active:not(&--disabled) {
      background: g($t, 'option-active-container');
    }

    &--disabled {
      cursor: default;
      opacity: g($t, 'option-disabled-opacity');
    }
  }

  &__state {
    padding: g($t, 'state-padding');
    color: g($t, 'state-color');
  }
}
</style>
