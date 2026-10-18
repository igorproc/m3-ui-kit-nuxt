import { reactive, ref, watch } from 'vue'
import type { PaymentMethod } from './data/model'

export interface NewOrderDraft {
  customerId: string | undefined
  address: string
  productId: string | undefined
  quantity: number | null
  date: Date | null
  time: string
  payment: PaymentMethod
  notify: boolean
  comment: string
  files: File[]
}

export type NewOrderField = 'customerId' | 'address' | 'productId' | 'quantity' | 'date' | 'time'
export type NewOrderErrors = Partial<Record<NewOrderField, string>>

const MIN_ADDRESS_LENGTH = 8

function emptyDraft(): NewOrderDraft {
  return {
    customerId: undefined,
    address: '',
    productId: undefined,
    quantity: 1,
    date: null,
    time: '',
    payment: 'card',
    notify: true,
    comment: '',
    files: [],
  }
}

function check(draft: NewOrderDraft): NewOrderErrors {
  const errors: NewOrderErrors = {}

  if (!draft.customerId) errors.customerId = 'Выберите покупателя из списка'
  if (draft.address.trim().length < MIN_ADDRESS_LENGTH) errors.address = 'Укажите адрес: город, улицу и дом'
  if (!draft.productId) errors.productId = 'Выберите товар'
  if (!draft.quantity || draft.quantity < 1) errors.quantity = 'Не меньше одной штуки'
  if (!draft.date) errors.date = 'Выберите день доставки'
  if (!/^\d{2}:\d{2}$/.test(draft.time)) errors.time = 'Укажите время доставки'

  return errors
}

/**
 * State of the "new order" form. Errors appear after the first submit and then
 * follow every edit, so a fixed field stops being red as soon as it is fixed.
 */
export function useNewOrderDraft() {
  const draft = reactive<NewOrderDraft>(emptyDraft())
  const errors = ref<NewOrderErrors>({})
  const attempted = ref(false)

  watch(draft, () => {
    if (attempted.value) errors.value = check(draft)
  }, { deep: true })

  function validate(): boolean {
    attempted.value = true
    errors.value = check(draft)
    return Object.keys(errors.value).length === 0
  }

  function reset() {
    Object.assign(draft, emptyDraft())
    errors.value = {}
    attempted.value = false
  }

  return { draft, errors, validate, reset }
}
