<script setup lang="ts">
import ListTable from '@/components/ui/ListTable.vue'
import type { PortfolioContract } from '../api'

defineProps<{
  rows: PortfolioContract[]
  viewMode: 'contracts' | 'orders' | 'renewing'
}>()

const emit = defineEmits<{
  details: [contract: PortfolioContract]
  renew: [contract: PortfolioContract]
  opportunity: []
}>()

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const statuses: Record<PortfolioContract['status'], string> = {
  classification_required: 'Sem classificação',
  rule_required: 'Prazo não definido',
  activation_data_required: 'Verificar ativações',
  overdue: 'Prazo vencido',
  upcoming: 'Renovação próxima',
  waiting: 'Em vigência',
  policy_pending: 'Regra pendente',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}
</script>

<template>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="980px">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="p-4">Cliente</th>
              <th class="p-4">Operadora</th>
              <th class="p-4 text-right">Linhas</th>
              <th class="p-4 text-right">Receita mensal</th>
              <th class="p-4">Ativação média</th>
              <th class="p-4">Prazo</th>
              <th class="p-4">Renovação</th>
              <th class="p-4">Situação</th>
              <th class="p-4">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="contract in rows" :key="contract.contract_id ?? contract.order_id ?? contract.client_name" class="hover:bg-stone-50/70">
              <td class="p-4">
                <span class="font-semibold text-slate-800">{{ contract.client_name }}</span>

              </td>
              <td class="p-4">{{ contract.operator_name ?? '—' }}</td>
              <td class="p-4 text-right">{{ contract.line_count }}</td>
              <td class="p-4 text-right font-medium">{{ currency.format(Number(contract.monthly_revenue ?? 0)) }}</td>
              <td class="p-4">{{ formatDate(contract.average_activation_date) }}</td>
              <td class="p-4">{{ contract.renewal_months === null ? '—' : `${contract.renewal_months} meses` }}</td>
              <td class="p-4">{{ formatDate(contract.renewal_date) }}</td>
              <td class="p-4 text-sm">{{ viewMode === 'renewing' ? 'Em renovação' : statuses[contract.status] }}</td>
              <td class="p-4">
                <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50" @click="emit('details', contract)">Ver detalhes</button>
                <button v-if="viewMode === 'orders' && contract.status === 'overdue' && contract.order_id && !contract.renewal_opportunity_id"
                  type="button" class="primary-button w-auto whitespace-nowrap" @click="emit('renew', contract)">Renovar</button>
                <button v-else-if="viewMode === 'renewing' && contract.renewal_opportunity_id" type="button" class="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold" @click="emit('opportunity')">Ver oportunidade</button>
                </div>
              </td>
            </tr>
          </tbody>
        </ListTable>
        <p v-if="!rows.length" class="p-8 text-center text-sm text-slate-500">
          {{ viewMode === 'contracts' ? 'Nenhum contrato consolidado encontrado. Consulte Pedidos históricos para vincular os registros antigos.' : viewMode === 'renewing' ? 'Nenhum pedido com renovação em andamento.' : 'Nenhum pedido concluído encontrado para os filtros informados.' }}
        </p>
      </section>
</template>
