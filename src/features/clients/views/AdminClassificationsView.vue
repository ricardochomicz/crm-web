<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppShell from '@/components/layout/AppShell.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import { useListPagination } from '@/composables/useListPagination'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import { useListFilters } from '@/composables/useListFilters'
import ListTable from '@/components/ui/ListTable.vue'
import { computed, ref, onMounted } from 'vue'
import { clientsApi, type Classification, type ClassificationInput, type RuleInput } from '../api'
import { request } from '@/lib/http'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { toast } from '@/services/toast'
const rows = ref<Classification[]>([]),
  operators = ref<{ id: number; name: string }[]>([]),
  loading = ref(true),
  busy = ref(false),
  error = ref('')
const form = ref<ClassificationInput>({
  operator_id: 0,
  code: '',
  name: '',
  description: null,
  is_active: true,
  sort_order: 0,
})
const months = ref(21)
const editing = ref<number | null>(null),
  modal = ref(false),
  ruleFor = ref<Classification | null>(null)
const rule = ref<RuleInput>({
  minimum_months: 18,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: null,
  is_active: true,
  notes: null,
})
const ruleEditing = ref<string | null>(null)
const filter = ref('')
const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ filter })
const filtered = computed(() =>
  rows.value.filter((c) => !applied.value.filter || String(c.operator_id) === applied.value.filter),
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [r, o] = await Promise.all([
      clientsApi.globalClassifications(),
      request<{ data: { id: number; name: string }[] }>('/api/v1/admin/operators'),
    ])
    rows.value = r.data
    operators.value = o.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}
function edit(c?: Classification) {
  editing.value = c?.id ?? null
  months.value = c?.rules.find((rule) => rule.is_active && !rule.valid_until)?.minimum_months ?? c?.rules.find((rule) => rule.is_active)?.minimum_months ?? 21
  form.value = c
    ? {
        operator_id: c.operator_id,
        code: c.code,
        name: c.name,
        description: c.description,
        is_active: c.is_active,
        sort_order: c.sort_order,
      }
    : {
        operator_id: operators.value[0]?.id ?? 0,
        code: '',
        name: '',
        description: null,
        is_active: true,
        sort_order: 0,
      }
  modal.value = true
}
async function save() {
  busy.value = true
  try {
    if (!Number.isInteger(months.value) || months.value < 1 || months.value > 1200) {
      toast.error('Informe um prazo válido em meses.')
      return
    }

    const classificationCode = form.value.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')
    const payload = { ...form.value, code: editing.value ? form.value.code : classificationCode }
    if (!payload.code) {
      toast.error('Informe o nome da classificação.')
      return
    }

    const current = rows.value.find((item) => item.id === editing.value)
    const activeRule = current?.rules.find((item) => item.is_active && !item.valid_until)
    if (activeRule && activeRule.minimum_months !== months.value) {
      toast.error('Para alterar um prazo vigente, utilize a ação de regras, preservando o histórico.')
      return
    }

    const response = await clientsApi.saveGlobalClassification(payload, editing.value ?? undefined)
    const classificationId = editing.value ?? response.data.id
    if (!activeRule) {
      await clientsApi.addGlobalRule(classificationId, {
        minimum_months: months.value,
        valid_from: new Date().toISOString().slice(0, 10),
        valid_until: null,
        is_active: true,
        notes: null,
      })
    }
    modal.value = false
    toast.success('Classificação global salva.')
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao salvar.')
  } finally {
    busy.value = false
  }
}
function addRule(c: Classification) {
  ruleEditing.value = null
  ruleFor.value = c
  rule.value = {
    minimum_months: 18,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: null,
    is_active: true,
    notes: null,
  }
}
function editRule(c: Classification, r: Classification['rules'][number]) {
  ruleFor.value = c
  ruleEditing.value = r.id
  rule.value = {
    minimum_months: r.minimum_months,
    valid_from: r.valid_from,
    valid_until: r.valid_until,
    is_active: r.is_active,
    notes: r.notes,
  }
}
async function saveRule() {
  if (!ruleFor.value) return
  busy.value = true
  try {
    await clientsApi.addGlobalRule(ruleFor.value.id, rule.value, ruleEditing.value ?? undefined)
    ruleFor.value = null
    toast.success('Regra global salva.')
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao salvar regra.')
  } finally {
    busy.value = false
  }
}
onMounted(load)
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)
</script>
<template>
  <AppShell title="Classificações globais" subtitle="Administração da plataforma"
    ><header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p>
        <h1 class="mt-3 text-3xl font-semibold">Classificações globais</h1>
        <p class="mt-2 text-sm text-slate-500">
          Catálogo padrão e vigências das regras de renovação.
        </p>
      </div>
      <div>
        <button
          v-if="!loading && !error"
          type="button"
          :disabled="busy"
          class="primary-button w-auto"
          @click="edit()"
        >
          + Nova classificação
        </button>
      </div>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error"
      ><ListFilters
        :columns="1"
        :count-label="`${filtered.length} resultado(s) encontrado(s)`"
        @search="applyFilters"
        @clear="clearFilters"
        ><label class="text-xs font-semibold text-slate-600"
          >Operadora<SearchSelect
            v-model="filter"
            :options="[
              { value: '', label: 'Todas as operadoras' },
              ...operators.map((o) => ({ value: String(o.id), label: o.name })),
            ]" /></label
      ></ListFilters>
      <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="650px" :busy="busy"
          ><thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" class="px-5 py-4">Operadora</th>
              <th scope="col" class="px-5 py-4">Prazo de renovação</th>
              <th scope="col" class="px-5 py-4">Classificação</th>
              <th scope="col" class="px-5 py-4">Regras</th>
              <th scope="col" class="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="c in pageRows" :key="c.id" class="hover:bg-stone-50/70">
              <td class="px-5 py-4">{{ c.operator?.name }}</td>
              <td class="px-5 py-4">{{ c.rules.find((rule) => rule.is_active && !rule.valid_until)?.minimum_months ?? c.rules.find((rule) => rule.is_active)?.minimum_months ?? "—" }} meses</td>
              <td class="px-5 py-4 font-semibold text-slate-800">{{ c.name }}</td>
              <td class="px-5 py-4">
                <p v-for="r in c.rules" :key="r.id">
                  {{ r.minimum_months }} meses · {{ r.valid_from }} até
                  {{ r.valid_until ?? 'indeterminado' }}
                  <TableActionButton
                    type="button"
                    icon="edit"
                    :label="`Editar regra de ${c.code}`"
                    :busy="busy"
                    @click="editRule(c, r)"
                  />
                </p>
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-right">
                <TableActionButton
                  icon="edit"
                  :label="`Editar ${c.name}`"
                  :busy="busy"
                  @click="edit(c)"
                />
                <TableActionButton
                  icon="tag"
                  :label="`Nova regra para ${c.name}`"
                  :busy="busy"
                  @click="addRule(c)"
                />
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="5" class="px-5 py-12 text-center text-slate-500">
                Nenhuma classificação encontrada.
              </td>
            </tr>
          </tbody></ListTable
        >
      </div>
      <PagePagination :page="page" :last-page="lastPage" :total="total" @change="changePage"
    /></template>
    <AppDialog
      :open="modal"
      :title="editing ? 'Editar classificação' : 'Nova classificação'"
      :busy="busy"
      @close="modal = false"
      ><form class="space-y-4" @submit.prevent="save">
        <label class="block text-sm"
          >Operadora<SearchSelect
            v-model="form.operator_id"
            :options="operators.map((o) => ({ value: o.id, label: o.name }))" /></label
        ><label class="block text-sm"
          >Prazo de renovação (meses)<input v-model.number="months" type="number" min="1" max="1200" required class="field" /></label
        ><label class="block text-sm"
          >Nome<input v-model="form.name" required class="field" /></label
        ><label class="block text-sm"
          >Descrição<input v-model="form.description" class="field" /></label
        ><label class="flex gap-2 text-sm"
          ><input v-model="form.is_active" type="checkbox" />Ativa</label
        >
        <div class="flex justify-end gap-2">
          <button type="button" class="secondary-button" :disabled="busy" @click="modal = false">
            Cancelar</button
          ><button class="primary-button w-auto" :disabled="busy">Salvar</button>
        </div>
      </form></AppDialog
    >
    <AppDialog
      :open="ruleFor !== null"
      :title="`Regra global · ${ruleFor?.code ?? ''}`"
      :busy="busy"
      @close="ruleFor = null"
      ><form class="space-y-4" @submit.prevent="saveRule">
        <label class="block text-sm"
          >Meses mínimos<input
            v-model.number="rule.minimum_months"
            type="number"
            min="0"
            required
            class="field" /></label
        ><label class="block text-sm"
          >Início<input v-model="rule.valid_from" type="date" required class="field" /></label
        ><label class="block text-sm"
          >Fim<input v-model="rule.valid_until" type="date" class="field" /></label
        ><label class="block text-sm"
          >Observações<input v-model="rule.notes" class="field"
        /></label>
        <div class="flex justify-end gap-2">
          <button type="button" class="secondary-button" :disabled="busy" @click="ruleFor = null">
            Cancelar</button
          ><button class="primary-button w-auto" :disabled="busy">Salvar regra</button>
        </div>
      </form></AppDialog
    >
  </AppShell>
</template>
