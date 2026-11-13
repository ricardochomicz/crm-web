<script setup lang="ts">
defineProps<{
  query: string
  loading: boolean
  error: string
  hasResults: boolean
  hasRecent?: boolean
}>()
</script>
<template>
  <p v-if="query.trim().length < 2 && !hasRecent" class="py-3 text-sm text-slate-500">
    Digite pelo menos 2 caracteres para pesquisar.
  </p>
  <div v-else-if="loading" role="status" aria-live="polite" class="flex items-center gap-2 py-3 text-sm text-slate-500">
    <span class="size-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" aria-hidden="true" />
    Pesquisando...
  </div>
  <p v-else-if="error" role="alert" class="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">{{ error }}</p>
  <p v-else-if="query.trim().length >= 2 && !hasResults" role="status"
    class="py-5 text-center text-sm text-slate-500">Nenhum resultado encontrado.</p>
</template>
