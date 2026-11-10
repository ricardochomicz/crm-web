<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { Client, Classification } from '../api'

const props = defineProps<{ client: Client; classes: Classification[]; writable: boolean; busy: boolean }>()
const emit = defineEmits<{ save: [operatorId: number, classificationId: number] }>()
const selected = ref<Record<number, number | string>>({})
const operators = computed(() => {
  const entries = new Map<number, string>()
  for (const item of props.client.operator_classifications ?? []) entries.set(item.operator_id, item.operator_name ?? String(item.operator_id))
  for (const item of props.client.contract_renewals ?? []) if (item.operator_id != null) entries.set(item.operator_id, item.operator_name ?? String(item.operator_id))
  if (props.client.operator_id != null) entries.set(props.client.operator_id, props.client.operator?.name ?? String(props.client.operator_id))
  return [...entries].map(([id, name]) => ({ id, name }))
})
watch(() => props.client, () => { selected.value = {} })
function assigned(operatorId: number) {
  return props.client.operator_classifications?.find(item => item.operator_id === operatorId)?.classification_id
}
</script>

<template>
  <section class="space-y-3">
    <div>
      <h3 class="text-lg font-semibold text-slate-800">Operadoras e classificações</h3>
      <p class="text-sm text-slate-500">Uma classificação por operadora, compartilhada por todos os pedidos do cliente.</p>
    </div>
    <div v-for="operator in operators" :key="operator.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-4">
      <div class="min-w-32">
        <p class="font-semibold">{{ operator.name }}</p>
        <p class="text-xs text-slate-500">Atual: {{ client.operator_classifications?.find(item => item.operator_id === operator.id)?.classification_name ?? 'Não definida' }}</p>
      </div>
      <div v-if="writable" class="flex flex-1 flex-wrap items-center justify-end gap-2">
        <div class="min-w-48 max-w-72 flex-1">
          <SearchSelect :model-value="selected[operator.id] ?? assigned(operator.id) ?? ''"
            :options="[{ value: '', label: 'Selecione a classificação' }, ...classes.filter(c => c.operator_id === operator.id && (c.is_active || c.id === assigned(operator.id))).map(c => ({ value: c.id, label: c.name }))]"
            @update:model-value="selected[operator.id] = $event" />
        </div>
        <button type="button" class="primary-button w-auto" :disabled="busy || !Number(selected[operator.id] ?? assigned(operator.id)) || Number(selected[operator.id] ?? assigned(operator.id)) === assigned(operator.id)"
          @click="emit('save', operator.id, Number(selected[operator.id]))">Salvar</button>
      </div>
    </div>
    <p v-if="!operators.length" class="text-sm text-slate-500">Nenhuma operadora vinculada aos pedidos deste cliente.</p>
  </section>
</template>
