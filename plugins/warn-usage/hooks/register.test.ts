import { test, expect } from 'claude-code/testing'
import type { On, SessionRateLimit, UsageUnit } from 'claude-code'

// Reset times are built from local date parts, so the expected text does not depend on the
// machine's time zone.
const SESSION_RESET = new Date(2026, 9, 4, 21, 50).toISOString()
const WEEK_RESET = new Date(2026, 9, 10, 7, 0).toISOString()

type Usage = { context?: number; session?: SessionRateLimit; week?: SessionRateLimit }

const measure = (usage: Usage, changed: UsageUnit[] = ['context', 'rateLimits']) => ({
  // window is required by the type; the plugin reads only percent
  context: { window: 200000, percent: usage.context },
  rateLimits: [usage.session, usage.week].filter(l => l !== undefined),
  changed,
})

// Records the toasts the plugin raises.
const record = (on: On) => {
  const toasts: { text: string; timeoutMs?: number }[] = []
  on('ui.toast', async (_$, e) => {
    toasts.push({ text: e.text, timeoutMs: e.timeoutMs })
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))
  return toasts
}

// The three warnings behave the same way; each entry says how to measure a percentage for it,
// which options set its threshold and duration and what its warning says.
const WARNINGS = [
  {
    name: 'context window usage',
    option: 'contextWarnAt',
    seconds: 'contextToastSeconds',
    usage: (percent?: number): Usage => ({ context: percent }),
    message: (percent: number) => `Context window usage reached ${percent}%`,
  },
  {
    name: '5-hour session usage limit',
    option: 'sessionWarnAt',
    seconds: 'sessionToastSeconds',
    usage: (percent?: number): Usage =>
      percent === undefined ? {} : { session: { kind: 'five_hour', percentUsed: percent } },
    message: (percent: number) => `5-hour session usage limit reached ${percent}%`,
  },
  {
    name: '7-day session usage limit',
    option: 'weekWarnAt',
    seconds: 'weekToastSeconds',
    usage: (percent?: number): Usage =>
      percent === undefined ? {} : { week: { kind: 'seven_day', percentUsed: percent } },
    message: (percent: number) => `7-day session usage limit reached ${percent}%`,
  },
]

for (const { name, option, seconds, usage, message } of WARNINGS) {
  const at50 = { options: { [option]: 50 } }
  const fiveSeconds = { options: { [seconds]: 5 } }

  test(`${name}: does not warn below 80% by default`, async ($, on) => {
    const toasts = record(on)
    for (const p of [50, 79]) await $.session.measure(measure(usage(p)))
    expect(toasts).toEqual([])
  })

  test(`${name}: warns at exactly 80% by default`, async ($, on) => {
    const toasts = record(on)
    await $.session.measure(measure(usage(80)))
    expect(toasts.map(t => t.text)).toEqual([message(80)])
  })

  test(`${name}: warns only once while usage stays at or above the threshold`, async ($, on) => {
    const toasts = record(on)
    for (const p of [81, 85, 90]) await $.session.measure(measure(usage(p)))
    expect(toasts.map(t => t.text)).toEqual([message(81)])
  })

  test(`${name}: warns again after usage falls below the threshold`, async ($, on) => {
    const toasts = record(on)
    for (const p of [85, 20, 83]) await $.session.measure(measure(usage(p)))
    expect(toasts.map(t => t.text)).toEqual([message(85), message(83)])
  })

  test(`${name}: keeps the warning disarmed while usage is unavailable`, async ($, on) => {
    const toasts = record(on)
    for (const p of [85, undefined, 85]) await $.session.measure(measure(usage(p)))
    expect(toasts.map(t => t.text)).toEqual([message(85)])
  })

  test(`${name}: warns at the configured threshold`, at50, async ($, on) => {
    const toasts = record(on)
    for (const p of [49, 50]) await $.session.measure(measure(usage(p)))
    expect(toasts.map(t => t.text)).toEqual([message(50)])
  })

  test(`${name}: shows the warning for its configured duration`, fiveSeconds, async ($, on) => {
    const toasts = record(on)
    await $.session.measure(measure(usage(85)))
    expect(toasts.map(t => t.timeoutMs)).toEqual([5_000])
  })
}

// Warning text

test('writes the reset time in the 5-hour session usage limit warning', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({
    session: { kind: 'five_hour', percentUsed: 82, resetsAt: SESSION_RESET },
  }))
  expect(toasts.map(t => t.text)).toEqual(['5-hour session usage limit reached 82% [21:50]'])
})

test('writes the reset date and time in the 7-day session usage limit warning', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({
    week: { kind: 'seven_day', percentUsed: 82, resetsAt: WEEK_RESET },
  }))
  expect(toasts.map(t => t.text)).toEqual([
    '7-day session usage limit reached 82% [Sat 2026-10-10 07:00]',
  ])
})

test('joins the warnings raised together into one toast', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({
    context: 85,
    session: { kind: 'five_hour', percentUsed: 90 },
    week: { kind: 'seven_day', percentUsed: 10 },
  }))
  expect(toasts.map(t => t.text)).toEqual([
    'Context window usage reached 85% | 5-hour session usage limit reached 90%',
  ])
})

// Usage limits

test('rounds the usage limit percentage', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({ week: { kind: 'seven_day', percentUsed: 81.5 } }))
  expect(toasts.map(t => t.text)).toEqual(['7-day session usage limit reached 82%'])
})

test('ignores other kinds of usage limits', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({ session: { kind: 'spend_limit', percentUsed: 95 } }))
  expect(toasts).toEqual([])
})

// Warning duration

test('shows a warning for 30 seconds by default', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({ context: 85 }))
  expect(toasts.map(t => t.timeoutMs)).toEqual([30_000])
})

const MIXED_DURATIONS = {
  options: { contextToastSeconds: 40, sessionToastSeconds: 20, weekToastSeconds: 50 },
}

test('shows joined warnings for the longest of their durations', MIXED_DURATIONS, async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({
    context: 85,
    session: { kind: 'five_hour', percentUsed: 90 },
    week: { kind: 'seven_day', percentUsed: 10 },
  }))
  expect(toasts.map(t => t.timeoutMs)).toEqual([40_000])
})

// Measurements

test('warns on a context window usage change alone', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({ context: 90 }, ['context']))
  expect(toasts.map(t => t.text)).toEqual(['Context window usage reached 90%'])
})

test('warns on a usage limit change alone', async ($, on) => {
  const toasts = record(on)
  const session: SessionRateLimit = { kind: 'five_hour', percentUsed: 90 }
  await $.session.measure(measure({ session }, ['rateLimits']))
  expect(toasts.map(t => t.text)).toEqual(['5-hour session usage limit reached 90%'])
})

test('ignores measurements without a context window usage or usage limit change', async ($, on) => {
  const toasts = record(on)
  await $.session.measure(measure({ context: 90 }, ['cost']))
  expect(toasts).toEqual([])
})

test('forwards every measurement to the next hook in the chain', async ($, on) => {
  const seen: UsageUnit[][] = []
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => {
    seen.push(e.changed)
    return { changed: e.changed }
  })

  await $.session.measure(measure({ context: 90 }))
  await $.session.measure(measure({ context: 90 }, ['cost']))
  expect(seen).toEqual([['context', 'rateLimits'], ['cost']])
})
