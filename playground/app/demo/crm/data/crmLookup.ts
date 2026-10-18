import { CRM_COMPANIES, CRM_ME, CRM_OWNERS } from './crmSeed'
import type { CrmCompany, CrmDeal, CrmOwner, CrmTagId } from './crmTypes'

export function findOwner(id: string): CrmOwner {
  return CRM_OWNERS.find(owner => owner.id === id) ?? CRM_ME
}

export function findCompany(id: string): CrmCompany | undefined {
  return CRM_COMPANIES.find(company => company.id === id)
}

export function companyName(id: string): string {
  return findCompany(id)?.label ?? '—'
}

export function isOpenDeal(deal: CrmDeal): boolean {
  return deal.status !== 'won' && deal.status !== 'lost'
}

export interface CrmDealFilter {
  query: string
  owners: readonly string[]
  tags: readonly CrmTagId[]
}

/** Text query over title and company, owners and tags as "any of". */
export function matchesDeal(deal: CrmDeal, filter: CrmDealFilter): boolean {
  const query = filter.query.trim().toLocaleLowerCase('ru-RU')
  const text = `${deal.title} ${companyName(deal.companyId)} ${deal.id}`.toLocaleLowerCase('ru-RU')

  if (query && !text.includes(query)) return false
  if (filter.owners.length && !filter.owners.includes(deal.ownerId)) return false
  if (filter.tags.length && !deal.tags.some(tag => filter.tags.includes(tag))) return false

  return true
}
