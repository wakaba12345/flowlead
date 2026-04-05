'use client'

const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#f97316', '#ec4899', '#14b8a6']

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 360) end = start + 359.99
  const s = polarToCartesian(cx, cy, r, start)
  const e = polarToCartesian(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`
}

interface Slice { label: string; count: number }
interface Props { title: string; data: Slice[]; total: number }

export default function PieChart({ title, data, total }: Props) {
  if (total === 0) return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="mb-3 text-xs font-semibold text-gray-400 leading-snug">{title}</p>
      <p className="text-xs text-gray-600">尚無作答</p>
    </div>
  )

  let angle = 0
  const slices = data.map((d, i) => {
    const deg = (d.count / total) * 360
    const slice = { ...d, startAngle: angle, endAngle: angle + deg, color: COLORS[i % COLORS.length] }
    angle += deg
    return slice
  })

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="mb-3 text-xs font-semibold text-gray-300 leading-snug">{title}</p>
      <div className="flex items-start gap-4">
        <svg viewBox="0 0 100 100" width={90} height={90} className="shrink-0">
          {slices.map((s, i) => (
            <path key={i} d={arcPath(50, 50, 46, s.startAngle, s.endAngle)}
              fill={s.color} stroke="#111827" strokeWidth="1.5" />
          ))}
        </svg>
        <ul className="flex flex-col gap-1.5 min-w-0 flex-1">
          {slices.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs min-w-0">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="min-w-0 flex-1 text-gray-300 leading-tight break-words">{s.label}</span>
              <span className="shrink-0 text-gray-500 tabular-nums">
                {s.count} <span className="text-gray-600">({((s.count / total) * 100).toFixed(0)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
