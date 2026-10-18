import { onScopeDispose } from 'vue'

/**
 * Fake latency for saves and uploads. Every pending timer is cleared when the
 * owning component goes away, and an aborted signal rejects at once.
 */
export function useCrmDelay() {
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function wait(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason)
        return
      }

      const timer = setTimeout(() => {
        timers.delete(timer)
        resolve()
      }, ms)
      timers.add(timer)

      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        timers.delete(timer)
        reject(signal.reason)
      }, { once: true })
    })
  }

  onScopeDispose(() => {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  })

  return { wait }
}
