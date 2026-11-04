<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
const props = withDefaults(
  defineProps<{ open: boolean; title: string; description?: string; busy?: boolean }>(),
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
      class="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-stone-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-sm"
      @cancel.prevent="requestClose"
    >
      <header class="flex items-start justify-between gap-5 px-6 pt-7 sm:px-8">
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
      <div class="px-6 pb-7 pt-6 sm:px-8"><slot /></div></dialog
  ></Teleport>
</template>
