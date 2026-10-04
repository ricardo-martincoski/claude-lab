import { test, expect } from 'claude-code/testing'

const measure = (percent?: number) => ({
  // window is required by the type; the plugin reads only percent
  context: { window: 200000, percent },
  rateLimits: [],
  changed: ['context' as const],
})

test('shows the context usage percentage in the status line', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => ({ changed: e.changed }))

  await $.session.measure(measure(42))
  expect(shown).toEqual(['42%'])
})

test('clears the status line while usage is unavailable', async ($, on) => {
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

test('does not warn below 80%', async ($, on) => {
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

test('warns only once while usage stays at or above 80%', async ($, on) => {
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

test('warns again after usage falls below 80%', async ($, on) => {
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

test('keeps the warning disarmed while usage is unavailable', async ($, on) => {
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

test('ignores measurements without a context usage change', async ($, on) => {
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

  await $.session.measure({ ...measure(90), changed: ['cost'] })
  expect(shown).toEqual([])
  expect(toasts).toEqual([])
})

test('warns when usage is exactly 80%', async ($, on) => {
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

test('forwards every measurement to the next hook in the chain', async ($, on) => {
  const seen: string[][] = []
  on('ui.status', async () => ({ value: undefined }))
  on('ui.toast', async () => ({ value: undefined }))
  on('session.measure', async (_$, e) => {
    seen.push(e.changed)
    return { changed: e.changed }
  })

  await $.session.measure(measure(42))
  await $.session.measure({ ...measure(42), changed: ['cost'] })
  expect(seen).toEqual([['context'], ['cost']])
})
