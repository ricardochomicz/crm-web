<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ClassificationForm from '../components/ClassificationForm.vue'
import ClassificationRuleForm from '../components/ClassificationRuleForm.vue'
import ClassificationListFilters from '../components/ClassificationListFilters.vue'
import ClassificationListTable from '../components/ClassificationListTable.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { useClassificationsPage } from '../composables/useClassificationsPage'

const {
  tenant,
  tenantId,
  operators,
  loading,
  error,
  busy,
  filter,
  writable,
  filtered,
  form,
  editing,
  modal,
  months,
  rule,
  ruleFor,
  load,
  edit,
  save,
  addRule,
  saveRule,
  page,
  total,
  lastPage,
  pageRows,
  changePage,
  applyFilters,
  clearFilters,
} = useClassificationsPage()
</script>
<template>
  <AppShell
    :tenant="tenant"
    title="Classificações das operadoras"
    subtitle="Prazos de renovação por vigência"
  >
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">GERENCIAL</p>
        <h1 class="mt-3 text-3xl font-semibold">Classificações das operadoras</h1>
        <p class="mt-2 text-sm text-slate-500">
          Classificações globais são somente leitura. O proprietário pode criar classificações e
          regras próprias.
        </p>
      </div>
      <button v-if="writable" class="primary-button w-auto" @click="edit()">+ Classificação</button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <ClassificationListFilters v-model="filter" :operators="operators" :count="filtered.length" :busy="loading || busy" @search="applyFilters" @clear="clearFilters" />
      <ClassificationListTable :rows="pageRows" mode="tenant" :tenant-id="tenantId" :writable="writable" :busy="busy" @edit="edit" @add-rule="addRule" />
      <PagePagination
        :page="page"
        :last-page="lastPage"
        :total="total"
        :busy="loading || busy"
        @change="changePage"
      />
    </template>
    <AppDialog
      :open="modal"
      :title="editing ? 'Editar classificação' : 'Nova classificação'"
      :busy="busy"
      @close="modal = false"
    >
      <ClassificationForm
        v-model:form="form"
        v-model:months="months"
        :operators="operators"
        :busy="busy"
        @submit="save"
        @cancel="modal = false"
      />
    </AppDialog>
    <AppDialog
      :open="ruleFor !== null"
      :title="`Regra de renovação · ${ruleFor?.code ?? ''}`"
      :busy="busy"
      @close="ruleFor = null"
    >
      <ClassificationRuleForm
        v-model:rule="rule"
        :busy="busy"
        @submit="saveRule"
        @cancel="ruleFor = null"
      />
    </AppDialog>
  </AppShell>
</template>
