<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import ClientForm from '../components/ClientForm.vue'
import ContextActivityDialog from '@/features/calendar/components/ContextActivityDialog.vue'
import ClientDetailsDialog from '../components/ClientDetailsDialog.vue'
import ClientContactDialog from '../components/ClientContactDialog.vue'
import { useClientsPage } from '../composables/useClientsPage'
const { onActivitySaved, tenantId, tenant, operators, classes, sellers, canAssignSeller, loading, busy, error, activityClient, canCreateActivity, showSellerSelect, writable, canAdd, search, operatorFilter, filtered, applyFilters, clearFilters, page, total, lastPage, pageRows, changePage, validationState, duplicate, checkingDocument, transferBusy, checkDocument, requestTransfer, form, editing, modal, selected, detailsInitialTab, contact, contactModal, pendingContactClientId, documentModel, phoneModel, contactPhoneModel, cepModel, cepBusy, cepMessage, lookupCep, classesForOperator, activeSeller, start, load, save, saveOperatorClassification, openHistory, details, editContact, saveContact } = useClientsPage()
</script>
<template>
  <AppShell :tenant="tenant" title="Clientes" subtitle="Carteira comercial e contatos">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">COMERCIAL</p>
        <h1 class="mt-3 text-3xl font-semibold">Clientes</h1>
        <p class="mt-2 text-sm text-slate-500">
          Cadastros, operadora atual, classificação e histórico de vendedores.
        </p>
      </div>
      <button v-if="canAdd" type="button" class="primary-button w-auto" @click="start()">
        + Novo cliente
      </button>
    </header>
    <ClientTransferApprovals
      v-if="tenant && (tenant.role === 'OWNER' || tenant.role === 'MANAGER' || canAssignSeller)"
      class="mb-6"
      :tenant-id="tenantId"
      @reviewed="load"
    />
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <ListFilters
        :columns="2"
        :count-label="`${filtered.length} cliente(s) encontrado(s)`"
        @search="applyFilters"
        @clear="clearFilters"
      >
        <label class="text-xs font-semibold text-slate-600"
          >Buscar cliente
          <input
            v-model="search"
            type="search"
            class="field"
            placeholder="Nome, documento ou e-mail"
          />
        </label>
        <label class="text-xs font-semibold text-slate-600"
          >Operadora
          <SearchSelect
            v-model="operatorFilter"
            :options="[
              { value: '', label: 'Todas as operadoras' },
              ...operators.map((o) => ({ value: String(o.id), label: o.name })),
            ]"
          />
        </label>
      </ListFilters>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="700px"
          ><thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="p-4">Cliente</th>
              <th class="p-4">Documento</th>
              <th class="p-4">Operadora</th>
              <th class="p-4">Classificação</th>
              <th class="p-4">Vendedor</th>
              <th class="p-4">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="c in pageRows" :key="c.id" class="hover:bg-stone-50/70">
              <td class="p-4 font-semibold">{{ c.company_name }}</td>
              <td class="p-4">{{ c.document }}</td>
              <td class="p-4">{{ c.operator?.name ?? '—' }}</td>
              <td class="p-4">{{ c.classification?.code ?? '—' }}</td>
              <td class="p-4">
                {{ sellers.find((s) => s.id === activeSeller(c)?.tenant_user_id)?.name ?? '—' }}
              </td>
              <td class="p-4">
                <div class="flex gap-2">
                  <TableActionButton
                    icon="eye"
                    :label="`Ver detalhes de ${c.company_name}`"
                    @click="details(c.id)"
                  /><TableActionButton
                    icon="message-square"
                    :label="`Histórico de ${c.company_name}`"
                    @click="openHistory(c.id)"
                  /><TableActionButton
                    v-if="canCreateActivity"
                    icon="calendar"
                    :label="`Criar atividade para ${c.company_name}`"
                    @click="activityClient = c"
                  /><TableActionButton
                    v-if="writable"
                    icon="edit"
                    :label="`Editar ${c.company_name}`"
                    @click="start(c)"
                  />
                </div>
              </td>
            </tr></tbody
        ></ListTable>
        <p v-if="!filtered.length" class="p-5 text-center text-sm text-slate-500">
          Nenhum cliente encontrado.
        </p>
      </section>
      <PagePagination
        :page="page"
        :last-page="lastPage"
        :total="total"
        :busy="loading || busy"
        @change="changePage"
      />
      <ClientDetailsDialog
        :client="contactModal ? null : selected"
        :tenant-id="tenantId"
        :writable="writable"
        :busy="busy"
        :sellers="sellers"
        :classes="classes"
        :initial-tab="detailsInitialTab"
        @close="selected = null"
        @save-operator-classification="saveOperatorClassification"
        @edit-contact="editContact"
      />
    </template>
    <ContextActivityDialog
      :open="!!activityClient"
      :tenant-id="tenantId"
      :client-id="activityClient?.id ?? ''"
      :initial-title="activityClient ? 'Contato: ' + activityClient.company_name : ''"
      :can-write="canCreateActivity"
      @close="activityClient = null"
      @saved="onActivitySaved"
    />
    <ClientForm
      v-if="modal"
      :form="form"
      :editing="editing"
      :busy="busy"
      :operators="operators"
      :classes-for-operator="classesForOperator"
      :sellers="sellers"
      :show-seller-select="showSellerSelect"
      :validation-state="validationState"
      :cep-busy="cepBusy"
      :cep-message="cepMessage"
      :duplicate="duplicate"
      :checking-document="checkingDocument"
      :transfer-busy="transferBusy"
      v-model:document-model="documentModel"
      v-model:phone-model="phoneModel"
      v-model:cep-model="cepModel"
      @lookup-cep="lookupCep"
      @check-document="checkDocument"
      @request-transfer="requestTransfer"
      @cancel="modal = false"
      @save="save"
    />
    <ClientContactDialog
      :open="contactModal"
      :busy="busy"
      :required-contact="!!pendingContactClientId"
      :contact="contact"
      v-model:phone-model="contactPhoneModel"
      @close="contactModal = false"
      @save="saveContact"
    />
  </AppShell>
</template>
