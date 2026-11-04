import { describe, expect, it } from 'vitest'
import { authDestination, authLink } from '../navigation'
describe('Invitation continuation', () => {
  it('keeps a valid invitation token in the fragment across authentication', () => {
    const route = { query: { continue: 'invitation' }, hash: `#token=${'a'.repeat(64)}` }
    expect(authDestination(route)).toBe(`/convites${route.hash}`)
    expect(authLink('/register', route)).toEqual({
      path: '/register',
      query: { continue: 'invitation' },
      hash: route.hash,
    })
  })
  it('does not accept external redirects or malformed tokens', () => {
    expect(authDestination({ query: { continue: 'https://external.example' }, hash: '' })).toBe(
      '/app',
    )
    expect(authDestination({ query: { continue: 'invitation' }, hash: '#token=invalid' })).toBe(
      '/app',
    )
  })
})
