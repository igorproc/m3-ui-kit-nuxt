import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { navigateTo, useRoute } from '#imports'
import { CRM_SECTIONS, isCrmSection } from '../data/crmTypes'
import type { CrmSection } from '../data/crmTypes'

/**
 * The CRM section lives in the URL (`?section=contacts`): the drawer renders
 * real links, the rail switches through the same query, and a section can be
 * linked to. The other query keys (`theme`, `dir`) are kept.
 */
export function useCrmSection() {
  const route = useRoute()

  const section = computed<CrmSection>(() => {
    const value = route.query.section
    return isCrmSection(value) ? value : 'deals'
  })

  const sectionLabel = computed(() => CRM_SECTIONS.find(item => item.id === section.value)?.label ?? '')

  function linkTo(next: CrmSection): RouteLocationRaw {
    return { query: { ...route.query, section: next === 'deals' ? undefined : next } }
  }

  function select(next: CrmSection) {
    return navigateTo(linkTo(next), { replace: true })
  }

  return { section, sectionLabel, linkTo, select }
}
