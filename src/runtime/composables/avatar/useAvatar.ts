/**
 * @module useAvatar
 *
 * @remarks
 * Headless core of `<MAvatar>`: the fallback pipeline (image → initials →
 * icon), the failure state keyed by source and the avatar's accessible name.
 * Returns attribute bags only; classes stay with the component.
 */
import { computed, onMounted, onScopeDispose, shallowRef } from 'vue'
import type { ComputedRef, ShallowRef } from 'vue'
import { ICONS } from '#kit/shared/constants/icons'
import { getAvatarInitials } from '#kit/shared/utils/avatar'

export interface UseAvatarProps {
  src?: string
  alt?: string
  name?: string
  icon?: string
}

export interface UseAvatarOptions {
  /** The rendered `<img>`, read once on mount for an outcome it may have missed. */
  image: Readonly<ShallowRef<HTMLImageElement | null>>
  /** A custom default slot owns the content and therefore its semantics. */
  ownsContent?: () => boolean
  onLoad?: (event: Event) => void
  onError?: (event: Event) => void
}

export interface UseAvatarReturn {
  /** Trimmed `name`, `undefined` when blank. */
  normalizedName: ComputedRef<string | undefined>
  initials: ComputedRef<string>
  fallbackIcon: ComputedRef<string>
  /** The current source failed; a new source is tried afresh. */
  failed: ComputedRef<boolean>
  showImage: ComputedRef<boolean>
  /** The event of the current source's failure, for the fallback slot. */
  errorEvent: Readonly<ShallowRef<Event | undefined>>
  /** `role="img"` and the name whenever the avatar itself carries the name. */
  rootAttrs: ComputedRef<Record<string, unknown>>
  /** `src`, `alt` and the load/error listeners of the `<img>`. */
  imageAttrs: ComputedRef<Record<string, unknown>>
}

export function useAvatar(props: UseAvatarProps, options: UseAvatarOptions): UseAvatarReturn {
  /** Keyed by URL so a new source is attempted while the failed one stays failed. */
  const failedSrc = shallowRef<string>()
  /** Keyed by URL so a replayed `load` never reaches the consumer twice. */
  const loadedSrc = shallowRef<string>()
  const errorEvent = shallowRef<Event>()
  let disposed = false

  const normalizedName = computed(() => props.name?.trim() || undefined)
  const initials = computed(() => (normalizedName.value ? getAvatarInitials(normalizedName.value) : ''))
  const fallbackIcon = computed(() => props.icon || ICONS.person)
  const failed = computed(() => Boolean(props.src) && failedSrc.value === props.src)
  const showImage = computed(() => Boolean(props.src) && !failed.value)

  // An explicit `alt` names the image while it shows. Once the fallback takes
  // over, the same text names the avatar, so a meaningful avatar never goes
  // silent; `name` stands in when there is no `alt`, and `''` keeps it decorative.
  const label = computed(() => {
    if (options.ownsContent?.() || props.alt === '') return undefined
    if (showImage.value) return props.alt === undefined ? normalizedName.value : undefined

    return props.alt ?? normalizedName.value
  })

  const rootAttrs = computed<Record<string, unknown>>(() =>
    (label.value ? { 'role': 'img', 'aria-label': label.value } : {}))

  /** Guards against a late event from a source that is no longer active. */
  function isCurrent(event: Event) {
    return (event.target as HTMLImageElement | null)?.getAttribute('src') === props.src
  }

  function onLoad(event: Event) {
    if (disposed || !isCurrent(event) || loadedSrc.value === props.src) return
    loadedSrc.value = props.src
    errorEvent.value = undefined
    options.onLoad?.(event)
  }

  function onError(event: Event) {
    if (disposed || !isCurrent(event) || failed.value) return
    failedSrc.value = props.src
    errorEvent.value = event
    options.onError?.(event)
  }

  const imageAttrs = computed<Record<string, unknown>>(() => ({
    src: props.src,
    alt: props.alt ?? '',
    onLoad,
    onError,
  }))

  const replay = (image: HTMLImageElement, type: 'load' | 'error') => image.dispatchEvent(new Event(type))

  // A server-rendered image can settle before hydration attaches its listeners,
  // and that event is gone for good. A complete image is replayed through the
  // same handlers. One with no pixels may still be a size-less SVG, so
  // `decode()` decides where the browser has it.
  onMounted(() => {
    const image = options.image.value
    if (!image?.complete || !props.src) return
    if (image.naturalWidth > 0) return void replay(image, 'load')
    if (typeof image.decode !== 'function') return void replay(image, 'error')

    image.decode().then(() => replay(image, 'load'), () => replay(image, 'error'))
  })

  onScopeDispose(() => {
    disposed = true
  })

  return { normalizedName, initials, fallbackIcon, failed, showImage, errorEvent, rootAttrs, imageAttrs }
}
