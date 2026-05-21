import { ref, watch, type Ref } from 'vue'

export function useTimePicker(modelValue: Ref<string>, is24h: Ref<boolean> = ref(true)) {
  const hours = ref('')
  const minutes = ref('')
  const activeField = ref<'hours' | 'minutes'>('hours')
  const period = ref<'AM' | 'PM'>('AM')

  watch(
    modelValue,
    (next) => {
      if (!next) {
        hours.value = ''
        minutes.value = ''
        return
      }

      const [hStr, mStr] = next.split(':')
      let h = Number.parseInt(hStr ?? '0', 10)
      const m = mStr ?? '00'

      if (!is24h.value) {
        if (h >= 12) {
          period.value = 'PM'
          if (h > 12) h -= 12
        } else {
          period.value = 'AM'
          if (h === 0) h = 12
        }
      }

      hours.value = h.toString()
      minutes.value = m
    },
    { immediate: true }
  )

  watch(
    [hours, minutes, period, is24h],
    () => {
      let h = clampPart(hours.value, 0, is24h.value ? 23 : 12)
      const m = clampPart(minutes.value, 0, 59)

      if (h === null || m === null) {
        modelValue.value = ''
        return
      }

      if (!is24h.value) {
        if (period.value === 'PM' && h < 12) h += 12
        if (period.value === 'AM' && h === 12) h = 0
      }

      modelValue.value = `${pad2(h)}:${pad2(m)}`
    }
  )

  function clampPart(value: string, min: number, max: number): number | null {
    if (!value && value !== '0') {
      return null
    }
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      return null
    }
    return Math.min(max, Math.max(min, parsed))
  }

  function pad2(value: number): string {
    return value.toString().padStart(2, '0')
  }

  function onBlur() {
    const h = clampPart(hours.value, 0, is24h.value ? 23 : 12)
    const m = clampPart(minutes.value, 0, 59)

    hours.value = h === null ? '' : pad2(h)
    minutes.value = m === null ? '' : pad2(m)
  }

  return {
    hours,
    minutes,
    activeField,
    period,
    onBlur,
    clampPart,
    pad2
  }
}
