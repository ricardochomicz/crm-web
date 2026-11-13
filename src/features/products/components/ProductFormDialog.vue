<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import type { ProductFormValues, ProductFormErrors, ProductCategoryOption } from '../types/forms'

defineProps<{
  open: boolean
  editing: boolean
  busy: boolean
  form: ProductFormValues
  errors: ProductFormErrors
  operators: { id: number; name: string }[]
  categories: ProductCategoryOption[]
}>()
const priceDisplay = defineModel<string>('priceDisplay', { required: true })
const emit = defineEmits<{ close: []; save: [] }>()
</script>
<template>
  <AppDialog :open="open" :busy="busy" size="medium" :title="editing ? 'Editar produto' : 'Novo produto'" @close="emit('close')">
        <form class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="emit('save')">
          <label class="text-sm"
            >Nome<input v-model="form.name" :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'form-name-error' : undefined" required maxlength="180" class="field"
          /><span v-if="errors.name" id="form-name-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.name }}</span></label>
          <label class="text-sm"
            >Operadora<SearchSelect
              v-model="form.operator_id" :aria-invalid="!!errors.operator_id" :aria-describedby="errors.operator_id ? 'form-operator_id-error' : undefined"
              :options="operators.map((o) => ({ value: o.id, label: o.name }))"
              required
          /><span v-if="errors.operator_id" id="form-operator_id-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.operator_id }}</span></label>
          <label class="text-sm"
            >Categoria<SearchSelect
              v-model="form.category" :aria-invalid="!!errors.category" :aria-describedby="errors.category ? 'form-category-error' : undefined"
              :options="categories.map((c) => ({ value: c[0]!, label: c[1]! }))"
              placeholder="Selecione uma categoria" required
          /><span v-if="errors.category" id="form-category-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.category }}</span></label>
          <label class="text-sm"
            >Preço (R$)<input
              v-model="priceDisplay" :aria-invalid="!!errors.price" :aria-describedby="errors.price ? 'priceDisplay-error' : undefined"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="R$ 0,00"
              required
              class="field"
          /><span v-if="errors.price" id="priceDisplay-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.price }}</span></label>
          <label class="text-sm sm:col-span-2"
            >Descrição<textarea v-model="form.description" class="field" rows="3" />
          </label>
          <label class="flex items-center gap-2 text-sm"
            ><input v-model="form.is_active" type="checkbox" /> Produto ativo</label
          >
          <div class="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              class="rounded-lg border px-5 py-2.5"
              :disabled="busy"
              @click="emit('close')"
            >
              Cancelar</button
            ><button class="primary-button w-auto" :disabled="busy">
              {{ busy ? 'Salvando…' : 'Salvar produto' }}
            </button>
          </div>
        </form>
  </AppDialog>
</template>
