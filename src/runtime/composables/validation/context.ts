/**
 * @module validation/context
 *
 * @remarks
 * The provide/inject seam that makes validation swappable at the composable
 * level — no module flag, no mandatory plugin. A consumer installs an engine by
 * calling {@link provideValidationAdapter} once, high in the component tree
 * (`app.vue`, a layout, or any ancestor of the forms):
 *
 * ```ts
 * import { veeValidateAdapter } from '@pr0s1k/primetime-kit/validation'
 * provideValidationAdapter(veeValidateAdapter())
 * ```
 *
 * When no adapter is provided the `path` autopilot stays inert and inputs behave
 * as plain controlled components — the kit ships zero validation dependencies of
 * its own.
 */
import { inject, provide, type InjectionKey } from 'vue'
import type { ValidationAdapter } from './types'

/** Injection key for the active {@link ValidationAdapter}. */
export const VALIDATION_ADAPTER_KEY: InjectionKey<ValidationAdapter> = Symbol('m-validation-adapter')

/** Provide a validation adapter to this component subtree. */
export function provideValidationAdapter(adapter: ValidationAdapter): void {
  provide(VALIDATION_ADAPTER_KEY, adapter)
}

/** Inject the active validation adapter, or `null` when none was provided. */
export function injectValidationAdapter(): ValidationAdapter | null {
  return inject(VALIDATION_ADAPTER_KEY, null)
}
