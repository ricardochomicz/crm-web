<script setup lang="ts">
import { toRefs } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import FormError from '@/components/ui/FormError.vue'
import { digits } from '@/lib/masks'
import type { ClientInput, Classification, Seller, ClientTransferLookup } from '../api'
import type { TenantOperator } from '@/features/operators/api'
const props = defineProps<{
  form: ClientInput
  editing: string
  busy: boolean
  operators: TenantOperator[]
  classesForOperator: Classification[]
  sellers: Seller[]
  showSellerSelect: boolean
  validationState: {
    errors: Record<string, string>
    invalid: (field: keyof ClientInput) => boolean
    clear: (field?: keyof ClientInput) => void
  }
  cepBusy: boolean
  cepMessage: string
  duplicate: ClientTransferLookup | null
  checkingDocument: boolean
  transferBusy: boolean
}>()
const emit = defineEmits<{ save: []; cancel: []; lookupCep: []; checkDocument: []; requestTransfer: [] }>()
const documentModel = defineModel<string>('documentModel', { required: true })
const phoneModel = defineModel<string>('phoneModel', { required: true })
const cepModel = defineModel<string>('cepModel', { required: true })
const lookupCep = () => emit('lookupCep')
const { form, editing, busy, operators, classesForOperator, sellers, showSellerSelect, validationState, cepBusy, cepMessage } = toRefs(props)
</script>
<template>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
    >
      <form
        novalidate
        class="max-h-[94dvh] w-full max-w-6xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6"
        @submit.prevent="emit('save')"
      >
        <h2 class="text-xl font-semibold">{{ editing ? 'Editar cliente' : 'Novo cliente' }}</h2>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label class="text-sm"
            >Tipo de pessoa<SearchSelect
              v-model="form.person_type"
              :options="[
                { value: 'PJ', label: 'Pessoa jurídica' },
                { value: 'PF', label: 'Pessoa física' },
              ]"
          /></label>
          <label class="text-sm"
            >CPF/CNPJ<input
              v-model="documentModel"
              class="field"
              :aria-invalid="validationState.invalid('document')"
              :class="validationState.invalid('document') ? 'ring-2 ring-red-400 bg-red-50' : ''"
              @input="validationState.clear('document')"
              :maxlength="form.person_type === 'PF' ? 14 : 18"
              inputmode="numeric" @blur="emit('checkDocument')" /><FormError :message="validationState.errors.document"
          /></label>
          <div v-if="!editing && (checkingDocument || duplicate?.exists)" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm md:col-span-2 xl:col-span-3">
            <p v-if="checkingDocument">Verificando cadastro...</p>
            <template v-else-if="duplicate?.exists">
              <p class="font-semibold text-amber-900">Este CPF/CNPJ já está cadastrado neste tenant.</p>
              <p class="mt-1">Responsável: {{ duplicate.owner_name ?? 'Não identificado' }}.</p>
              <p v-if="duplicate.assigned_to_me" class="mt-1">Este cliente já pertence à sua carteira.</p>
              <template v-else>
                <p class="mt-1" v-if="duplicate.transfer?.eligible">O cliente atende aos critérios para solicitar transferência, sujeita à aprovação do supervisor.</p>
                <p v-else class="mt-1">Transferência indisponível: é necessário mais de 90 dias sem interação e nenhum pedido ou oportunidade em andamento.</p>
                <button v-if="duplicate.transfer?.eligible" type="button" class="primary-button mt-3" :disabled="transferBusy" @click="emit('requestTransfer')">
                  {{ transferBusy ? 'Solicitando...' : 'Solicitar transferência de carteira' }}
                </button>
              </template>
            </template>
          </div>
          <label class="text-sm md:col-span-2 xl:col-span-3"
            >Razão social / nome completo<input
              v-model="form.company_name"
              class="field"
              :aria-invalid="validationState.invalid('company_name')"
              :class="
                validationState.invalid('company_name') ? 'ring-2 ring-red-400 bg-red-50' : ''
              "
              @input="validationState.clear('company_name')" /><FormError
              :message="validationState.errors.company_name"
          /></label>
          <label class="text-sm"
            >Telefone<input
              v-model="phoneModel"
              class="field"
              :aria-invalid="validationState.invalid('phone')"
              :class="validationState.invalid('phone') ? 'ring-2 ring-red-400 bg-red-50' : ''"
              @input="validationState.clear('phone')"
              inputmode="tel"
              maxlength="15" /><FormError :message="validationState.errors.phone" /></label
          ><label class="text-sm"
            >E-mail<input
              v-model="form.email"
              type="email"
              class="field"
              :aria-invalid="validationState.invalid('email')"
              :class="validationState.invalid('email') ? 'ring-2 ring-red-400 bg-red-50' : ''"
              @input="validationState.clear('email')" /><FormError
              :message="validationState.errors.email"
          /></label>
          <label class="text-sm"
            >CEP
            <div class="flex gap-2">
              <input
                v-model="cepModel"
                class="field min-w-0"
                :aria-invalid="validationState.invalid('zip_code')"
                :class="validationState.invalid('zip_code') ? 'ring-2 ring-red-400 bg-red-50' : ''"
                @input="validationState.clear('zip_code')"
                inputmode="numeric"
                maxlength="9"
                placeholder="00000-000"
                @blur="digits(form.zip_code, 8).length === 8 && lookupCep()"
              /><button
                type="button"
                class="shrink-0 rounded-xl border border-stone-200 px-3 text-xs"
                :disabled="cepBusy"
                @click="lookupCep"
              >
                {{ cepBusy ? 'Buscando...' : 'Buscar CEP' }}
              </button>
            </div>
            <span v-if="cepMessage" class="mt-1 block text-xs text-slate-500" role="status">{{
              cepMessage
            }}</span
            ><FormError :message="validationState.errors.zip_code" /></label
          ><label class="text-sm">Endereço<input v-model="form.address" class="field" /></label>
          <label class="text-sm">Número<input v-model="form.address_number" class="field" /></label
          ><label class="text-sm"
            >Complemento<input v-model="form.address_complement" class="field"
          /></label>
          <label class="text-sm">Bairro<input v-model="form.neighborhood" class="field" /></label
          ><label class="text-sm">Cidade<input v-model="form.city" class="field" /></label>
          <label class="text-sm"
            >Estado<input
              v-model="form.state"
              maxlength="2"
              class="field"
              :aria-invalid="validationState.invalid('state')"
              :class="validationState.invalid('state') ? 'ring-2 ring-red-400 bg-red-50' : ''"
              @input="validationState.clear('state')" /><FormError
              :message="validationState.errors.state"
          /></label>
          <label class="text-sm"
            >Operadora atual<SearchSelect
              v-model="form.operator_id"
              :options="[
                { value: '', label: 'Sem operadora' },
                ...operators.map((o) => ({ value: o.id, label: o.name })),
              ]"
              @update:model-value="form.classification_id = null" /><FormError
              :message="validationState.errors.operator_id"
          /></label>
          <label class="text-sm"
            >Classificação<SearchSelect
              v-model="form.classification_id"
              :options="[
                { value: '', label: 'Sem classificação' },
                ...classesForOperator.map((c) => ({ value: c.id, label: c.code + ' · ' + c.name })),
              ]" /><FormError :message="validationState.errors.classification_id"
          /></label>
          <label v-if="showSellerSelect" class="text-sm"
            >Vendedor responsável<SearchSelect
              v-model="form.seller_membership_id"
              :options="[
                { value: '', label: 'Sem vendedor' },
                ...sellers.map((s) => ({ value: s.id, label: s.name })),
              ]"
          /></label>
        </div>
        <label class="flex gap-2 text-sm"
          ><input v-model="form.is_active" type="checkbox" />Cliente ativo</label
        >
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg border px-4 py-2" @click="emit('cancel')">
            Cancelar</button
          ><button type="submit" class="primary-button w-auto" :disabled="busy">
            {{ busy ? 'Salvando...' : 'Salvar cliente' }}
          </button>
        </div>
      </form>
    </div>
</template>
