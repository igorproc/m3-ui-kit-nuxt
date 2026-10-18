import { ref } from 'vue'
import { useTimer } from '#kit/composables/useTimer'

const REFRESH_ERROR = 'Не удалось обновить сделки: сервер не ответил вовремя.'

/**
 * A stand-in for a server round trip, so the table shows its loading and error
 * states. Every other refresh fails — deterministically, so the demo always
 * reaches the error state and its retry.
 */
export function useCrmFakeRequest(latency = 600) {
  const loading = ref(false)
  const error = ref<string | false>(false)
  let refreshes = 0
  let failing = false

  const timer = useTimer(() => {
    loading.value = false
    error.value = failing ? REFRESH_ERROR : false
  }, { duration: latency })

  function start(fail: boolean) {
    failing = fail
    loading.value = true
    error.value = false
    timer.start()
  }

  /** A page or a sort that the "server" answers. */
  const load = () => start(false)

  const refresh = () => {
    refreshes += 1
    start(refreshes % 2 === 1)
  }

  const retry = () => start(false)

  return { loading, error, load, refresh, retry }
}
