<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { maskCpf, maskBrazilianPhone, onlyDigits } from '@/lib/masks'
import { errorMessage } from '@/lib/feedback'
import { teamApi } from '../api'
import type { Member, MemberProfile, MemberProfileInput } from '../types'

const props = defineProps<{
  tenantId: string
  member: Member | null
  canEdit: boolean
  canWrite: boolean
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const profile = ref<MemberProfile | null>(null)
const section = ref<'personal' | 'professional'>('personal')
const form = ref<MemberProfileInput>({
  cpf: null, birth_date: null, mobile_phone: null,
  secondary_phone: null, hired_at: null, employee_code: null,
})
const cpfModel = computed({ get: () => maskCpf(form.value.cpf), set: (v: string) => { form.value.cpf = onlyDigits(v).slice(0, 11) || null } })
const mobileModel = computed({ get: () => maskBrazilianPhone(form.value.mobile_phone), set: (v: string) => { form.value.mobile_phone = onlyDigits(v).slice(0, 11) || null } })
const secondaryModel = computed({ get: () => maskBrazilianPhone(form.value.secondary_phone), set: (v: string) => { form.value.secondary_phone = onlyDigits(v).slice(0, 11) || null } })
const birthDateModel = computed({ get: () => form.value.birth_date ?? '', set: (v: string) => { form.value.birth_date = v || null } })
const hiredDateModel = computed({ get: () => form.value.hired_at ?? '', set: (v: string) => { form.value.hired_at = v || null } })
const employeeCodeModel = computed({ get: () => form.value.employee_code ?? '', set: (v: string) => { form.value.employee_code = v || null } })
const editable = computed(() => props.canEdit && props.canWrite)
let requestVersion = 0

watch(() => props.member?.id, async (id) => {
  const version = ++requestVersion
  profile.value = null
  error.value = ''
  section.value = 'personal'
  if (!id) return
  loading.value = true
  try {
    const response = await teamApi.profile(props.tenantId, id)
    if (version !== requestVersion) return
    profile.value = response.data
    form.value = {
      cpf: response.data.cpf,
      birth_date: response.data.birth_date,
      mobile_phone: response.data.mobile_phone,
      secondary_phone: response.data.secondary_phone,
      hired_at: response.data.hired_at,
      employee_code: response.data.employee_code,
    }
  } catch (failure) {
    if (version === requestVersion) error.value = errorMessage(failure)
  } finally {
    if (version === requestVersion) loading.value = false
  }
}, { immediate: true })

async function submit() {
  if (!props.member || !editable.value || saving.value || loading.value) return
  saving.value = true
  error.value = ''
  try {
    await teamApi.updateProfile(props.tenantId, props.member.id, {
      cpf: form.value.cpf?.replace(/\D/g, '') || null,
      birth_date: form.value.birth_date || null,
      mobile_phone: form.value.mobile_phone || null,
      secondary_phone: form.value.secondary_phone || null,
      hired_at: form.value.hired_at || null,
      employee_code: form.value.employee_code || null,
    })
    emit('saved')
  } catch (failure) {
    error.value = errorMessage(failure)
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <AppDialog :open="!!member" title="Cadastro do colaborador"
    description="Dados complementares vinculados a esta empresa."
    :busy="saving" @close="emit('close')">
    <div v-if="loading" role="status" class="py-8 text-sm text-slate-500">Carregando cadastro…</div>
    <div v-else-if="profile" class="space-y-5">
      <div class="rounded-xl bg-stone-50 p-4">
        <p class="font-semibold text-slate-800">{{ profile.name }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ profile.email }}</p>
      </div>
      <div role="tablist" aria-label="Dados do colaborador" class="flex gap-2">
        <button type="button" role="tab" :aria-selected="section === 'personal'"
          class="rounded-lg px-3 py-2 text-sm" :class="section === 'personal' ? 'bg-slate-800 text-white' : 'bg-stone-100'"
          @click="section = 'personal'">Dados pessoais</button>
        <button type="button" role="tab" :aria-selected="section === 'professional'"
          class="rounded-lg px-3 py-2 text-sm" :class="section === 'professional' ? 'bg-slate-800 text-white' : 'bg-stone-100'"
          @click="section = 'professional'">Dados profissionais</button>
      </div>
      <form id="member-profile-form" class="space-y-4" @submit.prevent="submit">
        <fieldset :disabled="!editable || saving" class="space-y-4">
          <template v-if="section === 'personal'">
            <FormField id="member-cpf" v-model="cpfModel" label="CPF (opcional)" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="000.000.000-00" />
            <FormField id="member-birth-date" v-model="birthDateModel" label="Data de nascimento" type="date" />
            <FormField id="member-mobile" v-model="mobileModel" label="Celular / WhatsApp" type="tel" maxlength="15" placeholder="(00) 00000-0000" />
            <FormField id="member-secondary" v-model="secondaryModel" label="Telefone secundário" type="tel" maxlength="15" placeholder="(00) 00000-0000" />
          </template>
          <template v-else>
            <FormField id="member-hired-at" v-model="hiredDateModel" label="Data de admissão" type="date" />
            <FormField id="member-employee-code" v-model="employeeCodeModel" label="Matrícula / código interno" maxlength="50" />
            <p class="text-xs leading-5 text-slate-500">Cargo, equipe e situação são administrados pelas ações específicas da equipe.</p>
          </template>
        </fieldset>
        <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
        <div class="flex justify-end gap-3 border-t border-stone-100 pt-4">
          <button type="button" class="secondary-button" @click="emit('close')">Fechar</button>
          <button v-if="editable" type="submit" class="primary-button w-auto" :disabled="saving">
            {{ saving ? 'Salvando…' : 'Salvar cadastro' }}
          </button>
        </div>
      </form>
    </div>
    <div v-else class="space-y-3">
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <button type="button" class="secondary-button" @click="emit('close')">Fechar</button>
    </div>
  </AppDialog>
</template>
