<script setup lang="ts">
import ListTable from '@/components/ui/ListTable.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import type { Product } from '../api'
import type { ProductCategoryOption } from '../types/forms'

defineProps<{
  products: Product[]
  categories: ProductCategoryOption[]
  canUpdate: boolean
  canPromote: boolean
  busy: boolean
  money: (value: unknown) => string
  promotionPrice: (product: Product) => string | null
}>()
const emit = defineEmits<{ edit: [product: Product]; promotion: [product: Product] }>()
</script>
<template>
      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ListTable min-width="760px">
          <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-4">Produto</th>
              <th class="px-4 py-4">Operadora</th>
              <th class="px-4 py-4">Categoria</th>
              <th class="px-4 py-4 text-right">Preço</th>
              <th class="px-4 py-4">Promoção vigente</th>
              <th class="px-4 py-4">Situação</th>
              <th v-if="canUpdate || canPromote" class="px-5 py-4 text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="p in products" :key="p.id" class="hover:bg-stone-50/70">
              <td class="px-5 py-4">
                <p class="font-semibold text-slate-800">{{ p.name }}</p>
                <p
                  v-if="p.description"
                  class="mt-1 max-w-64 truncate text-xs text-slate-500"
                  :title="p.description"
                >
                  {{ p.description }}
                </p>
              </td>
              <td class="px-4 py-4 text-slate-600">{{ p.operator?.name }}</td>
              <td class="px-4 py-4 text-slate-600">
                {{ categories.find((c) => c[0] === p.category)?.[1] }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-right font-semibold">
                {{ money(p.price) }}
              </td>
              <td class="px-4 py-4">
                <span v-if="promotionPrice(p)" class="font-medium text-emerald-700">{{
                  promotionPrice(p)
                }}</span
                ><span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-4 py-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="
                    p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-slate-500'
                  "
                  >{{ p.is_active ? 'Ativo' : 'Inativo' }}</span
                >
              </td>
              <td
                v-if="canUpdate || canPromote"
                class="whitespace-nowrap px-5 py-4 text-right"
              >
                <TableActionButton
                  v-if="canUpdate"
                  icon="edit"
                  :label="`Editar ${p.name}`"
                  :disabled="busy"
                  @click="emit('edit', p)"
                /><TableActionButton
                  v-if="canPromote"
                  icon="tag"
                  :label="`Gerenciar promoções de ${p.name}`"
                  :disabled="busy"
                  @click="emit('promotion', p)"
                />
              </td>
            </tr>
            <tr v-if="!products.length">
              <td
                :colspan="canUpdate || canPromote ? 7 : 6"
                class="px-5 py-12 text-center text-slate-500"
              >
                {{
                  products.length
                    ? 'Nenhum produto corresponde aos filtros.'
                    : 'Nenhum produto cadastrado.'
                }}
              </td>
            </tr>
          </tbody>
        </ListTable>
      </section>

</template>
