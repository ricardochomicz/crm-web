<script setup lang="ts">
import { computed } from 'vue'
import type { OpportunityInput } from '../api'
import type { OrderType } from '@/features/order-types/api'
const props = defineProps<{ form: OpportunityInput; orderTypes: OrderType[] }>()
const lineCount = computed(() => props.form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
const totalMonthly = computed(() => props.form.items.reduce((sum, item) => sum + Number(item.monthly_unit_amount || 0) * Number(item.quantity || 0), 0))

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const receiptGroups = computed(() => {
  const groups = new Map<string, { name: string; count: number; total: number }>()
  for (const item of props.form.items) {
    const key = item.order_type_id + ':' + item.product_id + ':' + item.monthly_unit_amount
    const name = (props.orderTypes.find(type => type.id === item.order_type_id)?.name ?? 'Tipo anterior') + ' · ' + item.description
    const group = groups.get(key) ?? { name, count: 0, total: 0 }
    group.count += Number(item.quantity)
    group.total += Number(item.monthly_unit_amount) * Number(item.quantity)
    groups.set(key, group)
  }
  return [...groups.entries()].map(([key, group]) => ({ key, ...group }))
})
</script>
<template>
        <aside class="min-w-0 xl:sticky xl:top-0 xl:self-start" aria-label="Resumo da oportunidade">
          <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div class="border-b border-dashed border-stone-300 bg-slate-900 px-5 py-5 text-white">
              <p class="text-xs font-semibold uppercase tracking-widest text-slate-300">Resumo comercial</p>
              <h3 class="mt-2 text-xl font-semibold">Sua oportunidade</h3>
              <p class="mt-1 text-xs text-slate-300">{{ form.code || 'Sem código' }} · {{ lineCount }} linha(s)/serviço(s)</p>
            </div>
            <div class="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-4">
              <p v-if="!receiptGroups.length" class="py-8 text-center text-sm text-slate-400">Os lotes aparecerão aqui.</p>
              <div v-for="group in receiptGroups" :key="group.key" class="flex justify-between gap-3 border-b border-dashed border-stone-200 pb-3 text-sm">
                <div><strong>{{ group.name }}</strong><p class="text-xs text-slate-500">{{ group.count }} linha(s)</p></div>
                <strong>{{ money(group.total) }}</strong>
              </div>
            </div>
            <div class="space-y-3 border-t border-dashed border-stone-300 bg-stone-50 px-5 py-5">
              <div class="flex justify-between text-sm text-slate-600"><span>Quantidade</span><strong>{{ lineCount }}</strong></div>
             
              <div class="border-t border-stone-200 pt-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total mensal estimado</p>
                <p class="mt-1 text-3xl font-bold tracking-tight text-slate-900">{{ money(totalMonthly) }}</p>
              </div>
              <p class="text-xs text-slate-500">Valores estimados, sujeitos à confirmação da negociação.</p>
            </div>
          </div>
        </aside>

</template>