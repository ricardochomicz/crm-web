<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    busy?: boolean
    drawer?: boolean
    size?: 'default' | 'medium' | 'wide' | 'full'
  }>(),
  { busy: false },
)
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const titleId = useId()
const descriptionId = useId()
let returnFocus: HTMLElement | null = null
watch(
  () => props.open,
  async (open) => {
    await nextTick()
    if (!dialog.value) return
    if (open && !dialog.value.open) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.value.showModal()
      dialog.value.querySelector<HTMLElement>('[data-initial-focus]')?.focus()
    } else if (!open && dialog.value.open) {
      dialog.value.close()
      if (returnFocus?.isConnected) returnFocus.focus()
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (dialog.value?.open) dialog.value.close()
  if (returnFocus?.isConnected) returnFocus.focus()
})
function requestClose() {
  if (!props.busy) emit('close')
}
</script>
<template>
  <Teleport to="body"
    ><dialog
      ref="dialog"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descriptionId : undefined"
      :aria-busy="busy"
      class="flex flex-col [&:not([open])]:hidden overflow-hidden border border-stone-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-sm"
      :class="
        drawer
          ? 'fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full max-w-2xl rounded-none'
          : size === 'full'
            ? 'm-auto h-[min(94dvh,1000px)] max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-[1500px] rounded-3xl'
            : size === 'wide'
              ? 'm-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl rounded-3xl'
              : size === 'medium'
                ? 'm-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl rounded-3xl'
                : 'm-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg rounded-3xl'
      "
      @cancel.prevent="requestClose"
    >
      <header
        class="shrink-0 flex items-start justify-between gap-5 border-b border-stone-100 px-6 py-5 sm:px-8"
      >
        <div>
          <h2 :id="titleId" class="text-xl font-semibold tracking-tight">{{ title }}</h2>
          <p v-if="description" :id="descriptionId" class="mt-3 text-sm leading-6 text-slate-500">
            {{ description }}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar janela"
          class="flex size-8 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-stone-100 disabled:opacity-40"
          :disabled="busy"
          @click="requestClose"
        >
          ×
        </button>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5 sm:px-8"><slot /></div>
      <div
        v-if="$slots.footer"
        class="shrink-0 border-t border-stone-200 bg-white px-6 py-4 sm:px-8"
      >
        <slot name="footer" />
      </div></dialog
  ></Teleport>
</template>
