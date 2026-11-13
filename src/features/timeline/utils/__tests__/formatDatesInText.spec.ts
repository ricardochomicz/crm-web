import { describe, expect, it } from 'vitest'
import { formatDatesInText } from '../formatDatesInText'

describe('formatDatesInText', () => {
  it('formats multiple forecast dates in a timeline comment', () => {
    expect(formatDatesInText('Previsão alterada de 2026-11-07 para 2026-11-15.'))
      .toBe('Previsão alterada de 07/11/2026 para 15/11/2026.')
  })

  it('keeps invalid calendar dates and ordinary content unchanged', () => {
    expect(formatDatesInText('Data 2026-02-30. Código OP-20261113.'))
      .toBe('Data 2026-02-30. Código OP-20261113.')
  })
})
