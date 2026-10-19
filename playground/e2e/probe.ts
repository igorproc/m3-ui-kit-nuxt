import { writeFile } from 'node:fs/promises'
import type { Locator, Page, TestInfo } from '@playwright/test'

/**
 * Motion probes: how an element actually moves while an interaction plays out.
 *
 * Sampling runs inside the page on every animation frame, so the trace has no
 * Playwright round-trip gaps; layout shifts come from the browser's own
 * `layout-shift` entries, inputs included, because the shifts that matter here
 * are exactly the ones an interaction causes.
 */

export interface ProbeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface TraceFrame {
  /** Milliseconds from the start of `act()`; negative frames are the resting baseline. */
  t: number
  rects: Record<string, ProbeRect | null>
  styles: Record<string, Record<string, string>>
}

export interface ShiftSource {
  node: string
  /** Name of the target the node belongs to (is, contains or sits in), if any. */
  target?: string
  previous: ProbeRect
  current: ProbeRect
}

export interface ShiftEntry {
  t: number
  value: number
  hadRecentInput: boolean
  sources: ShiftSource[]
}

export interface MotionTrace {
  /** CSS pixels in one `rem` (the kit's design pixel) while the trace was taken. */
  remPx: number
  frames: TraceFrame[]
  shifts: ShiftEntry[]
}

export interface TraceOptions {
  /** Name → CSS selector; the first match is sampled. */
  targets: Record<string, string>
  /** Computed style properties sampled on every target, e.g. `border-top-left-radius`. */
  styles?: string[]
  /** How long to keep recording after `act()` resolves, in ms. */
  duration?: number
  act: () => Promise<unknown>
}

export type MotionIssueKind = 'jump' | 'reversal' | 'shift' | 'unsettled'

export interface MotionIssue {
  target: string
  kind: MotionIssueKind
  t: number
  detail: string
}

export interface AnalyzeOptions {
  /** Smallest single-frame geometry change, in rem, worth calling a jump. */
  jumpRem?: number
  /** Target or `target.property` names to leave out. */
  ignore?: string[]
}

export type ProbeState = 'rest' | 'hover' | 'focus' | 'pressed'

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

/**
 * Records geometry and computed styles of `targets` on every frame while `act`
 * runs and for `duration` ms after it, plus every layout shift in that window.
 */
export async function traceMotion(page: Page, { targets, styles = [], duration = 1000, act }: TraceOptions): Promise<MotionTrace> {
  await page.evaluate(installRecorder, { targets, styles })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.evaluate(() => {
    window.__probe!.mark = performance.now()
  })
  await act()
  await page.waitForTimeout(duration)

  return page.evaluate(() => {
    const probe = window.__probe!
    probe.stop()
    const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    const shift = (time: number) => Math.round((time - probe.mark) * 10) / 10

    return {
      remPx,
      frames: probe.frames.map(frame => ({ ...frame, t: shift(frame.t) })),
      shifts: probe.shifts.map(entry => ({ ...entry, t: shift(entry.t) })),
    }
  })
}

/** Turns a trace into factual findings; deciding whether one is a defect is the reader's job. */
export function analyzeMotion(trace: MotionTrace, { jumpRem = 2, ignore = [] }: AnalyzeOptions = {}): MotionIssue[] {
  const issues: MotionIssue[] = []
  // The last resting frame stays in, so a change on the very first frame of act() still counts.
  const frames = trace.frames.filter((frame, index, all) => frame.t >= 0 || (all[index + 1]?.t ?? -1) >= 0)
  const first = frames[0]
  if (!first || frames.length < 2) return issues

  for (const target of Object.keys(first.rects)) {
    if (ignore.includes(target)) continue

    for (const [name, points] of seriesOf(frames, target, trace.remPx)) {
      if (ignore.includes(`${target}.${name}`)) continue
      const threshold = name in THRESHOLDS ? THRESHOLDS[name as keyof typeof THRESHOLDS] : jumpRem
      issues.push(...inspectSeries(target, name, points, threshold))
    }
  }

  for (const entry of trace.shifts) {
    for (const source of entry.sources) {
      if (source.target) continue
      issues.push({
        target: source.node,
        kind: 'shift',
        t: entry.t,
        detail: `moved ${describeMove(source, trace.remPx)} without being a target${entry.hadRecentInput ? ' (after input)' : ''}`,
      })
    }
  }

  return issues.sort((a, b) => a.t - b.t)
}

/**
 * Screenshots `locator` (with room around it for rings and shadows) in each
 * state and returns the file paths, in order.
 */
export async function shootStates(page: Page, locator: Locator, dir: string, name: string, states: ProbeState[] = ['rest', 'hover', 'focus', 'pressed']): Promise<string[]> {
  const paths: string[] = []

  for (const state of states) {
    await page.mouse.move(0, 0)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await locator.scrollIntoViewIfNeeded()

    if (state === 'hover' || state === 'pressed') await locator.hover()
    if (state === 'pressed') await page.mouse.down()
    if (state === 'focus') {
      // A key press first: Chromium only matches :focus-visible on scripted focus after keyboard use.
      await page.keyboard.press('Shift')
      await locator.evaluate((element, selector) => {
        const focusable = (element.matches(selector) ? element : element.querySelector(selector)) as HTMLElement | null
        focusable?.focus()
      }, FOCUSABLE)
    }

    await settle(page)
    paths.push(await shoot(page, locator, `${dir}/${name}-${state}.png`))

    if (state === 'pressed') {
      // Leave before releasing, so the press does not become a click.
      await page.mouse.move(0, 0)
      await page.mouse.up()
    }
  }

  await page.mouse.move(0, 0)
  return paths
}

/** Screenshot of `locator` with room around it, so focus rings and shadows stay in frame. */
export async function shoot(page: Page, locator: Locator, path: string): Promise<string> {
  await locator.scrollIntoViewIfNeeded()
  await page.screenshot({ path, clip: await paddedBox(page, locator) })
  return path
}

/** Writes `data` as `<name>.json` into the test's output directory and returns the path. */
export async function saveProbe(testInfo: TestInfo, name: string, data: unknown): Promise<string> {
  const path = testInfo.outputPath(`${name}.json`)
  await writeFile(path, JSON.stringify(data, null, 2))
  return path
}

/** Waits until time-driven transitions finish (scroll-driven and infinite ones never do). */
export async function settle(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every(animation =>
    animation.playState !== 'running'
    || animation.effect?.getTiming().iterations === Infinity
    || !(animation.timeline instanceof DocumentTimeline)), undefined, { timeout: 5000 }).catch(() => {})
}

declare global {
  interface Window {
    __probe?: {
      mark: number
      frames: TraceFrame[]
      shifts: ShiftEntry[]
      stop: () => void
    }
  }
}

/** Runs in the page; must stay self-contained (Playwright serialises it). */
function installRecorder({ targets, styles }: { targets: Record<string, string>, styles: string[] }) {
  const toRect = (rect: DOMRectReadOnly) => ({
    x: Math.round(rect.x * 100) / 100,
    y: Math.round(rect.y * 100) / 100,
    width: Math.round(rect.width * 100) / 100,
    height: Math.round(rect.height * 100) / 100,
  })
  const describe = (node: Node | null) => {
    if (!(node instanceof Element)) return node?.nodeName.toLowerCase() ?? 'unknown'
    const test = node.closest('[data-test]')?.getAttribute('data-test')
    const classes = [...node.classList].slice(0, 2).map(name => `.${name}`).join('')
    return `${node.tagName.toLowerCase()}${classes}${test ? ` @${test}` : ''}`
  }
  const elements = () => Object.entries(targets).map(([name, selector]) => [name, document.querySelector(selector)] as const)

  const frames: TraceFrame[] = []
  const shifts: ShiftEntry[] = []
  let running = true

  const sample = () => {
    if (!running) return
    const frame: TraceFrame = { t: performance.now(), rects: {}, styles: {} }
    for (const [name, element] of elements()) {
      frame.rects[name] = element ? toRect(element.getBoundingClientRect()) : null
      if (element && styles.length) {
        const computed = getComputedStyle(element)
        frame.styles[name] = Object.fromEntries(styles.map(property => [property, computed.getPropertyValue(property)]))
      }
    }
    frames.push(frame)
    requestAnimationFrame(sample)
  }

  const observer = new PerformanceObserver((list) => {
    const owners = elements()
    for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number, hadRecentInput: boolean, sources?: Array<{ node: Node | null, previousRect: DOMRectReadOnly, currentRect: DOMRectReadOnly }> }>) {
      shifts.push({
        t: entry.startTime,
        value: entry.value,
        hadRecentInput: entry.hadRecentInput,
        sources: (entry.sources ?? []).map(source => ({
          node: describe(source.node),
          target: owners.find(([, owner]) => owner && source.node && (owner === source.node || owner.contains(source.node) || source.node.contains(owner)))?.[0],
          previous: toRect(source.previousRect),
          current: toRect(source.currentRect),
        })),
      })
    }
  })
  observer.observe({ type: 'layout-shift', buffered: false })

  window.__probe = {
    mark: performance.now(),
    frames,
    shifts,
    stop: () => {
      running = false
      observer.disconnect()
    },
  }
  requestAnimationFrame(sample)
}

/** Opacity and scale are unitless; everything else is converted to rem. */
const THRESHOLDS = { opacity: 0.3, scale: 0.1 }

interface SeriesPoint {
  t: number
  value: number
}

interface SeriesStep {
  /** Time of the frame the change landed on. */
  t: number
  change: number
}

function seriesOf(frames: TraceFrame[], target: string, remPx: number): Map<string, SeriesPoint[]> {
  const series = new Map<string, SeriesPoint[]>()
  const push = (name: string, t: number, value: number) => {
    if (Number.isNaN(value)) return
    const points = series.get(name) ?? []
    points.push({ t, value })
    series.set(name, points)
  }

  for (const { t, rects, styles } of frames) {
    const rect = rects[target]
    if (rect) {
      push('x', t, rect.x / remPx)
      push('y', t, rect.y / remPx)
      push('width', t, rect.width / remPx)
      push('height', t, rect.height / remPx)
    }
    for (const [property, raw] of Object.entries(styles[target] ?? {})) {
      if (property === 'transform' || property === 'translate' || property === 'scale') {
        const parts = parseTransform(raw)
        push(`${property}.tx`, t, parts.tx / remPx)
        push(`${property}.ty`, t, parts.ty / remPx)
        push('scale', t, parts.scale)
      } else if (property === 'opacity') push('opacity', t, Number.parseFloat(raw))
      else if (/^-?[\d.]+px/.test(raw.trim())) push(property, t, Number.parseFloat(raw) / remPx)
    }
  }

  return series
}

function inspectSeries(target: string, name: string, points: SeriesPoint[], threshold: number): MotionIssue[] {
  const issues: MotionIssue[] = []
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return issues

  const steps: SeriesStep[] = points.slice(1).map((point, index) => ({ t: point.t, change: point.value - (points[index]?.value ?? point.value) }))
  const total = last.value - first.value
  // Noise floor: sub-pixel rounding and colour-only frames should not read as motion.
  const moving = steps.filter(step => Math.abs(step.change) > threshold / 50)
  const largest = moving.reduce<SeriesStep | undefined>((best, step) => !best || Math.abs(step.change) > Math.abs(best.change) ? step : best, undefined)
  if (!largest) return issues

  const magnitudes = moving.map(step => Math.abs(step.change)).sort((a, b) => a - b)
  const median = magnitudes[Math.floor(magnitudes.length / 2)] ?? 0
  const size = Math.abs(largest.change)
  if (size >= threshold && (size >= 0.6 * Math.abs(total) || size > 4 * median)) {
    issues.push({
      target,
      kind: 'jump',
      t: largest.t,
      detail: `${name} changed by ${round(largest.change)} in one frame (whole move ${round(total)}, ${moving.length} moving frames)`,
    })
  }

  const turns = moving.filter((step, index) => index === 0 || Math.sign(step.change) !== Math.sign(moving[index - 1]?.change ?? 0))
  const firstMove = turns[0]
  if (firstMove && Math.abs(total) >= threshold && Math.sign(firstMove.change) !== Math.sign(total)) {
    issues.push({ target, kind: 'reversal', t: firstMove.t, detail: `${name} first moved away from where it ends (${round(total)})` })
  }
  // One turn is a spring's overshoot; more is motion going back and forth.
  if (turns.length > 2) {
    issues.push({ target, kind: 'reversal', t: turns.at(-1)?.t ?? last.t, detail: `${name} changed direction ${turns.length - 1} times` })
  }

  if (moving.some(step => step.t > last.t - 100)) {
    issues.push({ target, kind: 'unsettled', t: last.t, detail: `${name} still moving in the last 100 ms` })
  }

  return issues
}

function parseTransform(raw: string) {
  const values = raw.match(/-?[\d.]+(?:e-?\d+)?/g)?.map(Number) ?? []
  if (raw.startsWith('matrix3d')) return { tx: values[13] ?? 0, ty: values[14] ?? 0, scale: Math.hypot(values[1] ?? 1, values[2] ?? 0) }
  if (raw.startsWith('matrix')) return { tx: values[4] ?? 0, ty: values[5] ?? 0, scale: Math.hypot(values[0] ?? 1, values[1] ?? 0) }
  // `translate` / `scale` individual properties: "10px 20px", "1.2"
  if (raw === 'none' || !values.length) return { tx: 0, ty: 0, scale: 1 }
  return raw.includes('px') ? { tx: values[0] ?? 0, ty: values[1] ?? 0, scale: 1 } : { tx: 0, ty: 0, scale: values[0] ?? 1 }
}

function describeMove(source: ShiftSource, remPx: number) {
  const dx = (source.current.x - source.previous.x) / remPx
  const dy = (source.current.y - source.previous.y) / remPx
  const dw = (source.current.width - source.previous.width) / remPx
  const dh = (source.current.height - source.previous.height) / remPx
  return `dx ${round(dx)} dy ${round(dy)} dw ${round(dw)} dh ${round(dh)} rem`
}

async function paddedBox(page: Page, locator: Locator) {
  const box = (await locator.boundingBox())!
  const viewport = page.viewportSize()!
  const pad = 16
  const x = Math.max(0, box.x - pad)
  const y = Math.max(0, box.y - pad)
  return {
    x,
    y,
    width: Math.min(viewport.width - x, box.width + pad * 2),
    height: Math.min(viewport.height - y, box.height + pad * 2),
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
