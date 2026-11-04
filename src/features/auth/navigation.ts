import type { RouteLocationNormalizedLoaded, RouteLocationNormalized } from 'vue-router'
type AuthLocation = Pick<RouteLocationNormalizedLoaded | RouteLocationNormalized, 'query' | 'hash'>
export function authDestination(route: AuthLocation): string {
  if (route.query.continue === 'invitation' && /^#token=[A-Za-z0-9]{64}$/.test(route.hash))
    return `/convites${route.hash}`
  return '/app'
}
export function authLink(path: string, route: AuthLocation) {
  return authDestination(route) !== '/app'
    ? { path, query: { continue: 'invitation' }, hash: route.hash }
    : { path }
}
