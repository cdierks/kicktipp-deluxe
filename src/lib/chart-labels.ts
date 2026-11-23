/** Position endpoint labels with a minimum vertical separation. */
export function layoutEndLabels<T extends { value: number }>(items: T[], height: number, minGap = 22): Array<T & { top: number }> {
  if (!items.length) return []
  const max = Math.max(1, ...items.map(item => item.value))
  const sorted = [...items].sort((a, b) => b.value - a.value)
  let previous = -minGap
  const placed = sorted.map(item => {
    const wanted = Math.round((1 - item.value / max) * (height - minGap))
    const top = Math.max(wanted, previous + minGap)
    previous = top
    return { ...item, top }
  })
  const overflow = Math.max(0, placed.at(-1)!.top - (height - minGap))
  return placed.map(item => ({ ...item, top: Math.max(0, item.top - overflow) }))
}
