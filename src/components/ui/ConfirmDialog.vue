<script setup lang="ts">
import AppDialog from './AppDialog.vue'
withDefaults(defineProps<{ open: boolean; title: string; message: string; busy?: boolean; confirmLabel?: string; destructive?: boolean }>(), { busy: false, confirmLabel: 'Confirmar', destructive: false })
defineEmits<{ close: []; confirm: [] }>()
</script>
<template>
  <AppDialog :open="open" :title="title" :busy="busy" @close="$emit('close')">
    <p class="text-sm leading-6 text-slate-600">{{ message }}</p>
    <div class="mt-6 flex justify-end gap-2">
      <button type="button" class="secondary-button w-auto" :disabled="busy" @click="$emit('close')">Cancelar</button>
      <button type="button" :class="destructive ? 'rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800' : 'primary-button w-auto'" :disabled="busy" @click="$emit('confirm')">{{ busy ? 'Processando…' : confirmLabel }}</button>
    </div>
  </AppDialog>
</template>
