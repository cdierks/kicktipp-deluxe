export function formatDecimal(value: number, maximumFractionDigits = 1): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits })
}

export function formatPercent(value: number): string {
  return `${formatDecimal(value)}\u00A0%`
}
