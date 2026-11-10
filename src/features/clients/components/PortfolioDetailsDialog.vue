<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { PortfolioContract } from '../api'

defineProps<{ open: boolean; record: PortfolioContract | null; mode: 'contracts' | 'orders' | 'renewing' }>()
defineEmits<{ close: [] }>()
const money = (value: string | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
function date(value: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return [day, month, year].join('/')
}
const statusNames: Record<PortfolioContract['status'], string> = {
  classification_required: 'Sem classificação', rule_required: 'Prazo não definido',
  activation_data_required: 'Verificar ativações', overdue: 'Prazo vencido',
  upcoming: 'Renovação próxima', waiting: 'Em vigência', policy_pending: 'Regra pendente',
}
</script>

<template>
  <AppDialog :open="open" :title="mode === 'contracts' ? 'Detalhes do contrato' : 'Detalhes do pedido histórico'" description="Informações comerciais e de renovação." size="wide" @close="$emit('close')">
    <div v-if="record" class="space-y-5">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">{{ record.client_name }}</h3>
        <p class="text-sm text-slate-500">{{ record.operator_name ?? 'Operadora não informada' }} · {{ record.classification_name ?? 'Sem classificação' }}</p>
        <p v-if="mode !== 'contracts' && record.order_code" class="mt-1 text-xs text-slate-500">Pedido: {{ record.order_code }}</p>
      </div>
      <div class="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-3">
        <div><p class="text-xs text-slate-500">Linhas</p><p class="font-semibold">{{ record.line_count }}</p></div>
        <div><p class="text-xs text-slate-500">Receita mensal</p><p class="font-semibold">{{ money(record.monthly_revenue) }}</p></div>
        <div><p class="text-xs text-slate-500">Situação</p><p class="font-semibold">{{ mode === 'renewing' ? 'Em renovação' : statusNames[record.status] }}</p></div>
        <div><p class="text-xs text-slate-500">Ativação média</p><p class="font-semibold">{{ date(record.average_activation_date) }}</p></div>
        <div><p class="text-xs text-slate-500">Prazo</p><p class="font-semibold">{{ record.renewal_months == null ? '—' : record.renewal_months + ' meses' }}</p></div>
        <div><p class="text-xs text-slate-500">Renovação prevista</p><p class="font-semibold">{{ date(record.renewal_date) }}</p></div>
      </div>
      <section v-if="mode === 'contracts'" class="space-y-2">
        <h4 class="font-semibold">Pedidos vinculados</h4>
        <p class="text-sm text-slate-600">{{ record.order_count ?? 0 }} pedido(s) vinculados a este contrato.</p>
        <p class="text-xs text-slate-500">O detalhamento individual das linhas do contrato consolidado ainda não é fornecido por esta consulta.</p>
      </section>
      <section v-else class="space-y-3">
        <h4 class="font-semibold">Linhas e serviços</h4>
        <div v-if="record.lines?.length" class="overflow-x-auto rounded-xl border border-stone-200">
          <table class="w-full min-w-[480px] text-left text-sm">
            <thead class="bg-stone-50 text-xs uppercase text-slate-500"><tr><th class="p-3">Número</th><th class="p-3">Descrição</th><th class="p-3 text-right">Quantidade</th></tr></thead>
            <tbody><tr v-for="line in record.lines" :key="line.id" class="border-t border-stone-100"><td class="p-3">{{ line.line_number || 'Pendente' }}</td><td class="p-3">{{ line.description || '—' }}</td><td class="p-3 text-right">{{ line.quantity }}</td></tr></tbody>
          </table>
        </div>
        <p v-else class="text-sm text-slate-500">Nenhuma linha disponível para este pedido.</p>
      </section>
    </div>
    <template #footer><div class="flex justify-end"><button type="button" class="secondary-button w-auto" @click="$emit('close')">Fechar</button></div></template>
  </AppDialog>
</template>
