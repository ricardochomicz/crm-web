<script setup lang="ts">
import { ref } from 'vue'
import type { ContractRenewal } from '../api'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import ListTable from '@/components/ui/ListTable.vue'

defineProps<{
  contracts: ContractRenewal[]
  classifications: { id: number; operator_id: number; name: string; is_active: boolean }[]
  writable: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  assign: [orderId: string, classificationId: number]
}>()

const selections = ref<Record<string, number | null>>({})

const labels: Record<ContractRenewal['status'], string> = {
  classification_required: 'Classificação pendente',
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
      <ListTable min-width="780px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="p-4">Pedido</th>
            <th class="p-4">Operadora</th>
            <th class="p-4">Linhas</th>
            <th class="p-4">Ativação média</th>
            <th class="p-4">Prazo</th>
            <th class="p-4">Previsão</th>
            <th class="p-4">Situação</th>
            <th v-if="writable" class="p-4">Classificação</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="contract in contracts" :key="contract.order_id">
            <td class="p-4 font-medium">{{ contract.order_code ?? contract.order_id.slice(0, 8) }}</td>
            <td class="p-4">{{ contract.operator_name ?? '—' }}</td>
            <td class="p-4">{{ contract.line_count }}</td>
            <td class="p-4">{{ date(contract.average_activation_date) }}</td>
            <td class="p-4">{{ contract.renewal_months === null ? '—' : `${contract.renewal_months} meses` }}</td>
            <td class="p-4 font-semibold">{{ date(contract.renewal_date) }}</td>
            <td class="p-4 text-sm">{{ labels[contract.status] }}</td>
            <td v-if="writable" class="p-4">
              <div class="flex min-w-52 items-center gap-2">
                <SearchSelect
                  :model-value="selections[contract.order_id] ?? contract.classification_id ?? ''"
                  :options="[
                    { value: '', label: 'Selecione' },
                    ...classifications
                      .filter((item) => item.is_active && item.operator_id === contract.operator_id)
                      .map((item) => ({ value: item.id, label: item.name })),
                  ]"
                  @update:model-value="selections[contract.order_id] = Number($event) || null"
                />
                <button
                  type="button"
                  class="secondary-button"
                  :disabled="busy || !(selections[contract.order_id] ?? contract.classification_id)"
                  @click="emit('assign', contract.order_id, Number(selections[contract.order_id] ?? contract.classification_id))"
                >Salvar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </ListTable>
      <p v-if="!contracts.length" class="p-6 text-center text-sm text-slate-500">
        Nenhum pedido concluído vinculado a este cliente.
      </p>
    </div>
  </section>
</template>
