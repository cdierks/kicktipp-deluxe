'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

export interface LinePoint {
  st: string
  cumulative: number
}

export interface QualitySlice {
  name: string
  value: number
  pct: number
  color: string
}

const TICK_STYLE = {
  fontSize: 11,
  fill: 'var(--muted-foreground)',
  fontFamily: 'var(--font-sans)',
} as const

export function PlayerCharts({
  lineData,
  qualityData,
  lineColor,
}: {
  lineData: LinePoint[]
  qualityData: QualitySlice[]
  lineColor: string
}) {
  return (
    <div className="grid gap-4">
      {qualityData.length > 0 && (
        <div className="surface overflow-hidden rounded-[1.35rem] border border-border/70 p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-foreground">
            Tippqualität
          </h3>
          <div className="space-y-3">
            {qualityData.map((entry) => (
              <div key={entry.name} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2 text-xs">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
                    <span className="truncate text-foreground">{entry.name}</span>
                    <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{entry.value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{ width: `${entry.pct}%`, backgroundColor: entry.color }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <span className="text-right text-xs font-medium tabular-nums text-muted-foreground">
                  {entry.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lineData.length > 1 && (
        <div className="surface overflow-hidden rounded-[1.35rem] border border-border/70 p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-foreground">
            Saison-Verlauf
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="st" tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs">
                      <p className="mb-1 font-bold uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="font-bold tabular-nums text-foreground">
                        {payload[0].value} Pkt gesamt
                      </p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke={lineColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
