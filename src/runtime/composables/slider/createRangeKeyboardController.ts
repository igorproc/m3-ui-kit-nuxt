export interface RangeKeyboardControllerOptions {
  min: () => number
  max: () => number
  step: () => number
  getValue: () => number
  setValue: (value: number) => void
  rtl?: () => boolean
}

export function createRangeKeyboardController(options: RangeKeyboardControllerOptions) {
  const clamp = (value: number) => Math.min(options.max(), Math.max(options.min(), value))
  const snap = (value: number) => {
    const step = Math.max(Number.EPSILON, options.step())
    const precision = (String(step).split('.')[1] ?? '').length
    return Number(clamp(Math.round((value - options.min()) / step) * step + options.min()).toFixed(precision))
  }

  function onKeydown(event: KeyboardEvent) {
    const step = Math.max(Number.EPSILON, options.step())
    const horizontal = options.rtl?.() ? -1 : 1
    const actions: Partial<Record<string, () => number>> = {
      ArrowRight: () => options.getValue() + step * horizontal,
      ArrowLeft: () => options.getValue() - step * horizontal,
      ArrowUp: () => options.getValue() + step,
      ArrowDown: () => options.getValue() - step,
      PageUp: () => options.getValue() + step * 10,
      PageDown: () => options.getValue() - step * 10,
      Home: options.min,
      End: options.max,
    }
    const action = actions[event.key]
    if (!action) return false
    event.preventDefault()
    options.setValue(snap(action()))
    return true
  }

  return { onKeydown, snap }
}
