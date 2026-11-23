import { clampChroma, converter, differenceEuclidean, formatHex } from 'culori'

const toOklch = converter('oklch')
const okLabDistance = differenceEuclidean('oklab')
const band = { light: [0.45, 0.70], dark: [0.58, 0.88] } as const

/** Adjust only the displayed tone. The stored user color never changes. */
export function userTone(hex: string, mode: 'light' | 'dark'): string {
  const color = toOklch(hex)
  if (!color) return hex
  const [min, max] = band[mode]
  return formatHex(clampChroma({ ...color, l: Math.min(max, Math.max(min, color.l)) }, 'oklch'))
}

/** CIE OKLab distance on the customary 0–100 scale. */
export function userColorDistance(a: string, b: string): number {
  return 100 * okLabDistance(a, b)
}

export function userColorVars(color: string | null): { '--uc': string; '--uc-dark': string } {
  const hex = color ?? '#788383'
  return { '--uc': userTone(hex, 'light'), '--uc-dark': userTone(hex, 'dark') }
}
