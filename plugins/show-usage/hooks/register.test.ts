import { test, expect } from 'claude-code/testing'
import type { SessionRateLimit, UsageUnit } from 'claude-code'

// Reset times are built from local date parts, so the expected text does not depend on the
// machine's time zone.
const SESSION_RESET = new Date(2026, 9, 4, 21, 50).toISOString()
const WEEK_RESET = new Date(2026, 9, 10, 7, 0).toISOString()

const measure = (
  percent?: number,
  rateLimits: SessionRateLimit[] = [],
  changed: UsageUnit[] = ['context'],
) => ({
  // window is required by the type; the plugin reads only percent
  context: { window: 200000, percent },
  rateLimits,
  changed,
})

const limits = (rateLimits: SessionRateLimit[], changed: UsageUnit[] = ['rateLimits']) =>
  measure(undefined, rateLimits, changed)

// Status line

test('shows the context usage percentage in the status line', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure(42))
  expect(shown).toEqual(['context 42%'])
})

test('clears the status line while neither context usage nor usage limits are available', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure())
  expect(shown).toEqual([undefined])
})

test('shows context usage and both usage limits with their reset times', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure(18, [
    { kind: 'five_hour', percentUsed: 16, resetsAt: SESSION_RESET },
    { kind: 'seven_day', percentUsed: 3, resetsAt: WEEK_RESET },
  ]))
  expect(shown).toEqual(['context 18% | session 16% [21:50] | week 3% [Sat 2026-10-10 07:00]'])
})

test('shows the session limit before the weekly limit', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(limits([
    { kind: 'seven_day', percentUsed: 3 },
    { kind: 'five_hour', percentUsed: 16 },
  ]))
  expect(shown).toEqual(['session 16% | week 3%'])
})

test('omits context usage while it is unavailable', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(limits([{ kind: 'five_hour', percentUsed: 16, resetsAt: SESSION_RESET }]))
  expect(shown).toEqual(['session 16% [21:50]'])
})

test('omits the reset time when it is unavailable', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(limits([{ kind: 'five_hour', percentUsed: 16 }]))
  expect(shown).toEqual(['session 16%'])
})

test('rounds the usage limit percentage', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(limits([{ kind: 'seven_day', percentUsed: 23.5 }]))
  expect(shown).toEqual(['week 24%'])
})

test('ignores other kinds of usage limits', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(limits([
    { kind: 'spend_limit', percentUsed: 50 },
    { kind: 'five_hour', percentUsed: 16 },
  ]))
  expect(shown).toEqual(['session 16%'])
})

test('updates on a usage limit change alone', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure(18, [{ kind: 'five_hour', percentUsed: 16 }], ['rateLimits']))
  expect(shown).toEqual(['context 18% | session 16%'])
})

// Context usage warning

test('does not warn while context usage is below 80%', async ($, on) => {
  const toasts: string[] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  for (const p of [50, 79]) await $.session.measure(measure(p))
  expect(toasts).toEqual([])
})

test('warns when context usage is exactly 80%', async ($, on) => {
  const toasts: string[] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure(80))
  expect(toasts).toEqual(['Context window usage reached 80%'])
})

test('warns only once while context usage stays at or above 80%', async ($, on) => {
  const toasts: string[] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  for (const p of [81, 85, 90]) await $.session.measure(measure(p))
  expect(toasts).toEqual(['Context window usage reached 81%'])
})

test('warns again after context usage falls below 80%', async ($, on) => {
  const toasts: string[] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  for (const p of [85, 20, 83]) await $.session.measure(measure(p))
  expect(toasts).toEqual(['Context window usage reached 85%', 'Context window usage reached 83%'])
})

test('keeps the warning disarmed while context usage is unavailable', async ($, on) => {
  const toasts: string[] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  for (const p of [85, undefined, 85]) await $.session.measure(measure(p))
  expect(toasts).toEqual(['Context window usage reached 85%'])
})

test('shows the warning for 30 seconds', async ($, on) => {
  const timeouts: (number | undefined)[] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async (_$, e) => {
    timeouts.push(e.timeoutMs)
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure(85))
  expect(timeouts).toEqual([30_000])
})

// Measurements

test('ignores measurements without a context usage or usage limit change', async ($, on) => {
  const shown: (string | undefined)[] = []
  const toasts: string[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure(90, [{ kind: 'five_hour', percentUsed: 16 }], ['cost']))
  expect(shown).toEqual([])
  expect(toasts).toEqual([])
})

test('forwards every measurement to the next hook in the chain', async ($, on) => {
  const seen: UsageUnit[][] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => {
    seen.push(e.changed)
    return { changed: e.changed }
  })

  await $.session.measure(measure(42))
  await $.session.measure(measure(42, [], ['cost']))
  expect(seen).toEqual([['context'], ['cost']])
})
