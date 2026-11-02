import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import { veeValidateAdapter } from '#kit/adapters/vee-validate'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'
import MFormRenderer from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

export function unmountCurrent() {
  current?.unmount()
  current = null
}

/** Mounts a renderer under the real vee-validate adapter, as an app installs it. */
export async function mountForm(config: FormFieldConfig[], props: Record<string, unknown> = {}, slots?: Slots, attach = false) {
  unmountCurrent()
  current = await mountSuspended(defineComponent({
    setup() {
      provideValidationAdapter(veeValidateAdapter())
      return () => h(MFormRenderer, { config, ...props }, slots)
    },
  }), attach ? { attachTo: document.body } : {})

  return current as VueWrapper
}

/** vee-validate validates and submits on microtasks and timers of its own. */
export async function settle() {
  for (let index = 0; index < 5; index++) await new Promise(resolve => setTimeout(resolve, 0))
}

export const ALL_FIELDS: FormFieldConfig[] = [
  { type: 'text', name: 'name', label: 'Name' },
  { type: 'search', name: 'query', label: 'Query' },
  { type: 'textarea', name: 'bio', label: 'Bio' },
  { type: 'number', name: 'age', label: 'Age' },
  { type: 'checkbox', name: 'terms', label: 'Terms' },
  { type: 'switch', name: 'news', label: 'News' },
  { type: 'radio', name: 'plan', label: 'Plan', options: [{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }] },
]
