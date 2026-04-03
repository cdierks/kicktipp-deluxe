function stripDiacritics(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

export function normalizeIconUrl(url: string) {
  return url.replace(/^http:\/\//i, 'https://')
}

export function slugifyClubName(name: string) {
  return stripDiacritics(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function inferIconExtension(url: string) {
  const normalized = normalizeIconUrl(url)
  const pathname = new URL(normalized).pathname.toLowerCase()
  const match = pathname.match(/\.([a-z0-9]+)$/)
  const ext = match?.[1] ?? 'png'

  if (ext === 'jpeg') return 'jpg'
  if (['svg', 'png', 'jpg', 'webp'].includes(ext)) return ext
  return 'png'
}

export function getLocalClubIconPath(name: string, sourceUrl: string) {
  return `/club-icons/${slugifyClubName(name)}.${inferIconExtension(sourceUrl)}`
}
