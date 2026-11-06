<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'

withDefaults(defineProps<{
  icon: 'eye' | 'edit' | 'trash' | 'users' | 'shield' | 'pause' | 'play' | 'user-x' | 'tag' | 'check' | 'search' | 'clear' | 'lock' | 'mail' | 'grid' | (string & {})
  label: string
  tone?: 'neutral' | 'danger' | 'success'
  disabled?: boolean
  busy?: boolean
  type?: 'button' | 'submit'
}>(), { tone: 'neutral', type: 'button' })
defineEmits<{ click: [event: MouseEvent] }>()

const button = ref<HTMLButtonElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)
const visible = ref(false)
const position = ref({ top: 0, left: 0 })
function close() { visible.value = false }
function reposition() {
  if (!button.value || !tooltip.value || !visible.value) return
  const rect = button.value.getBoundingClientRect()
  const width = tooltip.value.offsetWidth
  const height = tooltip.value.offsetHeight
  const margin = 8
  const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin))
  const top = rect.top >= height + margin * 2 ? rect.top - height - margin : rect.bottom + margin
  position.value = { top, left }
}
async function open() {
  if (!button.value || button.value.disabled) return
  visible.value = true
  await nextTick()
  reposition()
}
function onScroll() { close() }
function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape') close() }
onMounted(() => { window.addEventListener('scroll', onScroll, true); window.addEventListener('resize', close) })
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', close) })
</script>

<template>
  <button
    ref="button"
    :type="type"
    :aria-label="label"
    :disabled="disabled || busy"
    class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
    :class="tone === 'danger'
      ? 'border-red-100 text-red-600 hover:bg-red-50 focus-visible:outline-red-600'
      : tone === 'success'
        ? 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'
        : 'border-stone-200 text-slate-600 hover:border-slate-300 hover:bg-stone-100'"
    @mouseenter="open"
    @mouseleave="close"
    @focus="open"
    @blur="close"
    @click="close(); $emit('click', $event)"
  >
    <AppIcon :name="icon" class="size-[18px]" />
  </button>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="tooltip"
      role="tooltip"
      class="pointer-events-none fixed z-[9999] max-w-[min(22rem,calc(100vw-1rem))] rounded-md bg-slate-900 px-2.5 py-1.5 text-center text-xs font-medium text-white shadow-lg"
      :style="{ top: position.top + 'px', left: position.left + 'px' }"
    >{{ label }}</div>
  </Teleport>
</template>
