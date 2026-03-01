'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export interface LinePoint {
  st: string
  cumulative: number
}

export interface PieSlice {
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
  pieData,
}: {
  lineData: LinePoint[]
  pieData: PieSlice[]
}) {
  return (
    <div className="space-y-5">

      {/* Treffer-Verteilung Donut */}
      {pieData.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">
            Treffer-Verteilung
          </h3>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <PieChart width={180} height={180}>
              <Pie
                data={pieData}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as PieSlice
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs font-sans">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-muted-foreground">{d.value} Tipps · {d.pct}%</p>
                    </div>
                  )
                }}
              />
            </PieChart>
            <div className="flex flex-col gap-2.5">
              {pieData.map((e) => (
                <div key={e.name} className="flex items-center gap-2 text-xs font-sans">
                  <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-foreground">{e.name}</span>
                  <span className="ml-auto pl-4 tabular-nums text-muted-foreground font-medium">{e.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saison-Verlauf LineChart */}
      {lineData.length > 1 && (
        <div className="glass rounded-xl p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">
            Saison-Verlauf
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="st" tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs font-sans">
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
                stroke="#2a61a1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#2a61a1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
