<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ListTable from '@/components/ui/ListTable.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import ParticipantForm from '../components/ParticipantForm.vue'
import { useCommercialParticipantsPage } from '../composables/useCommercialParticipantsPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const {
 tenant, rows, currentPage, lastPage, total, filtersBusy, search, filterRole,
 loadRows, applyFilters, clearFilters, operators, orderTypes, loading, busy,
 error, writable, form, editingId, modalOpen, selected, defaults, overrides,
 commissionLoading, overrideEditingId, overrideForm, overrideOpen, typeLabel,
 percent, edit, load, save, openCommissions, editOverride, saveOverride, removeOverride,
} = useCommercialParticipantsPage(tenantId)
</script>
<template>
  <AppShell
    :tenant="tenant"
    title="Parceiros e indicadores"
    subtitle="Participantes comerciais externos e suas comissões"
  >
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">EQUIPE</p>
        <h1 class="mt-3 text-3xl font-semibold">Parceiros e indicadores</h1>
        <p class="mt-2 text-sm text-slate-500">
          Cadastro sem acesso obrigatório ao CRM, com tabela padrão e exceções individuais.
        </p>
      </div>
      <button v-if="writable" type="button" class="primary-button w-auto" @click="edit()">
        + Novo participante
      </button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <ListFilters
        :columns="2"
        :busy="filtersBusy"
        :count-label="`${total} participante(s) encontrado(s)`"
        @search="applyFilters"
        @clear="clearFilters"
      >
        <label class="text-xs font-semibold text-slate-600"
          >Buscar por nome<input
            v-model="search"
            type="search"
            placeholder="Nome do participante"
            class="field"
        /></label>
        <label class="text-xs font-semibold text-slate-600"
          >Perfil
          <div>
            <SearchSelect
              v-model="filterRole"
              :options="[
                { value: '', label: 'Todos os perfis' },
                { value: 'PARTNER', label: 'Parceiros' },
                { value: 'REFERRER', label: 'Indicadores' },
              ]"
            /></div
        ></label>
      </ListFilters>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="650px"
          ><thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-4">Nome</th>
              <th class="px-4 py-4">Perfil</th>
              <th class="px-4 py-4">Pessoa</th>
              <th class="px-4 py-4">Contato</th>
              <th class="px-4 py-4">Situação</th>
              <th class="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="row in rows" :key="row.id" class="hover:bg-stone-50/70">
              <td class="px-5 py-4 font-semibold text-slate-800">{{ row.name }}</td>
              <td class="px-4 py-4 text-slate-600">
                {{ row.role === 'PARTNER' ? 'Parceiro' : 'Indicador' }}
              </td>
              <td class="px-4 py-4 text-slate-600">{{ row.person_type }}</td>
              <td class="px-4 py-4 text-slate-600">{{ row.email || row.phone || '—' }}</td>
              <td class="px-4 py-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="
                    row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-slate-500'
                  "
                  >{{ row.is_active ? 'Ativo' : 'Inativo' }}</span
                >
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <TableActionButton
                    icon="tag"
                    :label="`Comissões de ${row.name}`"
                    @click="openCommissions(row)"
                  /><TableActionButton
                    v-if="writable"
                    icon="edit"
                    :label="`Editar ${row.name}`"
                    @click="edit(row)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="px-5 py-12 text-center text-slate-500">
                Nenhum participante encontrado.
              </td>
            </tr>
          </tbody></ListTable
        >
      </section>
      <PagePagination
        :page="currentPage"
        :last-page="lastPage"
        :total="total"
        :busy="filtersBusy"
        @change="loadRows"
      />
    </template>
    <section v-if="selected" class="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-xl font-semibold">Comissões de {{ selected.name }}</h2>
          <p class="text-sm text-slate-500">
            As exceções individuais substituem a regra padrão apenas na operadora, tipo e vigência
            correspondentes.
          </p>
        </div>
        <button type="button" class="rounded-lg border px-3 py-2" @click="selected = null">
          Fechar
        </button>
      </div>
      <p v-if="commissionLoading" class="text-sm">Carregando regras...</p>
      <template v-else>
        <h3 class="mb-2 font-semibold">Tabela padrão do perfil</h3>
        <div class="mb-5 overflow-x-auto">
          <ListTable min-width="0"
            ><thead>
              <tr>
                <th class="p-2">Operadora</th>
                <th class="p-2">Pedido</th>
                <th class="p-2">Comissão</th>
                <th class="p-2">Vigência</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in defaults" :key="row.id" class="border-t">
                <td class="p-2">{{ row.operator?.name }}</td>
                <td class="p-2">{{ typeLabel(row.order_type) }}</td>
                <td class="p-2">{{ percent(row.percentage) }}</td>
                <td class="p-2">{{ row.starts_on }} — {{ row.ends_on ?? 'Indeterminado' }}</td>
              </tr>
            </tbody></ListTable
          >
          <p v-if="!defaults.length" class="p-2 text-sm text-slate-500">
            Nenhuma regra padrão ativa.
          </p>
        </div>
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-semibold">Exceções individuais</h3>
          <button
            v-if="writable"
            type="button"
            class="rounded-lg border px-3 py-2 text-sm"
            @click="editOverride()"
          >
            + Nova exceção
          </button>
        </div>
        <div class="overflow-x-auto">
          <ListTable min-width="0"
            ><thead>
              <tr>
                <th class="p-2">Operadora</th>
                <th class="p-2">Pedido</th>
                <th class="p-2">Comissão</th>
                <th class="p-2">Vigência</th>
                <th class="p-2">Situação</th>
                <th v-if="writable" class="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in overrides" :key="row.id" class="border-t">
                <td class="p-2">{{ row.operator?.name }}</td>
                <td class="p-2">{{ typeLabel(row.order_type) }}</td>
                <td class="p-2">{{ percent(row.percentage) }}</td>
                <td class="p-2">{{ row.starts_on }} — {{ row.ends_on ?? 'Indeterminado' }}</td>
                <td class="p-2">{{ row.is_active ? 'Ativa' : 'Inativa' }}</td>
                <td v-if="writable" class="p-2">
                  <TableActionButton
                    icon="edit"
                    label="Editar exceção de comissão"
                    :busy="busy"
                    @click="editOverride(row)"
                  /><TableActionButton
                    icon="trash"
                    tone="danger"
                    label="Excluir exceção de comissão"
                    :busy="busy"
                    @click="removeOverride(row)"
                  />
                </td>
              </tr></tbody
          ></ListTable>
          <p v-if="!overrides.length" class="p-2 text-sm text-slate-500">
            Sem exceções: aplica-se a tabela padrão.
          </p>
        </div>
      </template>
    </section>
    <div
      v-if="modalOpen && writable"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <ParticipantForm
        v-model="form"
        :busy="busy"
        :editing="!!editingId"
        @submit="save"
        @cancel="modalOpen = false"
      />
    </div>
    <div
      v-if="overrideOpen && writable"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <form
        class="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 shadow-xl"
        @submit.prevent="saveOverride"
      >
        <h2 class="text-xl font-semibold">
          {{ overrideEditingId ? 'Editar exceção' : 'Nova exceção' }}
        </h2>
        <label class="block text-sm"
          >Operadora<SearchSelect
            v-model="overrideForm.operator_id"
            :options="operators.map((o) => ({ value: o.id, label: o.name }))"
            required
        /></label>
        <label class="block text-sm"
          >Tipo de pedido<SearchSelect
            v-model="overrideForm.order_type"
            :options="orderTypes"
            required
        /></label>
        <label class="block text-sm"
          >Percentual individual sobre contrato<input
            v-model="overrideForm.percentage"
            required
            inputmode="decimal"
            class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400"
        /></label>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-sm"
            >Início<input
              v-model="overrideForm.starts_on"
              type="date"
              required
              class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400" /></label
          ><label class="text-sm"
            >Fim (opcional)<input
              v-model="overrideForm.ends_on"
              type="date"
              class="mt-1 w-full rounded-xl border-0 bg-stone-100 px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400"
          /></label>
        </div>
        <label class="flex gap-2 text-sm"
          ><input v-model="overrideForm.is_active" type="checkbox" />Ativa</label
        >
        <div class="flex justify-end gap-2">
          <button type="button" class="rounded-lg border px-4 py-2" @click="overrideOpen = false">
            Cancelar</button
          ><button type="submit" :disabled="busy" class="primary-button w-auto">Salvar</button>
        </div>
      </form>
    </div>
  </AppShell>
</template>
