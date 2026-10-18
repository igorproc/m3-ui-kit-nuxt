import { computed, inject, provide, reactive, ref } from 'vue'
import type { InjectionKey } from 'vue'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'
import { CRM_TODAY, addDays } from '../data/crmFormat'
import { CRM_ME } from '../data/crmSeed'
import { CRM_PRIORITIES, CRM_STAGES } from '../data/crmTypes'
import type { CrmDeal, CrmPriority, CrmStageId, CrmTagId } from '../data/crmTypes'
import { useCrmDelay } from './useCrmDelay'
import type { CrmStore } from './useCrmStore'

/**
 * The part of the form `MFormRenderer` can describe: its schema knows text,
 * textarea, number, checkbox, switch, radio and search — nothing else.
 */
export const CRM_NEW_DEAL_SCHEMA: FormFieldConfig[] = [
  {
    type: 'text',
    name: 'title',
    label: 'Название сделки',
    placeholder: 'Например, годовая лицензия',
    rules: { required: 'Укажите название сделки' },
    props: { required: true, labelPlacement: 'top' },
  },
  {
    type: 'text',
    name: 'contact',
    label: 'Контактное лицо',
    placeholder: 'Имя и фамилия',
    props: { autocomplete: 'name', labelPlacement: 'top' },
  },
  {
    type: 'radio',
    name: 'priority',
    label: 'Приоритет',
    options: [...CRM_PRIORITIES],
    default: 'medium',
    rules: { required: 'Выберите приоритет' },
    // The renderer names the radios by nothing, so each would be a group of
    // one (no arrow keys, a Tab stop per option); the shared name restores it.
    props: { name: 'priority' },
  },
  { type: 'switch', name: 'notifyOwner', label: 'Уведомить ответственного', default: true },
  { type: 'checkbox', name: 'forecast', label: 'Учитывать в прогнозе квартала', default: true },
]

/** Fields the schema cannot express, composed by hand next to the rendered ones. */
export interface CrmNewDealExtras {
  companyId: string | null
  stage: CrmStageId
  amount: number | null
  closeDate: string | null
  meetingTime: string
  tags: CrmTagId[]
  color: string | null
  notes: string
}

const PRIORITY_VALUES = new Set<unknown>(CRM_PRIORITIES.map(priority => priority.value))
const isPriority = (value: unknown): value is CrmPriority => PRIORITY_VALUES.has(value)

export function useCrmNewDeal(store: CrmStore) {
  const { wait } = useCrmDelay()

  const blank = (): CrmNewDealExtras => ({
    companyId: null,
    stage: 'lead',
    amount: null,
    closeDate: addDays(CRM_TODAY, 30),
    meetingTime: '11:00',
    tags: [],
    color: null,
    notes: '',
  })

  const extras = reactive<CrmNewDealExtras>(blank())

  // Errors of the hand-made fields show once a submit was tried, like the
  // renderer's own fields.
  const attempted = ref(false)

  const errors = computed(() => ({
    company: attempted.value && !extras.companyId ? 'Выберите компанию' : undefined,
    amount: attempted.value && !(extras.amount && extras.amount > 0) ? 'Укажите сумму больше нуля' : undefined,
  }))

  const extrasValid = computed(() => Boolean(extras.companyId) && Boolean(extras.amount && extras.amount > 0))

  /** `MFormRenderer` calls this only after its own schema passed. */
  async function submit(values: Record<string, unknown>) {
    attempted.value = true
    if (!extrasValid.value) return

    await wait(500)

    const stage = CRM_STAGES.find(item => item.id === extras.stage)
    const deal: CrmDeal = {
      id: store.nextDealId(),
      title: String(values.title ?? '').trim(),
      companyId: extras.companyId ?? '',
      ownerId: CRM_ME.id,
      status: extras.stage,
      amount: extras.amount ?? 0,
      probability: stage?.probability ?? 10,
      closeDate: extras.closeDate ?? addDays(CRM_TODAY, 30),
      stageSince: CRM_TODAY,
      createdAt: CRM_TODAY,
      tags: [...extras.tags],
      reminders: values.notifyOwner === true,
      priority: isPriority(values.priority) ? values.priority : 'medium',
      contact: String(values.contact ?? ''),
      color: extras.color,
      notes: extras.notes,
      meetingTime: extras.meetingTime,
    }

    store.addDeal(deal)
    store.newDealOpen.value = false
  }

  /** The rendered fields reset by remounting with the dialog; these do not. */
  function reset() {
    Object.assign(extras, blank())
    attempted.value = false
  }

  return { extras, errors, attempted, submit, reset }
}

export type CrmNewDealForm = ReturnType<typeof useCrmNewDeal>

const CRM_NEW_DEAL_KEY: InjectionKey<CrmNewDealForm> = Symbol('crm-new-deal')

/** The dialog owns the form; the hand-composed fields read it from here. */
export function provideCrmNewDeal(form: CrmNewDealForm) {
  provide(CRM_NEW_DEAL_KEY, form)
}

export function useCrmNewDealForm(): CrmNewDealForm {
  const form = inject(CRM_NEW_DEAL_KEY, null)
  if (!form) throw new Error('[crm demo] the new deal fields need the dialog above them.')
  return form
}
