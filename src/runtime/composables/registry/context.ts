/**
 * @module registry/context
 *
 * Provide/inject helpers for sharing one `createRegistry` instance down a tree.
 */
import { useContext } from '#kit/shared/utils/context/createContext'
import { createTrinity } from '#kit/shared/utils/context/createTrinity'
import type { ContextTrinity } from '#kit/shared/utils/context/createTrinity'
import { createRegistry } from './createRegistry'
import type { RegistryContext, RegistryContextOptions, RegistryTicket, RegistryTicketInput } from './types'

/**
 * Creates a registry context trinity for provide/inject usage.
 */
export function createRegistryContext<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
>(_options: RegistryContextOptions = {}): ContextTrinity<RegistryContext<Z, E>> {
  const { namespace = 'm3:registry', ...options } = _options

  const context = createRegistry<Z, E>(options)

  return createTrinity<RegistryContext<Z, E>>(namespace, context)
}

/**
 * Injects an existing registry from context.
 */
export function useRegistry<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
>(namespace = 'm3:registry'): RegistryContext<Z, E> {
  return useContext<RegistryContext<Z, E>>(namespace)
}
