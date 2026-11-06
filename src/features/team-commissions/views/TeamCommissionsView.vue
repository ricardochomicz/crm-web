<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import TeamCommissionForm from '../components/TeamCommissionForm.vue'
import { useTeamCommissions } from '../composables/useTeamCommissions'
const {tenant,rows,operators,orderTypes,roles,loading,busy,error,writable,editingId,modalOpen,form,label,edit,load,save} = useTeamCommissions()
</script>
<template>
 <AppShell :tenant="tenant" title="Comissões da equipe" subtitle="Regras de repasse sobre o valor dos contratos">
  <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
   <div><p class="eyebrow">GERENCIAL</p><h1 class="mt-3 text-3xl font-semibold">Comissões da equipe</h1><p class="mt-2 text-sm text-slate-500">Percentuais por operadora, tipo de pedido e papel comercial.</p></div>
   <button v-if="writable" type="button" class="primary-button w-auto" @click="edit()">+ Nova regra</button>
  </header>
  <AsyncNotice :loading="loading" :error="error" @retry="load"/>
  <section v-if="!loading && !error" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
   <div class="overflow-x-auto"><table class="w-full min-w-[860px] text-left text-sm">
    <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th class="px-4 py-4">Operadora</th><th class="px-4 py-4">Tipo de pedido</th><th class="px-4 py-4">Papel</th><th class="px-4 py-4 text-right">Comissão</th><th class="px-4 py-4">Vigência</th><th class="px-4 py-4">Situação</th><th v-if="writable" class="px-4 py-4">Ações</th></tr></thead>
    <tbody class="divide-y divide-stone-100"><tr v-for="row in rows" :key="row.id">
     <td class="px-4 py-4">{{ row.operator?.name }}</td><td class="px-4 py-4">{{ label(orderTypes,row.order_type) }}</td><td class="px-4 py-4">{{ label(roles,row.commercial_role) }}</td>
     <td class="px-4 py-4 text-right font-semibold">{{ Number(row.percentage).toLocaleString('pt-BR') }}%</td>
     <td class="px-4 py-4">{{ row.starts_on }} até {{ row.ends_on ?? 'indeterminado' }}</td>
     <td class="px-4 py-4">{{ row.is_active ? 'Ativa' : 'Inativa' }}</td>
     <td v-if="writable" class="px-4 py-4"><button type="button" class="rounded-lg border px-3 py-1.5 hover:border-orange-300" @click="edit(row)">Editar</button></td>
    </tr></tbody>
   </table></div>
   <p v-if="!rows.length" class="px-5 py-8 text-sm text-slate-500">Nenhuma regra de comissão cadastrada.</p>
  </section>
  <div v-if="modalOpen && writable" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <TeamCommissionForm v-model="form" :operators="operators" :order-types="orderTypes" :roles="roles" :busy="busy" :editing="!!editingId" @submit="save" @cancel="modalOpen = false"/>
  </div>
 </AppShell>
</template>
