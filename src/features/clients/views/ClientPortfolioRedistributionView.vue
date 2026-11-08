<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { toast } from '@/services/toast'
import {
  clientsApi,
  type PortfolioRedistributionClient,
  type PortfolioRedistributionMember,
  type PortfolioRedistributionInput,
} from '../api'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const members = ref<PortfolioRedistributionMember[]>([])
const clients = ref<PortfolioRedistributionClient[]>([])
const sourceId = ref('')
const mode = ref<PortfolioRedistributionInput['mode']>('single')
const destinationIds = ref<string[]>([])
const manualAssignments = ref<Record<string, string>>({})
const reason = ref('')
const loading = ref(true)
const clientsLoading = ref(false)
const busy = ref(false)
const error = ref('')
const previewOpen = ref(false)
let requestVersion = 0

const source = computed(() => members.value.find((member) => member.id === sourceId.value))
const eligibleDestinations = computed(() =>
  members.value.filter((member) =>
    member.id !== sourceId.value &&
    member.status === 'ACTIVE' &&
    ['CONSULTANT', 'MANAGER'].includes(member.role),
  ),
)
const destinationOptions = computed(() =>
  eligibleDestinations.value.map((member) => ({
    value: member.id,
    label: `${member.name} · ${member.client_count} clientes`,
  })),
)
const preview = computed(() => {
  const selected = eligibleDestinations.value
    .filter((member) => destinationIds.value.includes(member.id))
  const loads = Object.fromEntries(selected.map((member) => [member.id, member.client_count]))
  return clients.value.map((client) => {
    let destinationId = ''
    if (mode.value === 'manual') {
      destinationId = manualAssignments.value[client.id] ?? ''
    } else if (mode.value === 'single') {
      destinationId = destinationIds.value[0] ?? ''
    } else if (selected.length) {
      const next = [...selected].sort((a, b) =>
        (loads[a.id] ?? 0) - (loads[b.id] ?? 0) || a.id.localeCompare(b.id),
      )[0]
      destinationId = next?.id ?? ''
      if (destinationId) loads[destinationId] = (loads[destinationId] ?? 0) + 1
    }
    return {
      ...client,
      destinationId,
      destinationName: eligibleDestinations.value.find((member) => member.id === destinationId)?.name ?? 'Não definido',
    }
  })
})
const distribution = computed(() =>
  eligibleDestinations.value
    .map((member) => ({
      ...member,
      assigned: preview.value.filter((client) => client.destinationId === member.id).length,
    }))
    .filter((member) => member.assigned > 0),
)
const canReview = computed(() =>
  clients.value.length > 0 &&
  reason.value.trim().length >= 10 &&
  preview.value.every((client) => client.destinationId !== ''),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [tenantResult, membersResult] = await Promise.all([
      tenantApi.show(tenantId.value),
      clientsApi.redistributionMembers(tenantId.value),
    ])
    tenant.value = tenantResult.data
    members.value = membersResult.data.members
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Não foi possível carregar as carteiras.'
  } finally {
    loading.value = false
  }
}

async function loadClients() {
  const version = ++requestVersion
  clients.value = []
  destinationIds.value = []
  manualAssignments.value = {}
  previewOpen.value = false
  if (!sourceId.value) return
  clientsLoading.value = true
  try {
    const result = await clientsApi.redistributionClients(tenantId.value, sourceId.value)
    if (version === requestVersion) clients.value = result.data.clients
  } catch (failure) {
    if (version === requestVersion) error.value = failure instanceof Error ? failure.message : 'Erro ao carregar clientes.'
  } finally {
    if (version === requestVersion) clientsLoading.value = false
  }
}

function toggleDestination(id: string, checked: boolean) {
  destinationIds.value = checked
    ? [...destinationIds.value, id]
    : destinationIds.value.filter((value) => value !== id)
  previewOpen.value = false
}

async function confirm() {
  if (busy.value || !canReview.value || !previewOpen.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await clientsApi.redistribute(tenantId.value, {
      source_membership_id: sourceId.value,
      mode: mode.value,
      reason: reason.value.trim(),
      destination_ids: mode.value === 'manual' ? [] : destinationIds.value,
      assignments: mode.value === 'manual' ? manualAssignments.value : {},
    })
    toast.success(`${result.data.client_count} clientes redistribuídos com sucesso.`)
    sourceId.value = ''
    clients.value = []
    destinationIds.value = []
    manualAssignments.value = {}
    reason.value = ''
    previewOpen.value = false
    await load()
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Não foi possível concluir a redistribuição.'
    previewOpen.value = false
  } finally {
    busy.value = false
  }
}

watch(tenantId, () => void load(), { immediate: true })
watch(sourceId, () => void loadClients())
watch(mode, () => {
  destinationIds.value = []
  manualAssignments.value = {}
  previewOpen.value = false
})
</script>

<template>
  <AppShell :tenant="tenant" title="Gestão de Carteiras" subtitle="Redistribuição administrativa de clientes">
    <div class="mx-auto max-w-6xl space-y-6">
      <header>
        <p class="eyebrow">GERENCIAL</p>
        <h1 class="mt-2 text-3xl font-semibold">Redistribuição de Carteira</h1>
        <p class="mt-2 text-sm text-slate-500">
          Redistribua os clientes de um consultor sem alterar o histórico dos pedidos, contratos ou comissões.
          Consultores suspensos continuam responsáveis pelos clientes até a confirmação da redistribuição.
        </p>
      </header>

      <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>
      <p v-if="loading" class="text-sm text-slate-500">Carregando carteiras...</p>

      <template v-else>
        <section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 class="text-lg font-semibold">1. Consultor de origem</h2>
          <div class="max-w-xl">
            <SearchSelect
              v-model="sourceId"
              :options="members.filter((member) => member.client_count > 0).map((member) => ({
                value: member.id,
                label: `${member.name} · ${member.client_count} clientes · ${member.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}`,
              }))"
              placeholder="Selecione o consultor..."
            />
          </div>
          <p v-if="source" class="text-sm text-slate-600">
            <strong>{{ source.client_count }}</strong> clientes vinculados.
            <span v-if="source.status !== 'ACTIVE'" class="font-semibold text-amber-800"> Consultor com acesso suspenso.</span>
          </p>
          <p v-if="clientsLoading" class="text-sm text-slate-500">Carregando clientes da carteira...</p>
        </section>

        <section v-if="sourceId && !clientsLoading && clients.length" class="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 class="text-lg font-semibold">2. Escolha como distribuir</h2>
          <div class="grid gap-3 md:grid-cols-3">
            <label v-for="option in [
              { value: 'single', title: 'Transferência total', description: 'Todos os clientes para um consultor' },
              { value: 'equal', title: 'Distribuição equilibrada', description: 'Prioriza quem tem menos clientes' },
              { value: 'manual', title: 'Distribuição manual', description: 'Defina o destino de cada cliente' },
            ]" :key="option.value" class="cursor-pointer rounded-xl border p-4" :class="mode === option.value ? 'border-orange-500 bg-orange-50' : 'border-stone-200'">
              <input v-model="mode" type="radio" :value="option.value" class="mr-2 accent-orange-600" />
              <span class="font-semibold">{{ option.title }}</span>
              <p class="mt-1 text-xs text-slate-500">{{ option.description }}</p>
            </label>
          </div>

          <div v-if="mode === 'single'" class="max-w-xl space-y-2">
            <p class="text-sm font-medium">Consultor de destino</p>
            <SearchSelect
              :model-value="destinationIds[0] ?? ''"
              :options="destinationOptions"
              placeholder="Selecione o destino..."
              @update:model-value="destinationIds = $event ? [String($event)] : []"
            />
          </div>
          <div v-else-if="mode === 'equal'" class="space-y-2">
            <p class="text-sm font-medium">Consultores que receberão clientes</p>
            <div class="grid gap-2 md:grid-cols-2">
              <label v-for="member in eligibleDestinations" :key="member.id" class="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-sm">
                <input type="checkbox" :checked="destinationIds.includes(member.id)" class="accent-orange-600" @change="toggleDestination(member.id, ($event.target as HTMLInputElement).checked)" />
                <span>{{ member.name }} · {{ member.client_count }} clientes atuais</span>
              </label>
            </div>
          </div>
          <div v-else class="space-y-3">
            <p class="text-sm font-medium">Defina um responsável para cada cliente</p>
            <div v-for="client in clients" :key="client.id" class="grid items-center gap-2 border-b border-stone-100 pb-3 md:grid-cols-2">
              <div>
                <p class="font-medium">{{ client.name }}</p>
                <p class="text-xs text-slate-500">{{ client.document }}</p>
              </div>
              <SearchSelect
                :model-value="manualAssignments[client.id] ?? ''"
                :options="destinationOptions"
                placeholder="Escolha o consultor..."
                @update:model-value="manualAssignments[client.id] = String($event); previewOpen = false"
              />
            </div>
          </div>

          <label class="block text-sm font-medium">
            Justificativa da redistribuição
            <textarea v-model="reason" rows="3" maxlength="1000" class="field mt-2" placeholder="Ex.: Desligamento do consultor e continuidade do atendimento." @input="previewOpen = false" />
            <span class="mt-1 block text-xs text-slate-500">Mínimo de 10 caracteres. A justificativa será registrada na auditoria.</span>
          </label>
          <button type="button" class="primary-button" :disabled="!canReview || busy" @click="previewOpen = true">
            Revisar redistribuição
          </button>
        </section>

        <section v-if="previewOpen && canReview" class="space-y-4 rounded-2xl border border-orange-200 bg-white p-5">
          <h2 class="text-lg font-semibold">3. Conferência antes de confirmar</h2>
          <p class="text-sm text-slate-600">
            Serão redistribuídos <strong>{{ clients.length }} clientes</strong> de {{ source?.name }}.
            A operação é administrativa e não aplica a regra dos 90 dias.
          </p>
          <div class="grid gap-3 md:grid-cols-3">
            <div v-for="member in distribution" :key="member.id" class="rounded-xl bg-stone-50 p-4">
              <p class="font-semibold">{{ member.name }}</p>
              <p class="text-sm text-slate-600">Receberá {{ member.assigned }} clientes · Total previsto: {{ member.client_count + member.assigned }}</p>
            </div>
          </div>
          <div class="max-h-72 overflow-auto rounded-xl border border-stone-200">
            <table class="w-full text-left text-sm">
              <thead class="sticky top-0 bg-stone-50"><tr><th class="p-3">Cliente</th><th class="p-3">Novo responsável</th></tr></thead>
              <tbody>
                <tr v-for="client in preview" :key="client.id" class="border-t border-stone-100">
                  <td class="p-3">{{ client.name }}</td>
                  <td class="p-3">{{ client.destinationName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-sm text-amber-800">
            A confirmação atualiza apenas o responsável da carteira. Vendas, pedidos, contratos, conversas e comissões anteriores permanecem preservados.
          </p>
          <div class="flex flex-wrap gap-3">
            <button type="button" class="secondary-button" :disabled="busy" @click="previewOpen = false">Voltar e ajustar</button>
            <button type="button" class="primary-button" :disabled="busy" @click="confirm">
              {{ busy ? 'Redistribuindo...' : 'Confirmar redistribuição' }}
            </button>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>
