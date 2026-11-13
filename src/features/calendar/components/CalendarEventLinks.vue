<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'

defineProps<{
  clientId: string | null | undefined
  opportunityId: string | null | undefined
  clients: { value: string; label: string }[]
  opportunities: { value: string; label: string }[]
  clientsLoading: boolean
  opportunitiesLoading: boolean
  locked: boolean
  linkedClientName?: string | null
  linkedOpportunityTitle?: string | null
  showLinkedNotice?: boolean
}>()

const emit = defineEmits<{
  'update:clientId': [value: string | null]
  'update:opportunityId': [value: string | null]
}>()

function selectClient(value: string | number) {
  emit('update:clientId', String(value || '') || null)
}

function selectOpportunity(value: string | number) {
  emit('update:opportunityId', String(value || '') || null)
}
</script>

<template>
  <section class="space-y-4">
    <div
      v-if="showLinkedNotice"
      class="space-y-1 rounded-lg bg-orange-50 p-3 text-sm text-orange-900"
    >
      <p class="font-semibold">Compromisso vinculado</p>
      <p v-if="linkedClientName">
        <span class="font-medium">Cliente:</span> {{ linkedClientName }}
      </p>
      <p v-if="linkedOpportunityTitle">
        <span class="font-medium">Oportunidade:</span> {{ linkedOpportunityTitle }}
      </p>
      <p v-if="!linkedClientName && !linkedOpportunityTitle" class="text-orange-700">
        Vinculado ao cadastro do cliente ou à oportunidade.
      </p>
    </div>

    <label class="block space-y-2 text-sm font-semibold text-slate-700">
      Cliente (opcional)
      <SearchSelect
        :model-value="clientId ?? ''"
        :options="clients"
        placeholder="Selecione o cliente"
        :disabled="clientsLoading || locked"
        @update:model-value="selectClient"
      />
      <span v-if="clientsLoading" class="text-xs font-normal text-slate-500">
        Carregando clientes…
      </span>
    </label>

    <label class="block space-y-2 text-sm font-semibold text-slate-700">
      Oportunidade (opcional)
      <SearchSelect
        :model-value="opportunityId ?? ''"
        :options="opportunities"
        :placeholder="clientId ? 'Selecione a oportunidade' : 'Selecione primeiro um cliente'"
        :disabled="!clientId || opportunitiesLoading || locked"
        @update:model-value="selectOpportunity"
      />
      <span v-if="opportunitiesLoading" class="text-xs font-normal text-slate-500">
        Carregando oportunidades…
      </span>
    </label>
  </section>
</template>
