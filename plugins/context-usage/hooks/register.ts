import type { Register } from 'claude-code'

const WARN_AT = 80
const TOAST_MS = 30_000

export const register: Register = on => {
  // Re-armed when usage falls below WARN_AT (e.g. after a compaction).
  let warned = false

  on('session.measure', ($, e, next) => {
    if (!e.changed.includes('context')) return next(e)

    const { percent } = e.context
    $.ui.status(percent === undefined ? undefined : `${percent}%`)

    if (percent !== undefined && percent >= WARN_AT && !warned) {
      warned = true
      $.ui.toast(`Context window usage reached ${percent}%`, { timeoutMs: TOAST_MS })
    } else if (percent !== undefined && percent < WARN_AT) {
      warned = false
    }

    return next(e)
  })
}
