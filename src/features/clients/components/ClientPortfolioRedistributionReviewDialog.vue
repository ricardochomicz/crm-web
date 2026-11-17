<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'

defineProps<{
  open: boolean
  busy: boolean
  sourceName: string
  clients: { id: string; name: string; destinationName: string }[]
  distribution: { id: string; name: string; client_count: number; assigned: number }[]
}>()

const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <AppDialog
    :open="open"
    :busy="busy"
    size="wide"
    title="Conferência antes de confirmar"
    description="Revise os clientes e seus novos responsáveis antes de concluir a redistribuição."
    @close="emit('close')"
  >
    <div class="space-y-5">
      <p class="text-sm text-slate-600">
        Serão redistribuídos <strong>{{ clients.length }} {{ clients.length === 1 ? 'cliente' : 'clientes' }}</strong>
        de <strong>{{ sourceName }}</strong>. A operação é administrativa e não aplica a regra dos 90 dias.
      </p>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="member in distribution" :key="member.id" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p class="font-semibold">{{ member.name }}</p>
          <p class="mt-1 text-sm text-slate-600">
            Receberá {{ member.assigned }} {{ member.assigned === 1 ? 'cliente' : 'clientes' }}
            · Total previsto: {{ member.client_count + member.assigned }}
          </p>
        </div>
      </div>

      <div class="max-h-[min(42dvh,420px)] overflow-auto rounded-xl border border-stone-200">
        <table class="w-full min-w-[440px] text-left text-sm">
          <thead class="sticky top-0 z-10 bg-stone-50">
            <tr><th scope="col" class="p-3">Cliente</th><th scope="col" class="p-3">Novo responsável</th></tr>
          </thead>
          <tbody>
            <tr v-for="client in clients" :key="client.id" class="border-t border-stone-100">
              <td class="p-3">{{ client.name }}</td>
              <td class="p-3">{{ client.destinationName }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-sm text-amber-800">
        A confirmação atualiza os responsáveis e transfere as oportunidades abertas, com registro em auditoria.
        Oportunidades encerradas, pedidos, contratos e comissões anteriores permanecem preservados.
        A operação será bloqueada se houver vínculos comerciais inconsistentes.
      </p>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <button type="button" class="secondary-button w-auto" :disabled="busy" @click="emit('close')">
          Voltar e ajustar
        </button>
        <button type="button" class="primary-button w-auto" :disabled="busy" @click="emit('confirm')">
          {{ busy ? 'Redistribuindo...' : 'Confirmar redistribuição' }}
        </button>
      </div>
    </template>
  </AppDialog>
</template>
