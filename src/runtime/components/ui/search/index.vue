<template>
  <div
    v-bind="rootAttrs()"
    class="ui-search"
    :class="{
      'ui-search--focused': isFocused,
      'ui-search--empty': !modelValue,
      'ui-search--disabled': disabled,
    }"
  >
    <span class="ui-search__leading">
      <slot name="leading">
        <MIcon
          :name="ICONS.search"
          aria-hidden="true"
        />
      </slot>
    </span>

    <input
      v-bind="controlAttrs()"
      :id="fieldId"
      ref="input"
      v-model="modelValue"
      class="ui-search__input"
      type="search"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown.enter="emit('submit', modelValue)"
    >

    <!-- Rendered while hidden, so its arrival never reflows the query. -->
    <MButtonIcon
      type="button"
      class="ui-search__clear"
      :class="{ 'ui-search__clear--hidden': !canClear }"
      :aria-label="clearLabel"
      :disabled="!canClear"
      @click="onClear"
    >
      <slot name="clear">
        <MIcon :name="ICONS.close" />
      </slot>
    </MButtonIcon>

    <span
      v-if="$slots.trailing"
      class="ui-search__trailing"
    >
      <slot name="trailing" />
    </span>

    <span
      v-if="$slots.avatar"
      class="ui-search__avatar"
    >
      <slot name="avatar" />
    </span>
  </div>
</template>

<script setup lang="ts">
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { mSearchProps } from './props'
import type { MSearchEmits } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mSearchProps)
const emit = defineEmits<MSearchEmits>()

defineSlots<{
  /** Before the query — the search glyph by default, a navigation button in an app bar. */
  leading?: () => unknown
  /** Content of the clear button. */
  clear?: () => unknown
  /** Actions after the query: voice input, filters. Icon buttons, 48 targets. */
  trailing?: () => unknown
  /** The account avatar at the end of the bar — M3 draws it at 30. */
  avatar?: () => unknown
}>()

const modelValue = defineModel<string>({ default: '' })
const isFocused = defineModel<boolean>('focused', { default: false })

const fieldId = useId()
const canClear = computed(() => Boolean(modelValue.value) && !props.disabled)

// The kit ships no default name: it would be English in a kit with no i18n.
// An unnamed field or an unnamed clear button is worse, so say it in dev.
if (import.meta.dev) {
  const attrs = useAttrs()

  watchEffect(() => {
    if (!props.ariaLabel && !attrs['aria-label'] && !attrs['aria-labelledby']) {
      console.warn('[m-search] has no accessible name: pass `aria-label` or `aria-labelledby` — a placeholder is not a name.')
    }

    if (canClear.value && !props.clearLabel) {
      console.warn('[m-search] the clear button has no accessible name: pass `clear-label`.')
    }
  })
}

const input = ref<HTMLInputElement | null>(null)

function onClear() {
  modelValue.value = ''
  emit('clear')
  // The button disappears under the pointer; the query field is where the
  // user goes next.
  input.value?.focus()
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/search' as t;

.ui-search {
  $t: material-map(t.$tokens, 'm-search');

  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: g($t, 'container.gap');
  width: 100%;
  max-width: g($t, 'container.max-width');
  min-height: g($t, 'container.height');
  padding-inline: g($t, 'container.padding.inline');
  border-radius: g($t, 'container.shape');
  background-color: g($t, 'container.color');
  color: g($t, 'input.color');

  // MD3 state layer: the content's ink over the container, under the parts.
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background-color: g($t, 'layer.color');
    opacity: 0;
    pointer-events: none;
    transition: opacity g($t, 'state.duration') g($t, 'state.easing');
  }

  @include can-hover {
    &:not(.ui-search--disabled):hover::before {
      opacity: g($t, 'layer.hover');
    }
  }

  // A control, not a form field: no label and no support line to recolour,
  // so focus is the ring every other control wears.
  &--focused {
    @include focus-ring;
  }

  &__leading,
  &__trailing {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'icon.target');
    min-height: g($t, 'icon.target');
    font-size: g($t, 'icon.size');
  }

  &__leading {
    color: g($t, 'icon.leading.color');
  }

  &__trailing {
    gap: g($t, 'container.gap');
    color: g($t, 'icon.color');
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: none;
    outline: none;
    background: transparent;
    color: g($t, 'input.color');
    caret-color: g($t, 'input.caret.color');

    @include typescale(g($t, 'input.typography'));

    &::placeholder {
      color: g($t, 'input.placeholder.color');
      opacity: 1;
    }

    &::-webkit-search-cancel-button,
    &::-webkit-search-decoration {
      appearance: none;
    }
  }

  // The clear button keeps its place while there is nothing to clear.
  &__clear {
    flex: 0 0 auto;
    color: g($t, 'icon.color');

    &--hidden {
      visibility: hidden;
    }
  }

  // A 48 target around the consumer's avatar; the avatar keeps its own size.
  &__avatar {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: g($t, 'icon.target');
    height: g($t, 'icon.target');
  }

  &--disabled {
    color: g($t, 'disabled.content');
    cursor: default;

    .ui-search__leading,
    .ui-search__trailing,
    .ui-search__input,
    .ui-search__input::placeholder {
      color: g($t, 'disabled.content');
    }
  }

  // The container is drawn by its fill alone, which forced colours drop.
  @include forced-colors {
    outline: 1px solid CanvasText;

    &--focused {
      outline-color: Highlight;
    }

    &--disabled {
      outline-color: GrayText;
    }
  }
}
</style>
