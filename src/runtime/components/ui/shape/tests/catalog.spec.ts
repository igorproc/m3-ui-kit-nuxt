import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { M3_SHAPE_SIZE, M3_SHAPES } from '#kit/assets/icon/shapes'
import type { M3ShapeName } from '#kit/assets/icon/shapes'
import { parsePath } from '#kit/utils/morph/parse'
import { samplePath } from '#kit/utils/morph/resample'

const SHAPE_NAMES = Object.keys(M3_SHAPES) as M3ShapeName[]
const SVG_DIR = resolve(process.cwd(), 'src/runtime/assets/icon/shapes')
const svgSources = readdirSync(SVG_DIR)
  .filter(file => file.endsWith('.svg'))
  .map(file => ({ file, source: readFileSync(resolve(SVG_DIR, file), 'utf8') }))

describe('m-shape · catalog', () => {
  it('is generated from every source svg', () => {
    const fromSources = svgSources.map(({ source }) => source.match(/<path[^>]*\sd="([^"]+)"/)?.[1])

    expect(fromSources).toHaveLength(SHAPE_NAMES.length)
    expect([...fromSources].sort()).toEqual(Object.values(M3_SHAPES).sort())
  })

  it.each(svgSources.map(({ file, source }) => [file, source]))('%s is drawn on the shared grid', (_file, source) => {
    expect(source).toContain(`viewBox="0 0 ${M3_SHAPE_SIZE} ${M3_SHAPE_SIZE}"`)
  })

  it.each(SHAPE_NAMES)('%s stays inside the grid', (name) => {
    const { pts } = samplePath(parsePath(M3_SHAPES[name]), 96)

    for (const value of pts) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(M3_SHAPE_SIZE)
    }
  })
})
