/** Present ISO calendar dates in narrative text without changing stored comments. */
export function formatDatesInText(text: string): string {
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (original, year: string, month: string, day: string) => {
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) {
      return original
    }
    return `${day}/${month}/${year}`
  })
}
