<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ClientForm from '../components/ClientForm.vue'
import ClientsListFilters from '../components/ClientsListFilters.vue'
import ClientsListTable from '../components/ClientsListTable.vue'
import ContextActivityDialog from '@/features/calendar/components/ContextActivityDialog.vue'
import ClientDetailsDialog from '../components/ClientDetailsDialog.vue'
import ClientContactDialog from '../components/ClientContactDialog.vue'
import ClientTransferDialog from '../components/ClientTransferDialog.vue'
import ClientTransferApprovals from '../components/ClientTransferApprovals.vue'
import { useClientsPage } from '../composables/useClientsPage'
const { transferDialogOpen, submitTransfer, onActivitySaved, tenantId, tenant, operators, classes, sellers, canAssignSeller, loading, busy, error, activityClient, canCreateActivity, showSellerSelect, writable, canAdd, search, operatorFilter, filtered, applyFilters, clearFilters, page, total, lastPage, pageRows, changePage, validationState, duplicate, checkingDocument, transferBusy, checkDocument, requestTransfer, form, editing, modal, selected, detailsInitialTab, contact, contactModal, pendingContactClientId, documentModel, phoneModel, contactPhoneModel, cepModel, cepBusy, cepMessage, lookupCep, classesForOperator, sellerName, start, load, save, saveOperatorClassification, openHistory, details, editContact, saveContact } = useClientsPage()
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
      <ClientsListFilters
        v-model:search="search"
        v-model:operator-filter="operatorFilter"
        :operators="operators"
        :count="filtered.length"
        @search="applyFilters"
        @clear="clearFilters"
      />
      <ClientsListTable
        :rows="pageRows"
        :seller-name="sellerName"
        :can-create-activity="canCreateActivity"
        :writable="writable"
        @details="details"
        @history="openHistory"
        @activity="activityClient = $event"
        @edit="start"
      />
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
        @consolidated="load"
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
    <ClientTransferDialog :open="transferDialogOpen" :busy="transferBusy" @close="transferDialogOpen = false" @submit="submitTransfer" />
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
