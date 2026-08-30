import { QuantizerCelebi, Score, hexFromArgb } from '@material/material-color-utilities'
import { IN_BROWSER } from '#kit/shared/constants/globals'

/**
 * Picks a seed HEX from a set of ARGB pixels via MCU's quantizer + scorer.
 * Pure — the dominant, theme-suitable color of the pixel set.
 */
export const seedFromPixels = (pixels: number[], maxColors = 128): string | null => {
  if (!pixels.length) return null
  const ranked = Score.score(QuantizerCelebi.quantize(pixels, maxColors))
  return ranked.length ? hexFromArgb(ranked[0]!) : null
}

/** Converts canvas RGBA bytes into opaque ARGB ints, skipping transparent pixels. */
export const argbPixelsFromImageData = (data: Uint8ClampedArray): number[] => {
  const pixels: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!
    if (a < 255) continue
    pixels.push((255 << 24) | (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!)
  }
  return pixels
}

/**
 * Extracts a seed HEX from an image element by drawing it to an offscreen canvas.
 * Browser-only; returns `null` on the server or when no color can be resolved.
 * `sampleSize` downscales the draw for speed (quantization is O(pixels)).
 */
export const seedFromImage = (image: CanvasImageSource & { width: number, height: number }, sampleSize = 128): string | null => {
  if (!IN_BROWSER) return null

  const ratio = image.width / image.height || 1
  const width = Math.max(1, Math.round(ratio >= 1 ? sampleSize : sampleSize * ratio))
  const height = Math.max(1, Math.round(ratio >= 1 ? sampleSize / ratio : sampleSize))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null

  context.drawImage(image, 0, 0, width, height)
  return seedFromPixels(argbPixelsFromImageData(context.getImageData(0, 0, width, height).data))
}
