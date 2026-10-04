// Each plugin that needs format.ts keeps its own identical copy, since plugins cannot share
// files.

// Reset times as the plugins write them, in the local time zone.

const pad = (n: number) => String(n).padStart(2, '0')

// 24-hour time: 07:05, 21:50.
export const time = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

// Weekday, ISO date and 24-hour time: Sat 2026-10-10 07:00.
export const day = (d: Date) => {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${weekday} ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time(d)}`
}
