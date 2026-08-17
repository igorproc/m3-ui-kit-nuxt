/**
 * @module virtual-scroll/geometry
 *
 * @remarks
 * Pure, DOM-free geometry for {@link useVirtualScroll}. A constant item size is
 * resolved analytically in O(1); a size function is resolved through a cached
 * prefix-sum with a binary search. Keeping this side of the composable pure
 * lets the range/offset maths be unit-tested without a viewport.
 *
 * v1 sizes are known before render — a constant or a synchronous index
 * function. Measured variable heights are explicitly out of scope.
 */

export interface VirtualRange {
  startIndex: number
  endIndex: number
}

/** Resolved geometry for one item set. */
export interface VirtualMeasurement {
  totalSize: number
  offsetAt: (index: number) => number
  sizeAt: (index: number) => number
  /** Highest index whose start offset is at or before `offset`. */
  indexAt: (offset: number) => number
}

function clampIndex(index: number, count: number) {
  if (count <= 0) return 0
  return Math.min(Math.max(index, 0), count - 1)
}

/**
 * Builds geometry for `count` items sized by `itemSize`, offset by
 * `paddingStart`. Rebuilt only when its inputs change, so a scroll event never
 * re-sums the sizes.
 */
export function buildMeasurement(
  count: number,
  itemSize: number | ((index: number) => number),
  paddingStart = 0,
): VirtualMeasurement {
  const safeCount = Math.max(0, Math.floor(count))

  if (typeof itemSize === 'number') {
    const size = Math.max(0, itemSize)
    return {
      totalSize: paddingStart + safeCount * size,
      offsetAt: index => paddingStart + clampIndex(index, safeCount) * size,
      sizeAt: () => size,
      indexAt: (offset) => {
        if (size <= 0) return 0
        return clampIndex(Math.floor((offset - paddingStart) / size), safeCount)
      },
    }
  }

  // Prefix sums: offsets[i] is the start of item i, offsets[count] is the end.
  const offsets = Array.from<number>({ length: safeCount + 1 })
  offsets[0] = paddingStart
  for (let index = 0; index < safeCount; index += 1) {
    offsets[index + 1] = offsets[index]! + Math.max(0, itemSize(index))
  }

  return {
    totalSize: offsets[safeCount]!,
    offsetAt: index => offsets[clampIndex(index, safeCount)]!,
    sizeAt: index => offsets[clampIndex(index, safeCount) + 1]! - offsets[clampIndex(index, safeCount)]!,
    indexAt: (offset) => {
      // Binary search for the last start offset <= offset.
      let low = 0
      let high = safeCount - 1
      let result = 0
      while (low <= high) {
        const mid = (low + high) >> 1
        if (offsets[mid]! <= offset) {
          result = mid
          low = mid + 1
        } else {
          high = mid - 1
        }
      }
      return result
    },
  }
}

/**
 * Visible range for a viewport, expanded by `overscan` and clamped to `count`.
 * An empty or disabled collection yields `{ 0, -1 }` — a range that iterates
 * zero times without producing an invalid index.
 */
export function computeRange(
  scrollOffset: number,
  viewportSize: number,
  measurement: VirtualMeasurement,
  count: number,
  overscan: number,
): VirtualRange {
  const safeCount = Math.max(0, Math.floor(count))
  if (safeCount === 0 || viewportSize <= 0) return { startIndex: 0, endIndex: -1 }

  const safeOverscan = Math.max(0, Math.floor(overscan))
  const firstVisible = measurement.indexAt(scrollOffset)
  // The last visible pixel is `offset + viewport - 1`: an item whose start sits
  // exactly on the far edge contributes nothing and must not count as visible.
  const lastVisible = measurement.indexAt(scrollOffset + viewportSize - 1)

  return {
    startIndex: Math.max(0, firstVisible - safeOverscan),
    endIndex: Math.min(safeCount - 1, lastVisible + safeOverscan),
  }
}
