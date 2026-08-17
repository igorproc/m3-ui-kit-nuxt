/**
 * @module useProxyRegistry
 *
 * @remarks
 * Reactive snapshot of a registry's `{ keys, values, entries, size }`, ported
 * 1:1 from `@vuetify/v0`. Subscribes to the registry's event bus (so the source
 * registry must be created with `events: true`) and refreshes the snapshot on
 * any mutation. Used by `createGroup` for derived reactive selection state.
 *
 * @example
 * ```ts
 * const registry = createRegistry({ events: true })
 * const proxy = useProxyRegistry(registry)
 * registry.register({ value: 'Item 1' })
 * proxy.size // 1
 * ```
 */
import { onScopeDispose, reactive, shallowReactive } from 'vue'
import type { RegistryContext, RegistryTicket, RegistryTicketInput } from './createRegistry'
import type { ID } from '#kit/shared/types/registry'

export interface ProxyRegistryOptions {
  deep?: boolean
}

export interface ProxyRegistryContext<Z extends RegistryTicket = RegistryTicket> {
  keys: readonly ID[]
  values: readonly Z[]
  entries: readonly [ID, Z][]
  size: number
}

/**
 * Creates a reactive proxy snapshot of a registry.
 */
export function useProxyRegistry<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
>(
  registry: RegistryContext<Z, E>,
  options?: ProxyRegistryOptions,
): ProxyRegistryContext<E> {
  const reactivity = options?.deep ? reactive : shallowReactive

  const state = reactivity({
    keys: registry.keys(),
    values: registry.values(),
    entries: registry.entries(),
    size: registry.size,
  })

  function update() {
    state.keys = registry.keys()
    state.values = registry.values()
    state.entries = registry.entries()
    state.size = registry.size
  }

  registry.on('register:ticket', update)
  registry.on('unregister:ticket', update)
  registry.on('update:ticket', update)
  registry.on('clear:registry', update)
  registry.on('reindex:registry', update)

  onScopeDispose(() => {
    registry.off('register:ticket', update)
    registry.off('unregister:ticket', update)
    registry.off('update:ticket', update)
    registry.off('clear:registry', update)
    registry.off('reindex:registry', update)
  }, true)

  return state as ProxyRegistryContext<E>
}
