<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import ProductsListFilters from '../components/ProductsListFilters.vue'
import ProductsTable from '../components/ProductsTable.vue'
import ProductFormDialog from '../components/ProductFormDialog.vue'
import ProductPromotionDialog from '../components/ProductPromotionDialog.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
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
      <ProductsTable :products="products" :categories="categories"
        :can-update="canUpdateWritable" :can-promote="canPromoteWritable"
        :busy="busy" :money="money" :promotion-price="promotionPrice"
        @edit="edit" @promotion="promotion" />
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
