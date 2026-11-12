<script setup lang="ts">
import { ref, watch } from 'vue'
import { productivityApi, type GoalConfiguration } from '../api'

const props = defineProps<{ tenantId: string; from: string; to: string; consultantId?: string }>()
const goals = ref<GoalConfiguration[]>([])
const loading = ref(false)
const error = ref('')
let version = 0

watch(() => [props.tenantId, props.from, props.to, props.consultantId] as const, async () => {
  const current = ++version
  goals.value = []
  if (!props.tenantId || !props.from || !props.to) return
  loading.value = true
  error.value = ''
  try {
    const response = await productivityApi.goalConfigurations(props.tenantId, {
      from: props.from, to: props.to, ...(props.consultantId ? { consultant_id: props.consultantId } : {}),
    })
    if (current === version) goals.value = response.data
  } catch {
    if (current === version) error.value = 'Não foi possível consultar as configurações de metas.'
  } finally {
    if (current === version) loading.value = false
  }
}, { immediate: true })

const date = (value: string | null) => value ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem término'
</script>

<template>
  <section class="rounded-xl border border-stone-200 bg-white p-5">
    <h2 class="font-semibold text-slate-800">Configurações de metas vigentes</h2>
    <p class="mt-1 text-sm text-slate-500">Faixas cadastradas para cálculo de incentivos. Não representam, por si só, uma meta mensal individual.</p>
    <p v-if="loading" class="mt-3 text-sm text-slate-500">Carregando configurações…</p>
    <p v-else-if="error" role="alert" class="mt-3 text-sm text-red-700">{{ error }}</p>
    <p v-else-if="!goals.length" class="mt-3 text-sm text-slate-500">Nenhuma configuração vigente encontrada para o período.</p>
    <div v-else class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[650px] text-left text-sm">
        <thead class="bg-stone-50 text-xs text-slate-600"><tr><th class="p-3">Abrangência</th><th class="p-3">Tipo</th><th class="p-3">Métrica</th><th class="p-3">Vigência</th><th class="p-3">Faixas</th></tr></thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="goal in goals" :key="goal.id">
            <td class="p-3">{{ goal.target_scope === 'COMPANY' ? 'Empresa' : 'Consultor' }}</td>
            <td class="p-3">{{ goal.order_type }}</td>
            <td class="p-3">{{ goal.metric === 'REVENUE' ? 'Receita' : 'Quantidade' }}</td>
            <td class="p-3">{{ date(goal.starts_on) }} – {{ date(goal.ends_on) }}</td>
            <td class="p-3">{{ goal.tiers.length }} faixa(s)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
