'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ClubIconProps {
  src?: string | null
  fallbackSrc?: string | null
  label?: string
  alt?: string
  className?: string
  fallbackClassName?: string
}

function getFallbackText(label?: string) {
  if (!label) return '?'

  const normalized = label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const match = normalized.match(/[A-Za-z0-9]/)
  return (match?.[0] ?? '?').toUpperCase()
}

export function ClubIcon({
  src,
  fallbackSrc,
  label,
  alt = '',
  className,
  fallbackClassName,
}: ClubIconProps) {
  const [failed, setFailed] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src ?? null)

  useEffect(() => {
    setFailed(false)
    setCurrentSrc(src ?? null)
  }, [src])

  if (!currentSrc || failed) {
    return (
      <span
        aria-hidden={alt === ''}
        title={label}
        className={cn(
          'inline-flex items-center justify-center rounded-sm bg-muted text-xs font-bold leading-none text-muted-foreground',
          className,
          fallbackClassName,
        )}
      >
        {getFallbackText(label)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      title={label}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
          return
        }
        setFailed(true)
      }}
    />
  )
}
