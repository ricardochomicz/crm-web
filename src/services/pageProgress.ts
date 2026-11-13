import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false, minimum: 0.12, trickleSpeed: 180 })

const pending = new Set<string>()

/** Shared progress bar for route transitions and asynchronous page loads. */
export function startPageProgress(key: string) {
  pending.add(key)
  NProgress.start()
}

export function finishPageProgress(key: string) {
  pending.delete(key)
  if (pending.size === 0) NProgress.done()
}

export function clearPageProgress() {
  pending.clear()
  NProgress.done()
}
