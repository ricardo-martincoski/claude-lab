import type { Register, SessionRateLimit } from 'claude-code'
import { day, time } from './format'

// Usage limit windows shown, in order, with their labels and how their reset is written.
const WINDOWS = [
  { kind: 'five_hour', label: 'session', resets: time },
  { kind: 'seven_day', label: 'week', resets: day },
]

const formatLimit = (limit: SessionRateLimit, label: string, resets: (d: Date) => string) => {
  const used = `${label} ${Math.round(limit.percentUsed)}%`
  if (limit.resetsAt === undefined) return used
  return `${used} [${resets(new Date(limit.resetsAt))}]`
}

export const register: Register = on => {
  on('session.measure', ($, e, next) => {
    if (!e.changed.includes('context') && !e.changed.includes('rateLimits')) return next(e)

    const { percent } = e.context
    const parts = WINDOWS.flatMap(({ kind, label, resets }) => {
      const limit = e.rateLimits.find(l => l.kind === kind)
      return limit === undefined ? [] : [formatLimit(limit, label, resets)]
    })
    if (percent !== undefined) parts.unshift(`context ${percent}%`)
    $.ui.status(parts.length === 0 ? undefined : parts.join(' | '))

    return next(e)
  })
}
