import { computed } from 'vue'
import { CRM_TODAY, daysBetween, formatCompactMoney, formatPercent } from '../data/crmFormat'
import { CRM_FORECAST } from '../data/crmSeed'
import { CRM_PERIODS, CRM_STAGES } from '../data/crmTypes'
import type { CrmDeal, CrmStage } from '../data/crmTypes'
import type { CrmStore } from './useCrmStore'

export interface CrmBoardColumn extends CrmStage {
  deals: CrmDeal[]
  total: number
}

export interface CrmFunnelStep {
  id: string
  label: string
  count: number
  /** Share of the previous step that reached this one, %; `null` for the first. */
  conversion: number | null
}

export interface CrmDonutSegment {
  id: string
  label: string
  value: number
  role: 'primary' | 'error'
}

/** Everything the «Воронка» tab draws, derived from the filtered deals. */
export function useCrmPipeline(store: CrmStore) {
  const periodDays = computed(() => CRM_PERIODS.find(period => period.value === store.filters.period)?.days ?? 30)

  const columns = computed<CrmBoardColumn[]>(() => CRM_STAGES.map((stage) => {
    const deals = store.visibleDeals.value
      .filter(deal => deal.status === stage.id)
      .sort((left, right) => right.amount - left.amount)

    return { ...stage, deals, total: deals.reduce((sum, deal) => sum + deal.amount, 0) }
  }))

  // A deal at stage N has passed every stage before it; lost deals carry no
  // record of how far they got, so the funnel leaves them out.
  const funnel = computed<CrmFunnelStep[]>(() => {
    const reached = CRM_STAGES.map((_, index) => store.visibleDeals.value.filter((deal) => {
      const at = CRM_STAGES.findIndex(stage => stage.id === deal.status)
      return at >= index
    }).length)

    return CRM_STAGES.map((stage, index) => {
      const previous = index > 0 ? reached[index - 1] ?? 0 : 0
      const count = reached[index] ?? 0
      return {
        id: stage.id,
        label: stage.label,
        count,
        conversion: index === 0 ? null : previous ? Math.round((count / previous) * 100) : 0,
      }
    })
  })

  const closedInPeriod = computed(() => store.visibleDeals.value.filter((deal) => {
    if (deal.status !== 'won' && deal.status !== 'lost') return false
    const age = daysBetween(deal.closeDate, CRM_TODAY)
    return age >= 0 && age <= periodDays.value
  }))

  const donut = computed<CrmDonutSegment[]>(() => [
    { id: 'won', label: 'Выиграно', value: closedInPeriod.value.filter(deal => deal.status === 'won').length, role: 'primary' },
    { id: 'lost', label: 'Проиграно', value: closedInPeriod.value.filter(deal => deal.status === 'lost').length, role: 'error' },
  ])

  const winRate = computed(() => {
    const total = closedInPeriod.value.length
    return total ? Math.round((donut.value[0]!.value / total) * 100) : 0
  })

  const forecast = computed(() => CRM_FORECAST[store.filters.period])

  const weightedPipeline = computed(() => store.visibleDeals.value
    .filter(deal => deal.status !== 'won' && deal.status !== 'lost')
    .reduce((sum, deal) => sum + (deal.amount * deal.probability) / 100, 0))

  const funnelSummary = computed(() => funnel.value
    .map(step => `${step.label}: ${step.count}${step.conversion === null ? '' : ` (${formatPercent(step.conversion)})`}`)
    .join(', '))

  const forecastSummary = computed(() => {
    const points = forecast.value
    const lastActual = [...points].reverse().find(point => point.actual !== null)?.actual ?? 0
    const lastForecast = points.at(-1)?.forecast ?? 0
    return `Выиграно на сегодня ${formatCompactMoney(lastActual)}, прогноз к концу периода ${formatCompactMoney(lastForecast)}`
  })

  return { columns, funnel, donut, winRate, forecast, weightedPipeline, funnelSummary, forecastSummary }
}
