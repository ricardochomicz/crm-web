<script setup lang="ts">
import { computed, ref } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import FormActions from '@/components/ui/FormActions.vue'
import { productivityApi, type ProductivityRow } from '../api'

const props = defineProps<{ tenantId: string; from: string; to: string; rows: ProductivityRow[] }>()
const emit = defineEmits<{ saved: [] }>()
const consultantId = ref('')
const amount = ref<number | null>(null)
const busy = ref(false)
const error = ref('')
const success = ref('')
const month = computed(() => props.from.slice(0, 7) === props.to.slice(0, 7) ? props.from.slice(0, 7) + '-01' : '')
async function save() {
  if (!month.value || !consultantId.value || amount.value === null || amount.value < 0 || !Number.isFinite(amount.value)) {
    error.value = 'Selecione um consultor e informe uma meta válida.'
    return
  }
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    await productivityApi.saveMonthlyTarget(props.tenantId, { tenant_user_id: consultantId.value, month: month.value, amount: amount.value })
    success.value = 'Meta mensal salva.'
    emit('saved')
  } catch {
    error.value = 'Não foi possível salvar a meta. Verifique suas permissões.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section v-if="month" class="rounded-xl border border-stone-200 bg-white p-5">
    <h2 class="font-semibold text-slate-800">Definir meta mensal de vendas</h2>
    <p class="mt-1 text-sm text-slate-500">Mês de referência: {{ month.slice(0, 7) }}. Somente gestores autorizados podem salvar.</p>
    <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="save">
      <div class="min-w-52 flex-1">
        <label class="mb-1 block text-sm font-medium">Consultor</label>
        <SearchSelect v-model="consultantId" :options="[{ value: '', label: 'Selecione' }, ...rows.map(row => ({ value: row.id, label: row.name }))]" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="monthly-target-amount">Meta (R$)</label>
        <input id="monthly-target-amount" v-model.number="amount" type="number" min="0" step="0.01" class="field w-44" required />
      </div>
      <FormActions :busy="busy" submit-label="Salvar meta" :show-cancel="false" />
    </form>
    <p v-if="error" role="alert" class="mt-2 text-sm text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="mt-2 text-sm text-green-700">{{ success }}</p>
  </section>
</template>
