<script setup lang="ts">
defineProps<{ page: number; lastPage: number; total: number; busy?: boolean }>()
defineEmits<{ change: [page: number] }>()
</script>
<template>
  <nav
    v-if="lastPage > 1"
    aria-label="Paginação"
    class="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm"
  >
    <p class="text-slate-500">Página {{ page }} de {{ lastPage }} · {{ total }} resultados</p>
    <div class="flex gap-2">
      <button
        class="secondary-button"
        :disabled="busy || page <= 1"
        @click="$emit('change', page - 1)"
      >
        Anterior</button
      ><button
        class="secondary-button"
        :disabled="busy || page >= lastPage"
        @click="$emit('change', page + 1)"
      >
        Próxima
      </button>
    </div>
  </nav>
</template>
