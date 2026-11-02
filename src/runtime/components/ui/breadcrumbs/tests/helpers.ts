import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import MBreadcrumbs from '../index.vue'
import type { MBreadcrumbItem } from '../props'

export const ITEMS: MBreadcrumbItem[] = [
  { title: 'Home', to: '/' },
  { title: 'Catalog', to: '/catalog' },
  { title: 'Laptops' },
]

let current: { unmount: () => void } | null = null

/**
 * The kit ships no pages, so the Nuxt test environment has no router: active
 * crumbs delegate to the NuxtLink-backed MButton, so a memory router is
 * installed to exercise that path for real.
 */
export async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  await router.push('/')
  await router.isReady()

  current = await mountSuspended(MBreadcrumbs, { props: { items: ITEMS, ...props }, slots, global: { plugins: [router] } })

  return current as VueWrapper
}

export function unmount() {
  current?.unmount()
  current = null
}
