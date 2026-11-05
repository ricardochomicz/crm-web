import { reactive } from 'vue'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'
export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
  duration: number
}
export const toastItems = reactive<ToastItem[]>([])
let nextId = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function dismiss(id: number) {
  const index = toastItems.findIndex((item) => item.id === id)
  if (index >= 0) toastItems.splice(index, 1)
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
}
function schedule(item: ToastItem) {
  if (item.duration > 0) timers.set(item.id, setTimeout(() => dismiss(item.id), item.duration))
}
function show(kind: ToastKind, message: string, duration = kind === 'error' ? 0 : 4000) {
  if (!message.trim()) return
  if (toastItems.some((item) => item.kind === kind && item.message === message)) return
  const item = { id: ++nextId, kind, message, duration }
  if (toastItems.length >= 4) dismiss(toastItems[0]!.id)
  toastItems.push(item)
  schedule(item)
}
export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
  warning: (message: string) => show('warning', message),
  dismiss,
  pause(id: number) {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
  },
  resume(id: number) {
    const item = toastItems.find((entry) => entry.id === id)
    if (item && !timers.has(id)) schedule(item)
  },
}
