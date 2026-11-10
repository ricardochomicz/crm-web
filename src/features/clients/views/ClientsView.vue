<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import ListTable from '@/components/ui/ListTable.vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'
import { validateClient } from '../validation'
import { useClientsList } from '../composables/useClientsList'
import { useClientMasks } from '../composables/useClientMasks'
import { useClientAddress } from '../composables/useClientAddress'
import { digits } from '@/lib/masks'
import { useFormValidation } from '@/composables/useFormValidation'
import ClientForm from '../components/ClientForm.vue'
import ClientDetailsDialog from '../components/ClientDetailsDialog.vue'
import {
  clientsApi,
  type Client,
  type ClientInput,
  type Contact,
  type ContactInput,
  type Classification,
  type Seller,
  type ClientTransferLookup,
} from '../api'
import type { Tenant } from '@/features/tenants/types'
const route = useRoute(),
  tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>(),
  rows = ref<Client[]>([]),
  operators = ref<TenantOperator[]>([]),
  classes = ref<Classification[]>([]),
  sellers = ref<Seller[]>([])
const canAssignSeller = ref(false),
  currentSellerId = ref<string | null>(null)
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  canManage = ref(false),
  canCreate = ref(false)
const showSellerSelect = computed(
  () => canAssignSeller.value || tenant.value?.role === 'OWNER' || tenant.value?.role === 'MANAGER',
)
const writable = computed(
  () => canManage.value && !!tenant.value?.access?.allows_operational_writes,
)
const canAdd = computed(() => canCreate.value && !!tenant.value?.access?.allows_operational_writes)
const {
  search,
  operatorFilter,
  filtered,
  applyFilters,
  clearFilters,
  page,
  total,
  lastPage,
  pageRows,
  changePage,
} = useClientsList(rows)
const blank = (): ClientInput => ({
  person_type: 'PJ',
  document: '',
  company_name: '',
  phone: null,
  email: null,
  zip_code: null,
  address: null,
  address_number: null,
  address_complement: null,
  neighborhood: null,
  city: null,
  state: null,
  operator_id: null,
  classification_id: null,
  contract_started_on: null,
  contract_ends_on: null,
  is_active: true,
  seller_membership_id: null,
  seller_reason: null,
})
const validationState = useFormValidation<keyof ClientInput>()
const duplicate = ref<ClientTransferLookup | null>(null)
const checkingDocument = ref(false)
const transferBusy = ref(false)
let lookupVersion = 0

async function checkDocument() {
  const version = ++lookupVersion
  duplicate.value = null
  const document = digits(form.value.document, 14)
  if (editing.value || ![11, 14].includes(document.length)) return
  checkingDocument.value = true
  try {
    const result = await clientsApi.transferLookup(tenantId.value, document)
    if (version === lookupVersion) duplicate.value = result.data
  } catch (e) {
    if (version === lookupVersion) toast.error(e instanceof Error ? e.message : 'Erro ao verificar cliente.')
  } finally {
    if (version === lookupVersion) checkingDocument.value = false
  }
}

async function requestTransfer() {
  if (!duplicate.value?.client_id || transferBusy.value) return
  transferBusy.value = true
  try {
    const reason = window.prompt('Informe o motivo da solicitação de transferência (mínimo de 10 caracteres):')
    if (!reason) return
    if (reason.trim().length < 10) {
      toast.error('Informe uma justificativa com pelo menos 10 caracteres.')
      return
    }
    await clientsApi.requestTransfer(tenantId.value, duplicate.value.client_id, reason.trim())
    toast.success('Solicitação enviada para aprovação do supervisor.')
    modal.value = false
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Não foi possível solicitar a transferência.')
  } finally {
    transferBusy.value = false
  }
}

const form = ref<ClientInput>(blank()),
  editing = ref(''),
  modal = ref(false),
  selected = ref<Client | null>(null),
  detailsInitialTab = ref<'data' | 'history'>('data')
const contactBlank = (): ContactInput => ({
  name: '',
  position: null,
  phone: null,
  email: null,
  is_primary: false,
  is_active: true,
  notes: null,
})
const contact = ref<ContactInput>(contactBlank()),
  contactEditing = ref(''),
  contactModal = ref(false),
  pendingContactClientId = ref<string | null>(null)

const { documentModel, phoneModel, contactPhoneModel } = useClientMasks(form, contact)
const { cepModel, cepBusy, cepMessage, lookupCep, cancelLookup } = useClientAddress(form)

const classesForOperator = computed(() =>
  classes.value.filter(
    (c) => Number(c.operator_id) === Number(form.value.operator_id) && c.is_active,
  ),
)
const activeSeller = (c: Client) => c.sellers?.find((s) => !s.ended_at)
function start(c?: Client) {
  ++lookupVersion
  duplicate.value = null
  checkingDocument.value = false
  validationState.clear()
  editing.value = c?.id ?? ''
  form.value = c
    ? {
        person_type: c.person_type,
        document: c.document,
        company_name: c.company_name,
        phone: c.phone,
        email: c.email,
        zip_code: c.zip_code,
        address: c.address,
        address_number: c.address_number,
        address_complement: c.address_complement,
        neighborhood: c.neighborhood,
        city: c.city,
        state: c.state,
        operator_id: c.operator_id,
        classification_id: c.classification_id,
        contract_started_on: c.contract_started_on,
        contract_ends_on: c.contract_ends_on,
        is_active: c.is_active,
        seller_membership_id: activeSeller(c)?.tenant_user_id ?? null,
        seller_reason: null,
      }
    : blank()
  if (!c && !showSellerSelect.value) form.value.seller_membership_id = currentSellerId.value
  cancelLookup()
  modal.value = true
}
async function load() {
  const id = tenantId.value
  loading.value = true
  error.value = ''
  try {
    const [t, list, op, cl, opts] = await Promise.all([
      tenantApi.show(id),
      clientsApi.list(id),
      operatorsApi.available(),
      clientsApi.classifications(id),
      clientsApi.options(id),
    ])
    if (id !== tenantId.value) return
    tenant.value = t.data
    rows.value = list.data
    const pending = list.data.find((client) => client.contact_pending)
    if (pending && !pendingContactClientId.value && !contactModal.value && list.meta.can_create) {
      pendingContactClientId.value = pending.id
      selected.value = (await clientsApi.show(id, pending.id)).data
      editContact()
      contact.value.is_primary = true
    }
    canManage.value = list.meta.can_manage
    canCreate.value = list.meta.can_create
    operators.value = op.data.map((o) => ({ ...o, selected: true }))
    classes.value = cl.data
    sellers.value = opts.data.sellers
    canAssignSeller.value = opts.data.can_assign_seller
    currentSellerId.value = opts.data.current_seller_id
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar clientes.'
  } finally {
    if (id === tenantId.value) loading.value = false
  }
}
async function save() {
  if (busy.value) return
  if (!editing.value) {
    await checkDocument()
    if (duplicate.value?.exists) {
      toast.error('Cliente já cadastrado. Utilize a transferência de carteira, quando disponível.')
      return
    }
  }
  validationState.clear()
  const validation = validateClient(form.value)
  if (Object.keys(validation).length) {
    validationState.set(validation)
    return
  }
  busy.value = true
  try {
    const data = {
      ...form.value,
      operator_id: form.value.operator_id || null,
      classification_id: form.value.classification_id || null,
      seller_membership_id: showSellerSelect.value
        ? form.value.seller_membership_id || null
        : editing.value
          ? null
          : currentSellerId.value,
      contract_started_on: form.value.contract_started_on || null,
      contract_ends_on: form.value.contract_ends_on || null,
      document: form.value.document.replace(/\D/g, ''),
      zip_code: form.value.zip_code?.replace(/\D/g, '') || null,
      phone: form.value.phone?.replace(/\D/g, '') || null,
    }
    const r = await clientsApi.save(tenantId.value, data, editing.value || undefined)
    modal.value = false
    if (!editing.value && r.data.contact_pending) {
      pendingContactClientId.value = r.data.id
      selected.value = r.data
      editContact()
      contact.value.is_primary = true
      toast.success('Cliente cadastrado. Informe agora a pessoa responsável.')
    } else {
      toast.success('Cliente salvo.')
    }
    await load()
    if (selected.value?.id === r.data.id) await details(r.data.id)
  } catch (e) {
    if (e instanceof ApiError && Object.keys(e.errors).length) {
      validationState.fromApi(e.errors)
    } else {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar cliente.')
    }
  } finally {
    busy.value = false
  }
}
async function saveOperatorClassification(operatorId: number, classificationId: number) {
  if (!selected.value || busy.value) return
  busy.value = true
  try {
    const clientId = selected.value.id
    await clientsApi.setOperatorClassification(tenantId.value, clientId, operatorId, classificationId)
    selected.value = null
    toast.success('Classificação da operadora atualizada.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao atualizar classificação.')
  } finally {
    busy.value = false
  }
}

async function openHistory(id: string) {
  await details(id)
  if (selected.value?.id === id) detailsInitialTab.value = 'history'
}
async function details(id: string) {
  try {
    selected.value = (await clientsApi.show(tenantId.value, id)).data
    detailsInitialTab.value = 'data'
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao carregar cliente.')
  }
}
function editContact(c?: Contact) {
  contactEditing.value = c?.id ?? ''
  contact.value = c
    ? {
        name: c.name,
        position: c.position,
        phone: c.phone,
        email: c.email,
        is_primary: c.is_primary,
        is_active: c.is_active,
        notes: c.notes,
      }
    : contactBlank()
  contactModal.value = true
}
async function saveContact() {
  if (!selected.value || busy.value) return
  busy.value = true
  try {
    await clientsApi.contact(
      tenantId.value,
      selected.value.id,
      { ...contact.value, phone: digits(contact.value.phone, 11) || null },
      contactEditing.value || undefined,
    )
    const clientId = selected.value.id
    const updated = (await clientsApi.show(tenantId.value, clientId)).data
    if (pendingContactClientId.value && updated.contact_pending) {
      toast.error('Cadastre um contato principal ativo com nome, cargo e telefone ou e-mail.')
      return
    }
    const wasRequiredContact = !!pendingContactClientId.value
    pendingContactClientId.value = null
    contactModal.value = false
    if (wasRequiredContact) {
      selected.value = null
      detailsInitialTab.value = 'data'
      toast.success('Pessoa de contato salva. Cadastro do cliente concluído.')
      await load()
    } else {
      toast.success('Contato salvo.')
      await details(clientId)
    }
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao salvar contato.')
  } finally {
    busy.value = false
  }
}
watch(
  tenantId,
  () => {
    selected.value = null
    modal.value = false
    pendingContactClientId.value = null
    contactModal.value = false
    cancelLookup()
    void load()
  },
  { immediate: true },
)
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
    <Teleport to="body">
    <div
      v-if="contactModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    >
      <form
        class="w-full max-w-2xl max-h-[94dvh] overflow-y-auto space-y-3 rounded-2xl bg-white p-6"
        @submit.prevent="saveContact"
      >
        <h2 class="text-xl font-semibold">{{ pendingContactClientId ? 'Responsável pela empresa (obrigatório)' : 'Pessoa de contato' }}</h2>
        <p v-if="pendingContactClientId" class="text-sm text-amber-800">Para concluir o cadastro do cliente, informe o responsável principal.</p>
        <label class="block text-sm"
          >Nome<input v-model="contact.name" required class="field" /></label
        ><label class="block text-sm">Cargo<input v-model="contact.position" :required="!!pendingContactClientId" class="field" /></label
        ><label class="block text-sm"
          >Telefone<input
            v-model="contactPhoneModel"
            class="field"
            inputmode="tel"
            maxlength="15" /></label
        ><label class="block text-sm"
          >E-mail<input v-model="contact.email" type="email" class="field" /></label
        ><label class="flex gap-2 text-sm"
          ><input v-model="contact.is_primary" type="checkbox" />Contato principal</label
        ><label class="flex gap-2 text-sm"
          ><input v-model="contact.is_active" type="checkbox" />Ativo</label
        >
        <div class="flex justify-end gap-2">
          <button v-if="!pendingContactClientId" type="button" class="rounded-lg border px-4 py-2" @click="contactModal = false">
            Cancelar</button
          ><button type="submit" class="primary-button w-auto" :disabled="busy">Salvar</button>
        </div>
      </form>
    </div>
    </Teleport>
  </AppShell>
</template>
