<template>
  <div
    :id="listId"
    class="ui-color-swatches"
    :class="{ 'ui-color-swatches--locked': ctx.locked.value }"
    role="listbox"
    :aria-label="ctx.messages.value.swatches"
    :aria-activedescendant="activeDescendant"
    :aria-disabled="ctx.disabled.value || undefined"
    :aria-readonly="ctx.readonly.value || undefined"
    :tabindex="ctx.disabled.value ? -1 : 0"
    @focus="onFocus"
    @blur="focused = false"
    @keydown="onKeydown"
  >
    <div
      v-for="(swatch, index) in entries"
      :id="swatch.id"
      :key="`${index}-${swatch.value}`"
      class="ui-color-swatches__item"
      :class="{
        'ui-color-swatches__item--selected': swatch.selected,
        'ui-color-swatches__item--active': focused && activeIndex === index,
        'ui-color-swatches__item--light': swatch.light,
      }"
      role="option"
      :aria-selected="swatch.selected"
      :aria-label="swatch.label"
      :style="{ '--m-color-picker-swatch': swatch.value }"
      @pointerdown.prevent
      @click="choose(index)"
    >
      <slot
        :swatch="{ value: swatch.value, label: swatch.label }"
        :selected="swatch.selected"
        name="swatch"
      >
        <MIcon
          v-if="swatch.selected"
          :name="ICONS.check"
          class="ui-color-swatches__check"
          aria-hidden="true"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Private palette of `MColorPicker`: a listbox with one tab stop, walked with
 * the arrows (the kit's listbox engine — no third keyboard controller), chosen
 * with Enter or Space. A swatch is the chosen one when it is the same colour
 * as the model, however either is spelled.
 */
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useColorPickerContext } from '#kit/utils/color-picker/context'
import { useListbox } from '#kit/composables/listbox/useListbox'
import { isLightColor, normalizeSwatch, parseColor } from '#kit/shared/utils/color'
import type { ColorSwatch, RGBA } from '#kit/shared/utils/color'

interface Props {
  swatches: readonly ColorSwatch[]
}

const props = defineProps<Props>()

defineSlots<{ swatch?: (props: { swatch: { value: string, label: string }, selected: boolean }) => unknown }>()

const ctx = useColorPickerContext()
const listId = useId()
const focused = ref(false)

/** Two spellings of one colour (`#6750a4`, `#6750A4`, `rgb(103 80 164)`) are one colour. */
function sameColor(left: RGBA, right: RGBA) {
  return Math.round(left.r) === Math.round(right.r)
    && Math.round(left.g) === Math.round(right.g)
    && Math.round(left.b) === Math.round(right.b)
    && Math.round(left.a * 100) === Math.round(right.a * 100)
}

const entries = computed(() => {
  const current = parseColor(ctx.value.value)
  return props.swatches.map(normalizeSwatch).map((swatch, index) => {
    const parsed = parseColor(swatch.value)
    return {
      ...swatch,
      // Index + value: two equal swatches in one palette stay two options.
      id: `${listId}-${index}`,
      disabled: ctx.locked.value,
      selected: current.ok && parsed.ok && sameColor(current.rgba, parsed.rgba),
      light: parsed.ok && isLightColor(parsed.rgba),
    }
  })
})

const { activeIndex, activeDescendant, setActive, move } = useListbox(entries, focused, () => false)

function onFocus() {
  focused.value = true
  const selected = entries.value.findIndex(entry => entry.selected)
  setActive(selected >= 0 ? selected : 0)
}

function choose(index: number) {
  const swatch = entries.value[index]
  if (!swatch || ctx.locked.value) return
  setActive(index)
  if (ctx.selectColor(swatch.value)) ctx.commit('swatch')
}

const isRtl = (event: KeyboardEvent) => getComputedStyle(event.currentTarget as Element).direction === 'rtl'

function onKeydown(event: KeyboardEvent) {
  const forward = isRtl(event) ? 'ArrowLeft' : 'ArrowRight'
  const backward = isRtl(event) ? 'ArrowRight' : 'ArrowLeft'
  const actions: Partial<Record<string, () => void>> = {
    [forward]: () => move('next'),
    [backward]: () => move('previous'),
    ArrowDown: () => move('next'),
    ArrowUp: () => move('previous'),
    Home: () => move('first'),
    End: () => move('last'),
    Enter: () => choose(activeIndex.value),
    [' ']: () => choose(activeIndex.value),
  }
  const action = actions[event.key]
  if (!action) return

  event.preventDefault()
  action()
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-picker/index' as t;

.ui-color-swatches {
  $t: material-map(t.$tokens, 'm-color-picker');

  display: flex;
  flex-wrap: wrap;
  gap: g($t, 'swatches.gap');
  border-radius: g($t, 'swatches.radius');
  outline: none;

  &__item {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'swatches.size');
    height: g($t, 'swatches.size');
    border: g($t, 'swatches.outline-width') solid g($t, 'swatches.outline');
    border-radius: g($t, 'swatches.radius');
    background-color: var(--m-color-picker-swatch);

    // The ink that stands out from the colour: light on a dark swatch, dark
    // on a light one. The check and the press layer take it.
    color: g($t, 'swatches.selected.check.on-dark');
    cursor: pointer;

    &--light {
      color: g($t, 'swatches.selected.check.on-light');
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background-color: currentcolor;
      opacity: 0;
      pointer-events: none;
    }

    // The colour is the option itself: forcing would flatten every swatch.
    @include forced-colors {
      forced-color-adjust: none;
      border-color: CanvasText;
    }

    // The chosen swatch: a ring in the content ink and a check, never colour
    // alone. A shadow, not the outline, so the focus ring can stand around it.
    &--selected {
      box-shadow: 0 0 0 g($t, 'swatches.selected.width') g($t, 'swatches.selected.ring');

      @include forced-colors {
        outline: g($t, 'swatches.selected.width') solid Highlight;
      }
    }

    // The keyboard's position in the list: the kit's focus ring, outside the
    // selection ring.
    &--active {
      @include focus-ring(g($t, 'swatches.selected.focus-offset'));
    }
  }

  // A small lift under the pointer and a layer under the press — only while
  // the palette can be chosen from.
  &:not(&--locked) &__item {
    &:active::before {
      opacity: g($t, 'swatches.layer.pressed');
    }

    @media (prefers-reduced-motion: no-preference) {
      transition: transform g($t, 'swatches.motion.duration') g($t, 'swatches.motion.easing');

      @include can-hover {
        &:hover {
          transform: scale(g($t, 'swatches.hover-scale'));
        }
      }
    }
  }

  &__check {
    font-size: g($t, 'swatches.selected.check.size');
  }

  &--locked &__item {
    cursor: default;
  }
}
</style>
