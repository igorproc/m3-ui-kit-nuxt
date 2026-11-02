import { useId, useSlots } from 'vue'
import type { Ref } from 'vue'

export interface UseProgressbarProps {
  max: number
  indeterminate: boolean
  valueText?: string
  ariaLabel?: string
}

export interface UseProgressbarReturn {
  labelId: string
  progressbarAttrs: () => Record<string, string | number | undefined>
}

export function useProgressbar(props: UseProgressbarProps, valueNow: Readonly<Ref<number>>): UseProgressbarReturn {
  const slots = useSlots()
  const labelId = useId()

  const progressbarAttrs = () => ({
    'role': 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': props.max,
    'aria-valuenow': props.indeterminate ? undefined : valueNow.value,
    'aria-valuetext': props.indeterminate ? undefined : props.valueText,
    'aria-label': props.ariaLabel,
    'aria-labelledby': slots.default ? labelId : undefined,
  })

  return { labelId, progressbarAttrs }
}
