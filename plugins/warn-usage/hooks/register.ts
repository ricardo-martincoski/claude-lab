import type { Register, SessionMeasureInput } from 'claude-code'
import { day, time } from './format'

type Reading = { percent?: number; resetsAt?: string }

const limit = (e: SessionMeasureInput, kind: string): Reading => {
  const found = e.rateLimits.find(l => l.kind === kind)
  if (found === undefined) return {}
  return { percent: Math.round(found.percentUsed), resetsAt: found.resetsAt }
}

const reset = (resetsAt: string | undefined, write: (d: Date) => string) =>
  resetsAt === undefined ? '' : ` [${write(new Date(resetsAt))}]`

// Warnings raised, each with its threshold and duration options, what it reads and how it is
// written.
const WARNINGS = [
  {
    option: 'contextWarnAt',
    seconds: 'contextToastSeconds',
    read: (e: SessionMeasureInput): Reading => ({ percent: e.context.percent }),
    message: (percent: number) => `Context window usage reached ${percent}%`,
  },
  {
    option: 'sessionWarnAt',
    seconds: 'sessionToastSeconds',
    read: (e: SessionMeasureInput): Reading => limit(e, 'five_hour'),
    message: (percent: number, resetsAt?: string) =>
      `5-hour session usage limit reached ${percent}%${reset(resetsAt, time)}`,
  },
  {
    option: 'weekWarnAt',
    seconds: 'weekToastSeconds',
    read: (e: SessionMeasureInput): Reading => limit(e, 'seven_day'),
    message: (percent: number, resetsAt?: string) =>
      `7-day session usage limit reached ${percent}%${reset(resetsAt, day)}`,
  },
]

export const register: Register = (on, options) => {
  // Each warning is re-armed when its usage falls below its threshold (e.g. after a compaction
  // or a reset).
  const warned = new Set<string>()

  on('session.measure', ($, e, next) => {
    if (!e.changed.includes('context') && !e.changed.includes('rateLimits')) return next(e)

    // Warnings raised by one measurement go in a single toast, shown for the longest of their
    // durations: a plugin's later toasts are not shown while its first one is on screen.
    const messages: string[] = []
    let seconds = 0
    for (const { option, seconds: duration, read, message } of WARNINGS) {
      const threshold = Number(options[option])
      const { percent, resetsAt } = read(e)
      if (percent === undefined) continue

      if (percent >= threshold && !warned.has(option)) {
        warned.add(option)
        messages.push(message(percent, resetsAt))
        seconds = Math.max(seconds, Number(options[duration]))
      } else if (percent < threshold) {
        warned.delete(option)
      }
    }
    if (messages.length > 0) $.ui.toast(messages.join(' | '), { timeoutMs: seconds * 1000 })

    return next(e)
  })
}
