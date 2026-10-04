// Each plugin that needs format.ts keeps its own identical copy of it and of these tests, since
// plugins cannot share files.

import { test, expect } from 'claude-code/testing'
import { day, time } from './format'

// Dates are built from local date parts, so the expected text does not depend on the machine's
// time zone.

test('writes the time with two-digit hours and minutes', () => {
  expect(time(new Date(2026, 9, 4, 7, 5))).toBe('07:05')
})

test('writes afternoon times in 24-hour form', () => {
  expect(time(new Date(2026, 9, 4, 21, 50))).toBe('21:50')
})

test('writes midnight as 00:00', () => {
  expect(time(new Date(2026, 9, 5, 0, 0))).toBe('00:00')
})

test('writes the date with two-digit months and days', () => {
  expect(day(new Date(2026, 0, 5, 7, 0))).toBe('Mon 2026-01-05 07:00')
})

test('writes December as month 12', () => {
  expect(day(new Date(2026, 11, 31, 23, 59))).toBe('Thu 2026-12-31 23:59')
})

test('writes the abbreviated English weekday', () => {
  const week = [4, 5, 6, 7, 8, 9, 10].map(d => day(new Date(2026, 9, d, 7, 0)).split(' ')[0])
  expect(week).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
})

test('converts a UTC timestamp to the local date and time', () => {
  const local = new Date(2026, 9, 10, 7, 0)
  expect(day(new Date(local.toISOString()))).toBe('Sat 2026-10-10 07:00')
})
