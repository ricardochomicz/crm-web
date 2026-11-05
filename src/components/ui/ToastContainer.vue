<script setup lang="ts">
import { toast, toastItems, type ToastKind } from '@/services/toast'

const labels: Record<ToastKind, string> = {
  success: 'Sucesso',
  error: 'Erro',
  info: 'Informação',
  warning: 'Atenção',
}
const styles: Record<ToastKind, string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-blue-300 bg-blue-50 text-blue-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
}
</script>
<template>
  <div class="pointer-events-none fixed inset-x-3 top-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:w-96" aria-label="Notificações">
    <div
      v-for="item in toastItems"
      :key="item.id"
      :role="item.kind === 'error' || item.kind === 'warning' ? 'alert' : 'status'"
      :class="styles[item.kind]"
      class="pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg"
      @mouseenter="toast.pause(item.id)"
      @mouseleave="toast.resume(item.id)"
      @focusin="toast.pause(item.id)"
      @focusout="toast.resume(item.id)"
    >
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">{{ labels[item.kind] }}</p>
        <p class="mt-1 break-words text-sm">{{ item.message }}</p>
      </div>
      <button type="button" class="rounded p-1 text-lg leading-none hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2" :aria-label="`Fechar notificação: ${labels[item.kind]}`" @click="toast.dismiss(item.id)">×</button>
    </div>
  </div>
</template>
