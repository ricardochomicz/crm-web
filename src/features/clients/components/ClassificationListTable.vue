<script setup lang="ts">
import ListTable from '@/components/ui/ListTable.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import type { Classification, RenewalRule } from '../api'

const props = withDefaults(defineProps<{
  rows: Classification[]
  mode: 'tenant' | 'admin'
  tenantId?: string
  writable?: boolean
  busy?: boolean
}>(), { writable: false, busy: false })
const emit = defineEmits<{
  edit: [classification: Classification]
  addRule: [classification: Classification]
  editRule: [classification: Classification, rule: RenewalRule]
}>()

function effectiveRule(classification: Classification): RenewalRule | undefined {
  if (props.mode === 'tenant') {
    return classification.rules.find(rule => rule.tenant_id === props.tenantId && rule.is_active)
      ?? classification.rules.find(rule => rule.is_active)
  }
  return classification.rules.find(rule => rule.is_active && !rule.valid_until)
    ?? classification.rules.find(rule => rule.is_active)
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
    <ListTable min-width="650px" :busy="busy">
      <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" class="px-5 py-4">Operadora</th>
          <th scope="col" class="px-5 py-4">Classificação</th>
          <th v-if="mode === 'tenant'" scope="col" class="px-5 py-4">Origem</th>
          <th scope="col" class="px-5 py-4">Prazo de renovação</th>
          <th v-if="mode === 'admin'" scope="col" class="px-5 py-4">Regras</th>
          <th scope="col" class="px-5 py-4 text-right">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-for="classification in rows" :key="classification.id" class="hover:bg-stone-50/70">
          <td class="px-5 py-4">{{ classification.operator?.name ?? '—' }}</td>
          <td class="px-5 py-4 font-semibold text-slate-800">{{ classification.name }}</td>
          <td v-if="mode === 'tenant'" class="px-5 py-4">{{ classification.tenant_id ? 'Empresa' : 'Global' }}</td>
          <td class="px-5 py-4">{{ effectiveRule(classification)?.minimum_months ?? '—' }}{{ effectiveRule(classification) ? ' meses' : '' }}</td>
          <td v-if="mode === 'admin'" class="px-5 py-4">
            <div v-for="rule in classification.rules" :key="rule.id" class="flex items-center gap-2 py-1">
              <span>{{ rule.minimum_months }} meses · {{ rule.valid_from }} até {{ rule.valid_until ?? 'indeterminado' }}</span>
              <TableActionButton icon="edit" :label="`Editar regra de ${classification.code}`" :busy="busy" @click="emit('editRule', classification, rule)" />
            </div>
          </td>
          <td class="whitespace-nowrap px-5 py-4 text-right">
            <div class="flex justify-end gap-2">
              <TableActionButton
                v-if="mode === 'admin' || (writable && !!classification.tenant_id)"
                icon="edit"
                :label="`Editar ${classification.name}`"
                :busy="busy"
                @click="emit('edit', classification)"
              />
              <TableActionButton
                v-if="mode === 'admin' || writable"
                icon="tag"
                :label="`Nova regra para ${classification.name}`"
                :busy="busy"
                @click="emit('addRule', classification)"
              />
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="5" class="px-5 py-12 text-center text-sm text-slate-500">
            Nenhuma classificação encontrada.
          </td>
        </tr>
      </tbody>
    </ListTable>
  </section>
</template>
