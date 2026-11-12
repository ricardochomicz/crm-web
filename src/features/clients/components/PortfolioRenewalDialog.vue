<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { PortfolioContract } from '../api'

defineProps<{
  contract: PortfolioContract | null
  busy: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <AppDialog
    :open="contract !== null"
    title="Renovar contrato"
    :busy="busy"
    @close="emit('close')"
  >
    <template v-if="contract">
      <p class="text-sm leading-6 text-slate-600">
        Deseja iniciar a renovação do contrato de
        <strong>{{ contract.client_name }}</strong>
        com
        <strong>
          {{ contract.line_count }}
          {{ contract.line_count === 1 ? 'linha' : 'linhas' }}
        </strong>?
      </p>

      <p class="mt-3 text-sm leading-6 text-slate-500">
        Uma nova oportunidade será criada com todas as linhas e os dados comerciais
        do pedido original. As datas de ativação não serão copiadas.
      </p>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="secondary-button w-auto"
          :disabled="busy"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="primary-button w-auto"
          :disabled="busy || !contract.lines?.length"
          @click="emit('confirm')"
        >
          {{ busy ? 'Criando...' : 'Criar oportunidade' }}
        </button>
      </div>
    </template>
  </AppDialog>
</template>
