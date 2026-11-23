'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { Star } from 'lucide-react'
import { ClubIcon } from '@/components/club-icon'
import { getClubByName } from '@/lib/clubs'
import { cn } from '@/lib/utils'
import { userColorVars } from '@/lib/user-tone'

export function Scoreboard({ result, live = false, large = false }: { result: string | null; live?: boolean; large?: boolean }) {
  const [home, away] = result?.split(':') ?? ['–', '–']
  return <span className={cn('scoreboard', !result && 'scoreboard-empty', live && 'scoreboard-live', large && 'scoreboard-large')} aria-label={result ? `Ergebnis ${home} zu ${away}${live ? ', live' : ''}` : 'Noch kein Ergebnis'}>
    {live && <span className="size-1.5 rounded-full bg-neon-400 animate-live-pulse" aria-hidden="true" />}
    <span>{home}</span><span className="scoreboard-colon">:</span><span>{away}</span>
  </span>
}

export function PointsToken({ points, tier, small = false }: { points: number | null; tier?: 4 | 3 | 2 | 0; small?: boolean }) {
  const level = tier ?? (points === null ? 'open' : points >= 4 ? 4 : points === 3 ? 3 : points === 2 ? 2 : 0)
  return <span className={cn('points-token font-wide', `points-token-${level}`, small && 'points-token-small')} aria-label={points === null ? 'Punkte offen' : `${points} Punkte`}>{points ?? '–'}</span>
}

export function JokerMark({ compact = false }: { compact?: boolean }) {
  return <span className={cn('joker-mark', compact && 'joker-mark-compact')}><Star className="size-3 fill-lime-300 text-lime-300" aria-hidden="true" /> ×2</span>
}

export function CompareChip({ text, tone }: { text: string; tone: 'best' | 'solo' | 'share' | 'todo' }) {
  return <span className={cn('compare-chip', `compare-chip-${tone}`)}><span className="size-[7px] shrink-0 rounded-full bg-current" aria-hidden="true" /><span className="truncate">{text}</span></span>
}

export function FieldTag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'you' | 'field' | 'joker' | 'best' | 'neutral' }) {
  return <span className={cn('field-tag', `field-tag-${tone}`)}>{children}</span>
}

export function StatusPill({ status }: { status: 'open' | 'live' | 'finished' }) {
  const text = { open: 'Tippen offen', live: 'Live', finished: 'Abgeschlossen' }[status]
  return <span className={cn('status-pill', `status-pill-${status}`)}>{status === 'live' && <span className="size-1.5 rounded-full bg-neon-400 animate-live-pulse" aria-hidden="true" />}{text}</span>
}

export function PlayerAvatar({ nickname, favoriteTeam, color, small = false, inheritTone = false }: { nickname: string; favoriteTeam: string | null; color: string | null; small?: boolean; inheritTone?: boolean }) {
  const club = favoriteTeam ? getClubByName(favoriteTeam) : undefined
  return <span className={cn('player-avatar user-ring', small && 'player-avatar-small')} style={inheritTone ? undefined : userColorVars(color) as CSSProperties} title={nickname}>
    {club ? <ClubIcon src={club.iconUrl} fallbackSrc={club.iconSourceUrl} label={club.name} className={cn('size-6 object-contain', small && 'size-[18px]')} /> : <span className="text-xs font-medium text-secondary-text">{nickname.slice(0, 1).toUpperCase()}</span>}
  </span>
}

export interface RankingPlayer { userId: string; nickname: string; favoriteTeam: string | null; color: string | null; isCurrentUser: boolean; matchdayPoints: number; seasonPoints: number }
export function RankingList({ players, mode, onModeChange }: { players: RankingPlayer[]; mode: 'matchday' | 'season'; onModeChange: (mode: 'matchday' | 'season') => void }) {
  const sorted = [...players].sort((a, b) => (mode === 'season' ? b.seasonPoints - a.seasonPoints : b.matchdayPoints - a.matchdayPoints) || a.nickname.localeCompare(b.nickname, 'de'))
  const value = (p: RankingPlayer) => mode === 'season' ? p.seasonPoints : p.matchdayPoints
  const first = Math.max(1, ...sorted.map(value))
  return <section className="surface-raised rounded-2xl overflow-hidden" aria-label="Rangliste">
    <div className="flex items-center justify-between gap-3 p-4 border-b border-border"><h2 className="text-xl">Rangliste</h2><div className="segment-track" role="group" aria-label="Ranglisten-Zeitraum"><button className={cn('segment', mode === 'matchday' && 'segment-active')} onClick={() => onModeChange('matchday')} aria-pressed={mode === 'matchday'}>Spieltag</button><button className={cn('segment', mode === 'season' && 'segment-active')} onClick={() => onModeChange('season')} aria-pressed={mode === 'season'}>Saison</button></div></div>
    <ol className="divide-y divide-border">{sorted.map((p) => { const rank = sorted.findIndex(q => value(q) === value(p)) + 1; return <li key={p.userId} className={cn('ranking-row', p.isCurrentUser && 'bg-you-soft')} style={userColorVars(p.color) as CSSProperties}>
      <span className="font-wide text-xl text-secondary-text">{rank}.</span><PlayerAvatar nickname={p.nickname} favoriteTeam={p.favoriteTeam} color={p.color} small inheritTone /><div className="min-w-0"><Link href={`/spieler/${encodeURIComponent(p.nickname)}`} className="block truncate text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{p.nickname}{p.isCurrentUser && <span className="ml-1 text-muted-foreground">(du)</span>}</Link><span className="mt-1 block h-1 rounded-full user-bar" style={{ width: `${Math.max(2, value(p) / first * 100)}%` }} /></div><span className="font-wide text-[22px]">{value(p)}</span>
    </li> })}</ol>
  </section>
}

export function HeroPanel({ label, value, aside, children }: { label: string; value: string | number; aside?: ReactNode; children?: ReactNode }) {
  return <section className="hero-panel" aria-label={label}><div className="min-w-0"><p className="text-sm text-hero-foreground/75">{label}</p><p className="hero-value font-wide">{value}</p>{children}</div>{aside && <div className="hero-aside">{aside}</div>}</section>
}

export function ScoreInput({ value, onChange, onBlur, inputRef, onFocus, label, disabled = false }: { value: string; onChange: (value: string) => void; onBlur?: () => void; inputRef?: Ref<HTMLInputElement>; onFocus?: () => void; label: string; disabled?: boolean }) {
  return <input ref={inputRef} aria-label={label} inputMode="numeric" pattern="[0-9]*" maxLength={2} value={value} onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={onBlur} onFocus={onFocus} disabled={disabled} placeholder="–" className="score-input" />
}

export function JokerButton({ active, disabled, candidate = false, onClick, label }: { active: boolean; disabled: boolean; candidate?: boolean; onClick: () => void; label: string }) {
  return <button type="button" aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick} title={disabled ? 'Erst beide Tore tippen' : label} className={cn('joker-button', active && 'joker-button-active', candidate && 'joker-button-candidate')}><Star className={cn('size-5', active && 'fill-current')} strokeWidth={1.5} />{active && <span className="text-[10px]">×2</span>}</button>
}
