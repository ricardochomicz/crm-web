import { computed, nextTick, reactive, ref, watch, type Ref } from 'vue'
import { tenantApi } from '../api'
import { can, type CompanyDetails } from '../types'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'

export function useTenantDetails(tenantId: Ref<string>) {
let loadRequest = 0
const tenant = ref<CompanyDetails>()
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)
const uploadingLogo = ref(false)
const logoInput = ref<HTMLInputElement | null>(null)
const errors = ref<Record<string, string>>({})
const form = reactive({ name: '', trade_name: '', email: '', phone: '', timezone: '' })
const editable = computed(
  () => can(tenant.value, 'company.update') && !!tenant.value?.access?.allows_operational_writes,
)
function reset() {
  if (!tenant.value) return
  const company = tenant.value
  Object.assign(form, {
    name: company.name,
    trade_name: company.trade_name ?? '',
    email: company.email,
    phone: company.phone ?? '',
    timezone: company.timezone,
  })
  errors.value = {}
}
async function load() {
  const id = tenantId.value
  const request = ++loadRequest
  loading.value = true
  loadError.value = ''
  tenant.value = undefined
  try {
    const result = await tenantApi.details(id)
    if (id !== tenantId.value || request !== loadRequest) return
    tenant.value = result.data
    reset()
  } catch (failure) {
    if (id === tenantId.value && request === loadRequest) loadError.value = errorMessage(failure)
  } finally {
    if (id === tenantId.value && request === loadRequest) loading.value = false
  }
}
async function save() {
  if (busy.value || !editable.value) return
  errors.value = {}
  if (!form.name.trim()) errors.value.name = 'Informe o nome da empresa.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.value.email = 'Informe um e-mail válido.'
  if (!form.timezone.trim()) errors.value.timezone = 'Informe o fuso horário.'
  if (Object.keys(errors.value).length) {
    await nextTick()
    document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    return
  }
  const id = tenantId.value
  const data = {
    name: form.name.trim(),
    trade_name: form.trade_name.trim() || null,
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim() || null,
    timezone: form.timezone.trim(),
  }
  busy.value = true
  try {
    await tenantApi.update(id, data)
    if (id !== tenantId.value || !tenant.value) return
    tenant.value = { ...tenant.value, ...data }
    reset()
    toast.success('Dados da empresa atualizados com sucesso.')
  } catch (failure) {
    if (id !== tenantId.value) return
    toast.error(errorMessage(failure))
    if (failure instanceof ApiError) {
      errors.value = Object.fromEntries(
        Object.entries(failure.errors).map(([key, values]) => [
          key,
          values[0] ?? 'Confira este campo.',
        ]),
      )
    }
    await nextTick()
    document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
  } finally {
    busy.value = false
  }
}
async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editable.value || uploadingLogo.value) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    toast.error('Selecione uma imagem PNG, JPG ou WebP de até 2 MB.')
    input.value = ''
    return
  }
  uploadingLogo.value = true
  try {
    const id = tenantId.value
    const response = await tenantApi.uploadLogo(id, file)
    if (id === tenantId.value && tenant.value) tenant.value = { ...tenant.value, logo_url: response.data.logo_url + '?v=' + Date.now() }
    toast.success('Logo atualizada com sucesso.')
  } catch (failure) {
    toast.error(errorMessage(failure))
  } finally {
    uploadingLogo.value = false
    input.value = ''
  }
}
watch(tenantId, () => { void load() }, { immediate: true })
return {
  tenant, loading, loadError, busy, uploadingLogo, logoInput, errors, form,
  editable, reset, load, save, uploadLogo,
}
}
