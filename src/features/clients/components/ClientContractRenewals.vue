<script setup lang="ts">
import type { ContractRenewal } from '../api'
import ListTable from '@/components/ui/ListTable.vue'

const props = defineProps<{
  contracts: ContractRenewal[]
}>()

const labels: Record<ContractRenewal['status'], string> = {
  classification_required: 'Classificação do cliente pendente',
  rule_required: 'Prazo não configurado',
  activation_data_required: 'Ativações incompletas',
  overdue: 'Prazo atingido',
  upcoming: 'Próxima renovação',
  waiting: 'Aguardando prazo',
}

function date(value: string | null): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}
</script>

<template>
  <section class="space-y-4">
    <div>
      <h3 class="text-lg font-semibold text-slate-800">Renovação integral dos contratos</h3>
      <p class="mt-1 text-sm text-slate-500">
        Previsões calculadas pela média das datas de ativação de todas as linhas do pedido concluído.
      </p>
    </div>

    <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <ListTable min-width="900px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="p-4">Pedido</th>
            <th class="p-4">Tipo do pedido</th>
            <th class="p-4">Operadora</th>
            <th class="p-4">Linhas</th>
            <th class="p-4">Ativação média</th>
            <th class="p-4">Prazo</th>
            <th class="p-4">Previsão</th>
            <th class="p-4">Situação</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="contract in contracts" :key="contract.order_id">
            <td class="p-4 font-medium">{{ contract.order_code ?? contract.order_id.slice(0, 8) }}</td>
            <td class="p-4">{{ contract.order_type ?? '—' }}</td>
            <td class="p-4">{{ contract.operator_name ?? '—' }}</td>
            <td class="p-4">{{ contract.line_count }}</td>
            <td class="p-4">{{ date(contract.average_activation_date) }}</td>
            <td class="p-4">{{ contract.renewal_months === null ? '—' : `${contract.renewal_months} meses` }}</td>
            <td class="p-4 font-semibold">{{ date(contract.renewal_date) }}</td>
            <td class="p-4 text-sm">{{ labels[contract.status] }}</td>
          </tr>
        </tbody>
      </ListTable>
      <p v-if="!contracts.length" class="p-6 text-center text-sm text-slate-500">
        Nenhum pedido concluído vinculado a este cliente.
      </p>
    </div>
  </section>
</template>
