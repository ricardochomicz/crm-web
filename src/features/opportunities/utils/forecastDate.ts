/** Local calendar date in YYYY-MM-DD, without UTC timezone shifts. */
export function localToday(): string {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

/** Rejects impossible dates (such as February 30) as well as past dates. */
export function isValidFutureForecastDate(value: string, minimum = localToday()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(0)
  parsed.setFullYear(year, month - 1, day)
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day && value >= minimum
}
