<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ListTable from '@/components/ui/ListTable.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ProductsListFilters from '../components/ProductsListFilters.vue'
import ProductFormDialog from '../components/ProductFormDialog.vue'
import ProductPromotionDialog from '../components/ProductPromotionDialog.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import { useProductsPage } from '../composables/useProductsPage'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const {
  tenant,
  products,
  productPage,
  lastPage,
  totalProducts,
  filtersLoading,
  nameFilter,
  operatorFilter,
  categoryFilter,
  statusFilter,
  loadProducts,
  applyFilters,
  clearFilters,
  operators,
  loading,
  busy,
  error,
  categories,
  form,
  productErrors,
  promotionErrors,
  editingId,
  promoEditingId,
  promo,
  productModalOpen,
  promotionModalOpen,
  money,
  priceDisplay,
  promotionPriceDisplay,
  promotionPrice,
  selectedProduct,
  newProduct,
  closeProduct,
  closePromotion,
  canCreateWritable,
  canUpdateWritable,
  canPromoteWritable,
  load,
  edit,
  save,
  promotion,
  savePromotion,
} = useProductsPage(tenantId)
</script>
<template>
  <AppShell :tenant="tenant" title="Produtos e planos" subtitle="Catálogo comercial">
    <header class="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="eyebrow">CATÁLOGO COMERCIAL</p>
        <h1 class="mt-3 text-3xl font-semibold">Produtos e planos</h1>
        <p class="mt-2 text-sm text-slate-500">
          Consulte e organize os produtos comercializados pela empresa.
        </p>
      </div>
      <button
        v-if="canCreateWritable && !loading"
        class="primary-button w-auto"
        type="button"
        @click="newProduct"
      >
        + Novo produto
      </button>
    </header>
    <AsyncNotice :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <ProductsListFilters v-model:name="nameFilter" v-model:operator="operatorFilter"
        v-model:category="categoryFilter" v-model:status="statusFilter"
        :total="totalProducts" :busy="filtersLoading" :operators="operators" :categories="categories"
        @search="applyFilters" @clear="clearFilters" />
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
              <th v-if="canUpdateWritable || canPromoteWritable" class="px-5 py-4 text-right">
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
                v-if="canUpdateWritable || canPromoteWritable"
                class="whitespace-nowrap px-5 py-4 text-right"
              >
                <TableActionButton
                  v-if="canUpdateWritable"
                  icon="edit"
                  :label="`Editar ${p.name}`"
                  :disabled="busy"
                  @click="edit(p)"
                /><TableActionButton
                  v-if="canPromoteWritable"
                  icon="tag"
                  :label="`Gerenciar promoções de ${p.name}`"
                  :disabled="busy"
                  @click="promotion(p)"
                />
              </td>
            </tr>
            <tr v-if="!products.length">
              <td
                :colspan="canUpdateWritable || canPromoteWritable ? 7 : 6"
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
      <PagePagination
        :page="productPage"
        :last-page="lastPage"
        :total="totalProducts"
        :busy="filtersLoading"
        @change="loadProducts"
      />
    </template>

    <ProductFormDialog :open="productModalOpen && (editingId ? canUpdateWritable : canCreateWritable)"
      :editing="!!editingId" :busy="busy" :form="form" :errors="productErrors"
      :operators="operators" :categories="categories" v-model:price-display="priceDisplay"
      @close="closeProduct" @save="save" />
    <ProductPromotionDialog :open="promotionModalOpen && canPromoteWritable"
      :editing="!!promoEditingId" :busy="busy" :promo="promo" :errors="promotionErrors"
      :selected-product="selectedProduct" :money="money"
      v-model:promotion-price-display="promotionPriceDisplay"
      @close="closePromotion" @save="savePromotion" @edit="promotion" />
  </AppShell>
</template>
