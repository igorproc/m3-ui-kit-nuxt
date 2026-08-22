/**
 * @module color-picker/context
 *
 * @remarks
 * The single reactive HSVA source of truth for `MColorPicker`. The parent
 * creates this state and provides it; the private Canvas/Edit/Preview/Swatches
 * leaves only read/mutate through it, so pointer and keyboard paths can never
 * diverge. The external model stays a CSS-ready string in the chosen format.
 */
import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import {
  formatColor,
  formatSupportsAlpha,
  hsvaToRgba,
  parseColor,
  rgbaToHsva,
  toCssColor,
} from '#kit/shared/utils/color'
import type { ColorFormat, ColorParseError, HSVA, RGBA } from '#kit/shared/utils/color'

export type ColorCommitReason = 'pointer' | 'keyboard' | 'edit' | 'swatch'

export interface MColorPickerContext {
  hsva: Readonly<Ref<HSVA>>
  rgba: Readonly<ComputedRef<RGBA>>
  value: Readonly<ComputedRef<string | null>>
  cssColor: Readonly<ComputedRef<string>>
  format: WritableComputedRef<ColorFormat>
  formats: Readonly<ComputedRef<readonly ColorFormat[]>>
  supportsAlpha: Readonly<ComputedRef<boolean>>
  disabled: Readonly<ComputedRef<boolean>>
  valid: Readonly<ComputedRef<boolean>>
  parseError: Readonly<Ref<ColorParseError | null>>
  setHue: (value: number) => void
  setSaturation: (value: number) => void
  setValue: (value: number) => void
  setAlpha: (value: number) => void
  setHSVA: (value: HSVA) => void
  setRGBA: (value: RGBA) => void
  setFormat: (value: ColorFormat) => void
  selectColor: (value: string) => boolean
  commit: (reason: ColorCommitReason) => void
  reportInvalid: (draft: string, reason: ColorParseError) => void
}

export const [useColorPickerContext, provideColorPickerContext]
  = createContext<MColorPickerContext>('m3:color-picker')

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export interface ColorPickerStateOptions {
  model: Ref<string | null>
  format: Ref<ColorFormat>
  formats: () => readonly ColorFormat[]
  disabled: () => boolean
  onChange: (value: string | null) => void
  onInvalid: (draft: string, reason: ColorParseError) => void
}

/**
 * Builds the reactive HSVA context. `model` and `format` are the component's
 * `defineModel` refs; the state keeps them in sync with the internal HSVA.
 */
export function createColorPickerState(options: ColorPickerStateOptions): MColorPickerContext {
  const { model, format, formats, disabled, onChange, onInvalid } = options

  const hsva = ref<HSVA>({ h: 0, s: 0, v: 0, a: 1 })
  const parseError = ref<ColorParseError | null>(null)
  // Guards the external→internal sync from re-triggering on our own writes.
  let writingModel = false

  function applyModel() {
    if (writingModel) return
    const parsed = parseColor(model.value)
    if (parsed.ok) {
      hsva.value = rgbaToHsva(parsed.rgba)
      parseError.value = null
    } else if (parsed.error === 'empty') {
      parseError.value = null
    } else {
      parseError.value = parsed.error
    }
  }

  watch(() => model.value, applyModel, { immediate: true })
  // Re-project the model when the format changes (selector or external v-model).
  watch(() => format.value, () => syncModel())

  const rgba = computed(() => hsvaToRgba(hsva.value))
  const cssColor = computed(() => toCssColor(rgba.value))
  const value = computed(() => model.value)
  const valid = computed(() => parseError.value === null)
  const supportsAlpha = computed(() => formatSupportsAlpha(format.value))
  const formatsRef = computed(() => formats())
  const disabledRef = computed(() => disabled())

  function syncModel() {
    const formatted = formatColor(rgba.value, format.value)
    if (model.value === formatted) return
    writingModel = true
    model.value = formatted
    parseError.value = null
    // Release the guard after the watcher has observed the write.
    queueMicrotask(() => {
      writingModel = false
    })
  }

  function setHSVA(next: HSVA) {
    if (disabledRef.value) return
    hsva.value = {
      h: ((next.h % 360) + 360) % 360,
      s: clamp(next.s, 0, 1),
      v: clamp(next.v, 0, 1),
      a: clamp(next.a, 0, 1),
    }
    syncModel()
  }

  const setHue = (h: number) => setHSVA({ ...hsva.value, h })
  const setSaturation = (s: number) => setHSVA({ ...hsva.value, s })
  const setValue = (v: number) => setHSVA({ ...hsva.value, v })
  const setAlpha = (a: number) => setHSVA({ ...hsva.value, a })
  const setRGBA = (next: RGBA) => setHSVA(rgbaToHsva(next))

  const format$ = computed<ColorFormat>({
    get: () => format.value,
    set: value => setFormat(value),
  })

  function setFormat(next: ColorFormat) {
    if (disabledRef.value || next === format.value) return
    const losingAlpha = formatSupportsAlpha(format.value) && !formatSupportsAlpha(next) && hsva.value.a < 1
    format.value = next
    if (losingAlpha) {
      if (import.meta.dev) {
        console.warn(`[m3:color-picker] switching ${format.value} → ${next} drops alpha; reset to 1.`)
      }
      hsva.value = { ...hsva.value, a: 1 }
    }
    syncModel()
  }

  function selectColor(input: string): boolean {
    if (disabledRef.value) return false
    const parsed = parseColor(input)
    if (!parsed.ok) {
      reportInvalid(input, parsed.error)
      return false
    }
    setHSVA(rgbaToHsva(parsed.rgba))
    return true
  }

  function commit(_reason: ColorCommitReason) {
    onChange(formatColor(rgba.value, format.value))
  }

  function reportInvalid(draft: string, reason: ColorParseError) {
    parseError.value = reason
    onInvalid(draft, reason)
  }

  return {
    hsva,
    rgba,
    cssColor,
    value,
    format: format$,
    formats: formatsRef,
    supportsAlpha,
    disabled: disabledRef,
    valid,
    parseError,
    setHue,
    setSaturation,
    setValue,
    setAlpha,
    setHSVA,
    setRGBA,
    setFormat,
    selectColor,
    commit,
    reportInvalid,
  }
}
