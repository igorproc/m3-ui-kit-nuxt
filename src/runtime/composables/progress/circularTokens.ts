import type { MFieldDensity } from '#kit/components/ui/text-field/props'

export interface CircularProgressTokens {
  box: number
  radius: number
  thickness: Record<MFieldDensity, number>
  trackGap: number
  wave: {
    amplitude: number
    wavelength: number
    samples: number
  }
}

export const CIRCULAR_PROGRESS: CircularProgressTokens = {
  box: 48,
  radius: 18,
  thickness: { compact: 3, default: 4, comfortable: 4 },
  trackGap: 4,
  wave: { amplitude: 1.6, wavelength: 15, samples: 120 },
}
