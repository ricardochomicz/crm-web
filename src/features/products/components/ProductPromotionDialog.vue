<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import type { Product, ProductPromotion } from '../api'

defineProps<{
  open: boolean
  busy: boolean
  editing: boolean
  promo: { name: string; promotional_price: string; starts_at: string; ends_at: string; is_active: boolean }
  errors: Record<string, string>
  selectedProduct?: Product
  money: (value: unknown) => string
}>()
const promotionPriceDisplay = defineModel<string>('promotionPriceDisplay', { required: true })
const emit = defineEmits<{
  close: []
  save: []
  edit: [product: Product, promotion?: ProductPromotion]
}>()
</script>
<template>
  <AppDialog :open="open" :busy="busy" size="medium" :title="editing ? 'Editar promoção' : 'Promoções do produto'" @close="emit('close')">
        <div
          v-for="pr in selectedProduct?.promotions ?? []"
          :key="pr.id"
          class="mb-2 flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2 text-sm"
        >
          <span
            >{{ pr.name }} · {{ money(pr.promotional_price) }} · {{ pr.starts_at }} a
            {{ pr.ends_at }}</span
          ><button
            type="button"
            class="text-orange-700"
            @click="selectedProduct && emit('edit', selectedProduct, pr)"
          >
            Editar
          </button>
        </div>
        <form class="mt-5 grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="emit('save')">
          <label class="text-sm">Nome<input v-model="promo.name" :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'promo-name-error' : undefined" required class="field" /><span v-if="errors.name" id="promo-name-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.name }}</span></label>
          <label class="text-sm"
            >Preço promocional<input
              v-model="promotionPriceDisplay" :aria-invalid="!!errors.promotional_price" :aria-describedby="errors.promotional_price ? 'promotionPriceDisplay-error' : undefined"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="R$ 0,00"
              required
              class="field"
          /><span v-if="errors.promotional_price" id="promotionPriceDisplay-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.promotional_price }}</span></label>
          <label class="text-sm"
            >Início<input v-model="promo.starts_at" :aria-invalid="!!errors.starts_at" :aria-describedby="errors.starts_at ? 'promo-starts_at-error' : undefined" type="date" required class="field"
          /><span v-if="errors.starts_at" id="promo-starts_at-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.starts_at }}</span></label>
          <label class="text-sm"
            >Término<input v-model="promo.ends_at" :aria-invalid="!!errors.ends_at" :aria-describedby="errors.ends_at ? 'promo-ends_at-error' : undefined" type="date" required class="field"
          /><span v-if="errors.ends_at" id="promo-ends_at-error" class="mt-1 block text-xs text-red-600" role="alert">{{ errors.ends_at }}</span></label>
          <label class="flex items-center gap-2 text-sm"
            ><input v-model="promo.is_active" type="checkbox" /> Promoção ativa</label
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
              {{ busy ? 'Salvando…' : 'Salvar promoção' }}
            </button>
          </div>
        </form>
        <button
          v-if="editing"
          type="button"
          class="mt-3 text-sm text-orange-700"
          @click="selectedProduct && emit('edit', selectedProduct)"
        >
          Cadastrar outra promoção
        </button>

  </AppDialog>
</template>
