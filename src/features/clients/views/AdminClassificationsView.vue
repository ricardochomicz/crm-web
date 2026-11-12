<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import AppShell from '@/components/layout/AppShell.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import ClassificationListFilters from '../components/ClassificationListFilters.vue'
import ClassificationListTable from '../components/ClassificationListTable.vue'
import ClassificationForm from '../components/ClassificationForm.vue'
import ClassificationRuleForm from '../components/ClassificationRuleForm.vue'
import { useAdminClassificationsPage } from '../composables/useAdminClassificationsPage'

const { rows, operators, loading, busy, error, form, months, editing, modal, ruleFor, rule, ruleEditing, filter, filtered, load, edit, save, addRule, editRule, saveRule, page, total, lastPage, pageRows, changePage, applyFilters, clearFilters } = useAdminClassificationsPage()
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
      ><ClassificationListFilters v-model="filter" :operators="operators" :count="filtered.length" :busy="loading || busy" @search="applyFilters" @clear="clearFilters" />
      <ClassificationListTable :rows="pageRows" mode="admin" :busy="busy" @edit="edit" @add-rule="addRule" @edit-rule="editRule" />
      <PagePagination :page="page" :last-page="lastPage" :total="total" @change="changePage"
    /></template>
    <AppDialog
      :open="modal"
      :title="editing ? 'Editar classificação' : 'Nova classificação'"
      :busy="busy"
      @close="modal = false"
      ><ClassificationForm v-model:form="form" v-model:months="months" :operators="operators" :busy="busy" show-description :max-months="1200" @submit="save" @cancel="modal = false" /></AppDialog
    >
    <AppDialog
      :open="ruleFor !== null"
      :title="`Regra global · ${ruleFor?.code ?? ''}`"
      :busy="busy"
      @close="ruleFor = null"
      ><ClassificationRuleForm v-model:rule="rule" :busy="busy" @submit="saveRule" @cancel="ruleFor = null" /></AppDialog
    >
  </AppShell>
</template>
