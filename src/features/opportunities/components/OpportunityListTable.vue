<script setup lang="ts">
import ListTable from '@/components/ui/ListTable.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import type { Opportunity } from '../api'
import { opportunityAgeClass, opportunityAgeLabel } from '../utils/opportunityAge'

defineProps<{
  rows: Opportunity[]
  section: 'open' | 'closed'
  canEdit: boolean
  recoveringId: string | null
  displayOrderType: (item: Opportunity) => string
  money: (value: string) => string
}>()

const emit = defineEmits<{
  schedule: [item: Opportunity]
  history: [item: Opportunity]
  edit: [item: Opportunity]
  recover: [item: Opportunity]
  'confirm-sale': [item: Opportunity]
  'mark-lost': [item: Opportunity]
}>()
</script>

<template>
    <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <ListTable min-width="750px">
        <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>
          <th class="p-4">Oportunidade</th><th class="p-4">Cliente</th><th class="p-4">Tipo</th><th class="p-4">Previsão</th><th class="p-4">Valor mensal</th><th v-if="section === 'closed'" class="p-4">Encerramento / motivo</th><th class="p-4">Ações</th>
        </tr></thead>
        <tbody><tr v-for="item in rows" :key="item.id" class="border-t border-stone-100 hover:bg-stone-50/70">
          <td class="p-4"><p class="font-semibold text-slate-800">{{ item.title }}</p><p class="text-xs text-slate-500">{{ item.code }}</p></td>
          <td class="p-4">{{ item.client?.company_name ?? '—' }}</td>
          <td class="p-4">{{ displayOrderType(item) }}</td>
          <td class="p-4">
              <div class="flex flex-wrap items-center gap-2">
                <span>{{ item.expected_close_at ? item.expected_close_at.slice(0, 10).split('-').reverse().join('/') : '—' }}</span>
                <span
                  v-if="item.status === 'open' && item.expected_close_at && item.expected_close_at.slice(0, 10) < new Date().toISOString().slice(0, 10)"
                  class="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                >
                  Atrasada
                </span>
              </div>
              <small
                v-if="opportunityAgeLabel(item.created_at)"
                class="mt-1 block text-xs"
                :class="opportunityAgeClass(item.created_at)"
              >
                {{ opportunityAgeLabel(item.created_at) }}
              </small>
            </td>
          <td class="p-4 font-semibold">{{ money(item.estimated_monthly_amount) }}</td>
          <td v-if="section === 'closed'" class="p-4 text-sm">
            <span class="rounded-md px-2 py-1 text-xs font-semibold" :class="item.status === 'won' ? 'bg-emerald-50 text-emerald-700' : item.status === 'lost' ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-slate-600'">{{ item.status === 'won' ? 'Ganha' : item.status === 'lost' ? 'Perdida' : 'Cancelada' }}</span>
            <p class="mt-2 text-xs text-slate-500">{{ item.closed_at ? item.closed_at.slice(0, 10).split('-').reverse().join('/') : '—' }}</p>
            <p v-if="item.lost_reason" class="mt-1 max-w-64 text-xs text-slate-600">{{ item.lost_reason }}</p>
          </td>
          <td class="p-4">
            <div class="flex items-center gap-2">
              <TableActionButton v-if="section === 'open' && canEdit && item.status === 'open'" icon="calendar" :label="`Agendar atividade para ${item.title}`" @click="emit('schedule', item)" />
              <TableActionButton icon="message-square" :label="`Histórico de ${item.title}`" @click="emit('history', item)" />
              <TableActionButton v-if="section === 'open' && canEdit && item.status === 'open'" icon="edit" :label="`Editar ${item.title}`" @click="emit('edit', item)" />
              <button v-if="canEdit && section === 'closed' && item.status === 'lost'" type="button" class="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100" :disabled="!!recoveringId" @click="emit('recover', item)">{{ recoveringId === item.id ? 'Recuperando…' : 'Recuperar negociação' }}</button>
              <button v-if="section === 'open' && canEdit && item.status === 'open'" type="button" class="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100" @click="emit('confirm-sale', item)">Confirmar venda</button>
              <button v-if="section === 'open' && canEdit && item.status === 'open'" type="button" class="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100" @click="emit('mark-lost', item)">Venda perdida</button>
            </div>
          </td>
        </tr></tbody>
      </ListTable>
      <p v-if="!rows.length" class="p-6 text-center text-sm text-slate-500">Nenhuma oportunidade encontrada.</p>
    </section>
</template>
