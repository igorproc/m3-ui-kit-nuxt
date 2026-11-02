export interface SwipeSample {
  /** Event time, milliseconds. */
  time: number
  /** Travel towards the closing edge at that time. */
  travel: number
}

export interface SwipeLimits {
  /** Travel past which a slow release closes. */
  threshold: number
  /** Speed (travel per second) past which a release follows its direction, however short. */
  velocityThreshold: number
  /** Travel a release must pass to count as a swipe at all. */
  slop: number
}

export type SwipeOutcome = 'dismiss' | 'restore'

export const SWIPE_VELOCITY_WINDOW_MS = 100

export function addSwipeSample(samples: readonly SwipeSample[], sample: SwipeSample): SwipeSample[] {
  return [...samples.filter(kept => sample.time - kept.time <= SWIPE_VELOCITY_WINDOW_MS), sample]
}

export function releaseVelocity(samples: readonly SwipeSample[]): number {
  const last = samples.at(-1)
  if (!last) return 0

  const first = samples.find(sample => last.time - sample.time <= SWIPE_VELOCITY_WINDOW_MS) ?? last
  const elapsed = last.time - first.time
  return elapsed > 0 ? (last.travel - first.travel) / elapsed * 1000 : 0
}

export function resolveSwipe(travel: number, velocity: number, limits: SwipeLimits): SwipeOutcome {
  if (travel <= limits.slop) return 'restore'
  if (velocity >= limits.velocityThreshold) return 'dismiss'
  if (velocity <= -limits.velocityThreshold) return 'restore'
  return travel > limits.threshold ? 'dismiss' : 'restore'
}
