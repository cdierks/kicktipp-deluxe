export const APP_TIME_ZONE = 'Europe/Berlin'

type DateInput = Date | string | number

/**
 * Formats an absolute instant in the application's football timezone. Passing
 * the zone explicitly keeps server rendering and browsers outside Germany in
 * sync.
 */
export function formatAppDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
  locale = 'de-DE',
) {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value))
}

const dateTimeLocalFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
})

function getAppDateTimeParts(value: DateInput) {
  const parts = Object.fromEntries(
    dateTimeLocalFormatter
      .formatToParts(new Date(value))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number.parseInt(part.value, 10)]),
  )

  return {
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    month: parts.month,
    year: parts.year,
  }
}

export function formatAppDateTimeLocal(value: DateInput) {
  const parts = getAppDateTimeParts(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

/**
 * Converts a timezone-less `datetime-local` value as Europe/Berlin wall time.
 * The final round-trip rejects invalid values in the DST spring-forward gap.
 */
export function parseAppDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const [, year, month, day, hour, minute] = match.map(Number)
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute)
  let instant = desiredWallTime

  // Re-evaluate the offset because it changes at DST boundaries.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rendered = getAppDateTimeParts(instant)
    const renderedWallTime = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
    )
    instant += desiredWallTime - renderedWallTime
  }

  const result = new Date(instant)
  return formatAppDateTimeLocal(result) === value ? result : null
}
